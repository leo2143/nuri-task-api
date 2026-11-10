import mongoose from 'mongoose';
import { runMigration } from './support/cli.js';
import { DEFAULT_TIMEZONE } from '../../services/helpers/dateTime.js';

/**
 * S1: asigna la zona de producto (DEFAULT_TIMEZONE) a los usuarios que no tienen `timezone`
 * y se asegura el índice { timezone: 1 }.
 *
 * NO reescribe grafías existentes: dos grafías de una misma zona son válidas y el dispatcher las agrupa por clave canónica.
 * Idempotente: el filtro solo encuentra usuarios sin zona, una segunda corrida no modifica nada.
 *
 *   node scripts/migrations/s1-user-timezone.js            (dry-run)
 *   node scripts/migrations/s1-user-timezone.js --apply
 *   node scripts/migrations/s1-user-timezone.js --restore --apply
 *
 * El backup guarda los documentos completos de los usuarios afectados (incluye hashes de contraseña):
 * queda en scripts/migrations/backups/ (ignorado por git), no lo compartas ni lo subas.
 * Un --restore pisa el documento completo, usalo solo poco después de la corrida.
 */
const MISSING_TIMEZONE_FILTER = { timezone: { $in: [null, ''] } };

await runMigration({
  name: 's1-user-timezone',
  handlers: {
    async run({ apply, log, backup }) {
      const users = mongoose.connection.collection('users');

      const usersWithoutTimezone = await users.find(MISSING_TIMEZONE_FILTER).toArray();
      log(`Usuarios sin zona horaria: ${usersWithoutTimezone.length} (se les asignaría ${DEFAULT_TIMEZONE})`);

      const hasTimezoneIndex = (await users.indexes()).some(
        index => Object.keys(index.key).length === 1 && index.key.timezone === 1
      );
      log(`Índice { timezone: 1 }: ${hasTimezoneIndex ? 'existe' : 'falta'}`);

      if (!apply) return;

      if (usersWithoutTimezone.length > 0) {
        const backupPath = backup({ collection: 'users', documents: usersWithoutTimezone });
        log(`Backup: ${backupPath}`);

        const result = await users.updateMany(MISSING_TIMEZONE_FILTER, { $set: { timezone: DEFAULT_TIMEZONE } });
        log(`Modificados: ${result.modifiedCount}`);
      }

      if (!hasTimezoneIndex) {
        await users.createIndex({ timezone: 1 });
        log('Índice { timezone: 1 } creado');
      }
    },
  },
});
