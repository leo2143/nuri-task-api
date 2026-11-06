import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const { EJSON } = mongoose.mongo.BSON;

const BACKUPS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'backups');

/**
 * Interpreta los flags de una migración.
 *   --dry-run            (por defecto) solo informa lo que cambiaría
 *   --apply              escribe en la base
 *   --step=<nombre>      paso de la migración (si la migración tiene varios)
 *   --restore            revierte desde un backup (--file=<ruta>, por defecto el más reciente del paso)
 *   --<clave>=<valor>    opciones propias de la migración (p. ej. --cutoff=2026-11-05T12:00:00Z)
 * @param {string[]} [argv]
 * @returns {{ apply: boolean, dryRun: boolean, restore: boolean, step: string|null, options: Object<string, string> }}
 */
export function parseMigrationArgs(argv = process.argv.slice(2)) {
  const flags = new Set();
  const options = {};

  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, ...rest] = arg.slice(2).split('=');
    if (rest.length > 0) {
      options[key] = rest.join('=');
    } else {
      flags.add(key);
    }
  }

  if (flags.has('apply') && flags.has('dry-run')) {
    throw new Error('Usá --apply o --dry-run, no los dos a la vez');
  }

  const { step = null, ...otherOptions } = options;
  const apply = flags.has('apply');

  return { apply, dryRun: !apply, restore: flags.has('restore'), step, options: otherOptions };
}

/**
 * Exporta documentos a scripts/migrations/backups/<migración>[-<paso>]-<fecha>.json (EJSON) antes de modificarlos.
 * En dry-run no escribe nada y devuelve null.
 * @param {Object} params
 * @param {string} params.migration - Nombre de la migración
 * @param {string|null} [params.step] - Paso dentro de la migración
 * @param {string} params.collection - Nombre de la colección de origen
 * @param {Object[]} params.documents - Documentos completos a resguardar
 * @param {boolean} params.apply - Si es false no se escribe
 * @returns {string|null} Ruta del archivo escrito
 */
export function exportBackup({ migration, step = null, collection, documents, apply }) {
  if (!apply) return null;

  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = [migration, step, stamp].filter(Boolean).join('-') + '.json';
  const filePath = path.join(BACKUPS_DIR, fileName);

  const payload = { migration, step, collection, exportedAt: new Date(), documents };
  fs.writeFileSync(filePath, EJSON.stringify(payload, null, 2, { relaxed: false }));
  return filePath;
}

/**
 * Busca el backup más reciente de una migración (y paso).
 * @param {string} migration
 * @param {string|null} [step]
 * @returns {string|null} Ruta del archivo o null si no hay backups
 */
export function findLatestBackup(migration, step = null) {
  if (!fs.existsSync(BACKUPS_DIR)) return null;

  const prefix = [migration, step].filter(Boolean).join('-') + '-';
  const candidates = fs
    .readdirSync(BACKUPS_DIR)
    .filter(fileName => fileName.startsWith(prefix) && fileName.endsWith('.json'))
    .sort();

  return candidates.length > 0 ? path.join(BACKUPS_DIR, candidates[candidates.length - 1]) : null;
}

/**
 * Restaura los documentos de un backup con replaceOne por _id (upsert). Idempotente.
 * @param {Object} params
 * @param {string} params.filePath - Backup generado por exportBackup
 * @param {boolean} params.apply - Si es false solo informa
 * @param {(message: string) => void} params.log
 * @returns {Promise<number>} Cantidad de documentos restaurados (o que se restaurarían)
 */
export async function restoreBackup({ filePath, apply, log }) {
  const payload = EJSON.parse(fs.readFileSync(filePath, 'utf8'));
  const { collection, documents } = payload;

  log(`Backup ${path.basename(filePath)}: ${documents.length} documentos de "${collection}"`);
  if (!apply || documents.length === 0) return documents.length;

  await mongoose.connection.collection(collection).bulkWrite(
    documents.map(document => ({
      replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true },
    })),
    { ordered: false }
  );
  return documents.length;
}

/**
 * Corre una migración: conecta a MONGO_URI, elige el paso y cierra la conexión.
 * Es la única puerta de entrada: así todas las migraciones comparten --dry-run/--apply/--step/--restore.
 * @param {Object} params
 * @param {string} params.name - Nombre de la migración (se usa en logs y backups)
 * @param {Object} params.handlers
 * @param {(context: MigrationContext) => Promise<void>} [params.handlers.run] - Paso único (sin --step)
 * @param {Object<string, (context: MigrationContext) => Promise<void>>} [params.handlers.steps] - Pasos con nombre
 * @returns {Promise<void>}
 *
 * @typedef {Object} MigrationContext
 * @property {boolean} apply
 * @property {boolean} dryRun
 * @property {boolean} restore
 * @property {string|null} step
 * @property {Object<string, string>} options
 * @property {(message: string) => void} log
 * @property {(params: {collection: string, documents: Object[]}) => string|null} backup - Exporta antes de modificar (no-op en dry-run)
 */
export async function runMigration({ name, handlers }) {
  const args = parseMigrationArgs();
  const log = message => console.log(`[${name}${args.step ? `:${args.step}` : ''}] ${message}`);

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI no está configurada');
    process.exitCode = 1;
    return;
  }

  const context = {
    ...args,
    log,
    backup: ({ collection, documents }) =>
      exportBackup({ migration: name, step: args.step, collection, documents, apply: args.apply }),
  };

  try {
    await mongoose.connect(mongoUri);
    log(args.apply ? 'Modo --apply: se escribe en la base' : 'Modo --dry-run: no se escribe nada (usá --apply)');

    if (args.restore) {
      const filePath = args.options.file ?? findLatestBackup(name, args.step);
      if (!filePath) {
        throw new Error('No hay backup para restaurar (pasá --file=<ruta>)');
      }
      const restored = await restoreBackup({ filePath, apply: args.apply, log });
      log(`${args.apply ? 'Restaurados' : 'Se restaurarían'} ${restored} documentos`);
      return;
    }

    const handler = args.step ? handlers.steps?.[args.step] : handlers.run;
    if (!handler) {
      const available = Object.keys(handlers.steps ?? {}).join(', ') || '(ninguno)';
      throw new Error(
        args.step
          ? `Paso desconocido "${args.step}". Disponibles: ${available}`
          : `Indicá --step. Disponibles: ${available}`
      );
    }

    await handler(context);
  } catch (error) {
    console.error(`[${name}] Falló:`, error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
