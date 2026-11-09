import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { runMigration } from './support/cli.js';

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
 * Cada paso es idempotente. Antes de reiniciar filas se exportan a scripts/migrations/backups/ (ignorado por git);
 * `--restore` de `seed`, `reset` o `reset-in-progress` devuelve esas filas. El backup de `seed` guarda solo filas de
 * progreso: las definiciones viejas de los logros viven en el historial de git del JSON, y revertir NO reactiva los
 * logros (siguen inactivos hasta correr `--step=activate` a propósito).
 */
const SEED_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'resources',
  'moongo-scripts',
  'achievements-data.json'
);

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

async function resetProgressRows({ rows, apply, log, backup }) {
  log(`Filas a reiniciar: ${rows.length}`);
  if (!apply || rows.length === 0) return;

  const backupPath = backup({ collection: 'userachievements', documents: rows });
  log(`Backup: ${backupPath}`);

  const result = await mongoose.connection
    .collection('userachievements')
    .updateMany({ _id: { $in: rows.map(row => row._id) } }, { $set: PROGRESS_RESET });
  log(`Reiniciadas: ${result.modifiedCount}`);
}

await runMigration({
  name: 's5-achievements',
  handlers: {
    steps: {
      async seed({ apply, log, backup }) {
        const achievements = mongoose.connection.collection('achievements');
        const storedByTitle = await findSeedAchievementsByTitle();

        const changed = [];
        for (const seed of loadSeedsByTitle()) {
          const stored = storedByTitle.get(seed.title);
          if (!stored) {
            log(`"${seed.title}" no existe en la base: se omite`);
          } else if (hasSeedDefinition(stored, seed)) {
            log(`"${seed.title}" ya tiene la definición nueva`);
          } else {
            changed.push({ stored, seed });
          }
        }
        log(`Logros a actualizar (quedan inactivos): ${changed.map(({ seed }) => seed.title).join(', ') || 'ninguno'}`);

        const changedIds = changed.map(({ stored }) => stored._id);
        const inProgressFilter = {
          achievement: { $in: changedIds },
          status: { $ne: 'completed' },
          ...HAS_PROGRESS_FILTER,
        };
        const inProgressRows =
          changedIds.length > 0
            ? await mongoose.connection.collection('userachievements').find(inProgressFilter).toArray()
            : [];
        log(`Progreso en curso de esos logros: ${inProgressRows.length} filas`);

        if (!apply || changed.length === 0) return;

        // Primero las definiciones (inactivas): desde ahí nadie suma progreso nuevo y el backup de abajo es el definitivo
        for (const { stored, seed } of changed) {
          await achievements.updateOne(
            { _id: stored._id },
            {
              $set: {
                type: seed.type,
                triggerEvent: seed.triggerEvent,
                targetCount: seed.targetCount,
                conditions: seed.conditions ?? {},
                isActive: false,
              },
            }
          );
          log(`"${seed.title}" actualizado e inactivo`);
        }

        const rowsToReset = await mongoose.connection.collection('userachievements').find(inProgressFilter).toArray();
        await resetProgressRows({ rows: rowsToReset, apply, log, backup });
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
        const filter = { title: { $in: SEED_TITLES }, isActive: false };
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
