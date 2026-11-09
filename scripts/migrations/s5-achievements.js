import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { findLatestBackup, isBackupRestored, readBackup, runMigration } from './support/cli.js';

/**
 * S5: pasa los cuatro logros con condiciones a su nueva semántica y reinicia, en silencio, el progreso que se
 * ganó con la semántica vieja. No crea notificaciones: todo son escrituras directas sobre `achievements` y
 * `userachievements`.
 *
 * Los cuatro logros se identifican por TÍTULO EXACTO (ojo con el acento de "Drácula"):
 * Canto de Gallo, Drácula, Meta Flash y Re-Ordenar. Sus definiciones salen de
 * resources/moongo-scripts/achievements-data.json.
 *
 * Orden de operación (el deploy de la API es el paso 2):
 *   1. mongoexport de userachievements y achievements
 *   2. --step=seed          escribe las definiciones nuevas con isActive:false y reinicia el progreso EN CURSO.
 *                           Inactivos, la API vieja (todavía corriendo) no los otorga ni los notifica con la semántica vieja.
 *   3. deploy de la API     anotá la hora: es el --cutoff de los pasos siguientes
 *   4. --step=reset --cutoff=<ISO>              reinicia logros COMPLETADOS antes del cutoff (Canto de Gallo, Drácula,
 *                                               Re-Ordenar). Meta Flash se recalcula con datos reales y se conserva
 *                                               solo si el usuario tiene una meta cerrada dentro del límite de horas.
 *   5. --step=reset-in-progress --cutoff=<ISO>  repite el reinicio del progreso en curso (filas sin tocar desde antes del
 *                                               cutoff): cubre lo que la API vieja alcanzó a escribir entre 2 y 3
 *   6. --step=activate      activa los cuatro logros
 *   7. deploy del APP
 *
 *   node scripts/migrations/s5-achievements.js --step=seed                                (dry-run)
 *   node scripts/migrations/s5-achievements.js --step=seed --apply
 *   node scripts/migrations/s5-achievements.js --step=reset --cutoff=2026-11-10T15:00:00Z --apply
 *   node scripts/migrations/s5-achievements.js --step=reset-in-progress --cutoff=2026-11-10T15:00:00Z --apply
 *   node scripts/migrations/s5-achievements.js --step=activate --apply
 *   node scripts/migrations/s5-achievements.js --step=reset --restore --apply     (restaura el último backup de ese paso)
 *
 * Cada paso es idempotente. Antes de modificar se exporta a scripts/migrations/backups/ (ignorado por git) y SIEMPRE se
 * escribe un archivo con `--apply`, aunque no haya filas (así `--restore` nunca toma el backup de una corrida anterior).
 * Excepción: `seed` NO escribe backup cuando no hay nada que respaldar (ningún logro original ni fila de progreso por
 * reiniciar, y la corrida anterior no está pendiente); lo avisa en el log. Así repetir `seed` tras `activate` no deja un
 * backup vacío como el más reciente, que un `--restore` sin `--file` tomaría para no restaurar nada.
 * `--restore` de `reset` o `reset-in-progress` devuelve las filas de progreso. El backup de `seed` guarda los logros
 * ANTES de actualizarlos y las filas de progreso que reinicia, y `--restore` devuelve ambos (los logros vuelven con su
 * definición y su `isActive` previos).
 *
 * `seed` también guarda en su backup, como `meta.pendingActivationIds`, los logros que dejó inactivos esperando el
 * deploy: `activate` activa SOLO esos (un logro que un admin desactivó por su cuenta no se toca). Si `seed` se repite
 * (tras una falla a medias o por una corrida idempotente), esos ids se arrastran del backup anterior y el backup nuevo
 * es ACUMULATIVO: junta por _id los originales y las filas de progreso del anterior (gana el más antiguo) con los de
 * esta corrida, así `--restore` vuelve al estado previo al primer `seed` de la tanda.
 * Solo se acumula mientras la corrida anterior sigue PENDIENTE: tiene logros pendientes de activar, siguen inactivos y
 * el backup no se restauró. Tras `activate` o tras un `--restore` del seed, el próximo `seed` arranca un backup
 * nuevo solo con lo de su corrida (si no, un `--restore` posterior pisaría el progreso ganado desde entonces). Las
 * filas de progreso se deduplican por (usuario, logro) quedándose con la más antigua, para que restaurar no choque con
 * el índice único.
 */
const SEED_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'resources',
  'moongo-scripts',
  'achievements-data.json'
);

const MIGRATION_NAME = 's5-achievements';
const SEED_TITLES = ['Canto de Gallo', 'Drácula', 'Meta Flash', 'Re-Ordenar'];
const META_FLASH_TITLE = 'Meta Flash';
const MS_PER_HOUR = 60 * 60 * 1000;

const PROGRESS_RESET = { currentCount: 0, status: 'locked', completedAt: null, unlockedAt: null, window: null };

const HAS_PROGRESS_FILTER = { $or: [{ currentCount: { $gt: 0 } }, { window: { $ne: null } }] };

/** Definiciones nuevas, por título exacto. */
function loadSeedsByTitle() {
  const seeds = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  return SEED_TITLES.map(title => {
    const seed = seeds.find(candidate => candidate.title === title);
    if (!seed) {
      throw new Error(`El seed "${title}" no está en ${SEED_FILE}`);
    }
    return seed;
  });
}

/** Forma comparable de `conditions`: sin `sameWindow` equivale a `sameWindow: false`. */
function toComparableConditions(conditions) {
  return JSON.stringify({
    timeWindow: conditions?.timeWindow ? { start: conditions.timeWindow.start, end: conditions.timeWindow.end } : null,
    sameWindow: conditions?.sameWindow === true,
    maxDurationHours: conditions?.maxDurationHours ?? null,
  });
}

/** El logro guardado ya tiene la definición nueva (el estado activo no se compara a propósito). */
function hasSeedDefinition(stored, seed) {
  return (
    stored.type === seed.type &&
    stored.triggerEvent === seed.triggerEvent &&
    stored.targetCount === seed.targetCount &&
    toComparableConditions(stored.conditions) === toComparableConditions(seed.conditions)
  );
}

function parseCutoff(options) {
  const cutoff = new Date(options.cutoff);
  if (!options.cutoff || Number.isNaN(cutoff.getTime())) {
    throw new Error('Indicá --cutoff=<fecha ISO del deploy de la API>, por ejemplo --cutoff=2026-11-10T15:00:00Z');
  }
  return cutoff;
}

async function findSeedAchievementsByTitle() {
  const achievements = await mongoose.connection
    .collection('achievements')
    .find({ title: { $in: SEED_TITLES } })
    .toArray();
  return new Map(achievements.map(achievement => [achievement.title, achievement]));
}

/**
 * Usuarios (de la lista) con alguna meta cerrada dentro de las horas de Meta Flash, medido con datos reales
 * (`createdAt` y `firstCompletedAt` de la meta).
 */
async function findUsersWithQualifyingGoal(userIds, maxDurationHours) {
  const qualifyingUserIds = await mongoose.connection.collection('goals').distinct('userId', {
    userId: { $in: userIds },
    createdAt: { $type: 'date' },
    firstCompletedAt: { $type: 'date' },
    $expr: { $lte: [{ $subtract: ['$firstCompletedAt', '$createdAt'] }, maxDurationHours * MS_PER_HOUR] },
  });
  return new Set(qualifyingUserIds.map(String));
}

async function resetRowsById({ rows, log }) {
  if (rows.length === 0) return;

  const result = await mongoose.connection
    .collection('userachievements')
    .updateMany({ _id: { $in: rows.map(row => row._id) } }, { $set: PROGRESS_RESET });
  log(`Reiniciadas: ${result.modifiedCount}`);
}

async function resetProgressRows({ rows, apply, log, backup }) {
  log(`Filas a reiniciar: ${rows.length}`);

  // Con --apply el backup se escribe siempre, aunque no haya filas: `--restore` toma el más reciente
  const backupPath = backup({ collection: 'userachievements', documents: rows });
  if (backupPath) log(`Backup: ${backupPath}`);
  if (!apply) return;

  await resetRowsById({ rows, log });
}

/** Lo que dejó el último `seed --apply`: los ids de los logros pendientes de activar y sus documentos originales. */
function readLastSeedBackup() {
  const filePath = findLatestBackup(MIGRATION_NAME, 'seed');
  if (!filePath) return null;

  const { documents, related = [], meta } = readBackup(filePath);
  const progressRows = related.find(set => set.collection === 'userachievements')?.documents ?? [];
  return {
    filePath,
    originals: documents,
    progressRows,
    pendingActivationIds: meta?.pendingActivationIds ?? [],
    restored: isBackupRestored(filePath),
  };
}

/**
 * El backup del último `seed` solo sirve de base para acumular mientras esa corrida siga pendiente: no se restauró y
 * alguno de sus logros pendientes sigue inactivo (si ya se activaron, o se restauró, el estado previo dejó de ser vigente).
 */
async function isSeedBackupPending(lastSeedBackup) {
  if (!lastSeedBackup || lastSeedBackup.restored || lastSeedBackup.pendingActivationIds.length === 0) return false;

  const stillInactive = await mongoose.connection
    .collection('achievements')
    .countDocuments({ _id: { $in: lastSeedBackup.pendingActivationIds }, isActive: false });
  return stillInactive > 0;
}

/**
 * Une documentos por clave; ante una clave repetida gana el de `previousDocuments` (el estado más antiguo). Así el
 * backup de `seed` acumula mientras la tanda siga pendiente: repetir el paso no pierde las definiciones originales ni el
 * progreso que reinició el primero. Sin `previousDocuments` solo deduplica los actuales.
 */
function mergeKeepingPrevious(previousDocuments, currentDocuments, keyOf = document => String(document._id)) {
  const mergedByKey = new Map();
  for (const document of [...previousDocuments, ...currentDocuments]) {
    if (!mergedByKey.has(keyOf(document))) mergedByKey.set(keyOf(document), document);
  }
  return [...mergedByKey.values()];
}

/** Una fila de progreso es única por (usuario, logro): es el índice único que una restauración no debe violar. */
function progressRowKey(row) {
  return `${row.user}:${row.achievement}`;
}

await runMigration({
  name: MIGRATION_NAME,
  handlers: {
    steps: {
      async seed({ apply, log, backup }) {
        const achievements = mongoose.connection.collection('achievements');
        const startedAt = new Date();
        const storedByTitle = await findSeedAchievementsByTitle();
        // Solo se arrastra el backup anterior mientras esa corrida siga pendiente (ver cabecera)
        const latestSeedBackup = readLastSeedBackup();
        const lastSeedBackup = (await isSeedBackupPending(latestSeedBackup)) ? latestSeedBackup : null;
        if (latestSeedBackup && !lastSeedBackup)
          log('El backup de seed anterior ya no está pendiente: se escribe uno nuevo');
        const previousPendingIds = new Set((lastSeedBackup?.pendingActivationIds ?? []).map(String));

        // Pendientes: los que todavía no tienen la definición nueva y los que una corrida anterior ya actualizó pero
        // siguen inactivos esperando el deploy (si no, repetir el paso tras una falla los dejaría fuera)
        const changed = [];
        const carried = [];
        const outdatedDescriptions = [];
        for (const seed of loadSeedsByTitle()) {
          const stored = storedByTitle.get(seed.title);
          if (!stored) {
            log(`"${seed.title}" no existe en la base: se omite`);
            continue;
          }
          // La descripción no cambia qué cuenta como progreso: se corrige aparte, sin desactivar ni reiniciar
          if (stored.description !== seed.description) outdatedDescriptions.push({ stored, seed });

          if (!hasSeedDefinition(stored, seed)) {
            changed.push({ stored, seed });
          } else if (previousPendingIds.has(String(stored._id)) && stored.isActive === false) {
            carried.push({ stored, seed });
            log(`"${seed.title}" ya tiene la definición nueva y sigue pendiente de activar`);
          } else {
            log(`"${seed.title}" ya tiene la definición nueva`);
          }
        }
        log(`Logros a actualizar (quedan inactivos): ${changed.map(({ seed }) => seed.title).join(', ') || 'ninguno'}`);

        // Documentos originales: los de la base para los que se actualizan ahora, los del backup anterior para los arrastrados
        const previousOriginalsById = new Map((lastSeedBackup?.originals ?? []).map(doc => [String(doc._id), doc]));
        const originals = [
          ...changed.map(({ stored }) => stored),
          ...carried.map(({ stored }) => previousOriginalsById.get(String(stored._id)) ?? stored),
        ];
        const pendingIds = originals.map(original => original._id);
        for (const { stored } of outdatedDescriptions) {
          if (!pendingIds.some(pendingId => pendingId.equals(stored._id))) originals.push(stored);
        }
        log(`Descripciones a corregir: ${outdatedDescriptions.map(({ seed }) => seed.title).join(', ') || 'ninguna'}`);

        // El reinicio no depende de `changed`: cubre todo el progreso en curso anterior a este paso de los pendientes
        const inProgressRows =
          pendingIds.length > 0
            ? await mongoose.connection
                .collection('userachievements')
                .find({
                  achievement: { $in: pendingIds },
                  status: { $ne: 'completed' },
                  updatedAt: { $lt: startedAt },
                  ...HAS_PROGRESS_FILTER,
                })
                .toArray()
            : [];
        log(`Progreso en curso de esos logros: ${inProgressRows.length} filas`);

        // Un solo backup, ANTES de tocar nada. Acumulativo mientras la corrida anterior siga pendiente: lo más antiguo
        // gana, así `--restore` vuelve al origen. Sin nada que respaldar no se escribe: un backup vacío sería el más
        // reciente y un `--restore` sin `--file` lo tomaría para no restaurar nada
        if (!lastSeedBackup && originals.length === 0 && inProgressRows.length === 0) {
          log('Nada que respaldar: no se escribe backup');
        } else {
          const backupPath = backup({
            collection: 'achievements',
            documents: mergeKeepingPrevious(lastSeedBackup?.originals ?? [], originals),
            related: [
              {
                collection: 'userachievements',
                documents: mergeKeepingPrevious(lastSeedBackup?.progressRows ?? [], inProgressRows, progressRowKey),
              },
            ],
            meta: { pendingActivationIds: pendingIds },
          });
          if (backupPath) log(`Backup: ${backupPath}`);
        }
        if (!apply) return;

        for (const { stored, seed } of changed) {
          await achievements.updateOne(
            { _id: stored._id },
            {
              $set: {
                type: seed.type,
                triggerEvent: seed.triggerEvent,
                targetCount: seed.targetCount,
                conditions: seed.conditions ?? {},
                description: seed.description,
                isActive: false,
              },
            }
          );
          log(`"${seed.title}" actualizado e inactivo`);
        }

        const changedIds = new Set(changed.map(({ stored }) => String(stored._id)));
        for (const { stored, seed } of outdatedDescriptions) {
          if (changedIds.has(String(stored._id))) continue;
          await achievements.updateOne({ _id: stored._id }, { $set: { description: seed.description } });
          log(`"${seed.title}" con la descripción corregida`);
        }

        // Las filas escritas por la API vieja entre la lectura y la desactivación las cubre `reset-in-progress`
        await resetRowsById({ rows: inProgressRows, log });
      },

      async reset({ apply, log, backup, options }) {
        const cutoff = parseCutoff(options);
        const storedByTitle = await findSeedAchievementsByTitle();
        const metaFlashSeed = loadSeedsByTitle().find(seed => seed.title === META_FLASH_TITLE);

        const achievementIds = [...storedByTitle.values()].map(achievement => achievement._id);
        if (achievementIds.length === 0) {
          log('No hay logros semilla en la base: nada para reiniciar');
          return;
        }

        const completedRows = await mongoose.connection
          .collection('userachievements')
          .find({ achievement: { $in: achievementIds }, status: 'completed', completedAt: { $lt: cutoff } })
          .toArray();

        // Meta Flash solo se conserva si los datos reales lo respaldan
        const metaFlashId = storedByTitle.get(META_FLASH_TITLE)?._id;
        const metaFlashRows = completedRows.filter(row => row.achievement.equals(metaFlashId));
        const verifiedUserIds = await findUsersWithQualifyingGoal(
          metaFlashRows.map(row => row.user),
          metaFlashSeed.conditions.maxDurationHours
        );
        const rowsToReset = completedRows.filter(
          row => !row.achievement.equals(metaFlashId) || !verifiedUserIds.has(String(row.user))
        );

        log(`Completados antes de ${cutoff.toISOString()}: ${completedRows.length}`);
        log(`Meta Flash verificables (se conservan): ${completedRows.length - rowsToReset.length}`);
        await resetProgressRows({ rows: rowsToReset, apply, log, backup });
      },

      async 'reset-in-progress'({ apply, log, backup, options }) {
        const cutoff = parseCutoff(options);
        const storedByTitle = await findSeedAchievementsByTitle();
        const achievementIds = [...storedByTitle.values()].map(achievement => achievement._id);
        if (achievementIds.length === 0) {
          log('No hay logros semilla en la base: nada para reiniciar');
          return;
        }

        const staleRows = await mongoose.connection
          .collection('userachievements')
          .find({
            achievement: { $in: achievementIds },
            status: { $ne: 'completed' },
            updatedAt: { $lt: cutoff },
            ...HAS_PROGRESS_FILTER,
          })
          .toArray();

        await resetProgressRows({ rows: staleRows, apply, log, backup });
      },

      async activate({ apply, log }) {
        const lastSeedBackup = readLastSeedBackup();
        if (!lastSeedBackup) {
          throw new Error('No hay backup de seed: corré --step=seed --apply antes de activar');
        }

        // Solo los logros que el seed dejó inactivos; uno que un admin desactivó por su cuenta no se reactiva
        const filter = { _id: { $in: lastSeedBackup.pendingActivationIds }, isActive: false };
        const inactive = await mongoose.connection.collection('achievements').find(filter).toArray();
        log(`Logros inactivos a activar: ${inactive.map(achievement => achievement.title).join(', ') || 'ninguno'}`);

        if (!apply || inactive.length === 0) return;

        const result = await mongoose.connection.collection('achievements').updateMany(filter, {
          $set: { isActive: true },
        });
        log(`Activados: ${result.modifiedCount}`);
      },
    },
  },
});
