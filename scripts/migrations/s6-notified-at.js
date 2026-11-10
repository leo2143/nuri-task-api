import mongoose from 'mongoose';
import { runMigration } from './support/cli.js';

/**
 * S6: marca como ya avisados (`notifiedAt = completedAt`) todos los logros completados existentes, para que el
 * resumen de activación Premium solo cubra las finalizaciones silenciosas nuevas (sin resúmenes retroactivos).
 * Filtro idempotente: una segunda corrida no encuentra nada para modificar.
 *
 * ORDEN (OPS-S6):
 *   1. mongoexport de userachievements
 *   2. este script --apply ANTES del deploy de la API
 *   3. deploy de la API (anotá la hora)
 *   4. este script --apply de nuevo, ahora con --cutoff=<hora del deploy>
 *
 * La segunda corrida cubre lo que se completó entre la primera y el deploy. Pasá SIEMPRE --cutoff en ella: la API
 * nueva deja `notifiedAt: null` en las finalizaciones silenciosas (logro premium de un usuario free) y, sin cutoff, la
 * corrida las marcaría como avisadas y esos usuarios nunca recibirían su resumen. Con --cutoff solo se tocan filas
 * completadas ANTES de esa hora, que son las que la API vieja ya notificó.
 *
 *   node scripts/migrations/s6-notified-at.js            (dry-run)
 *   node scripts/migrations/s6-notified-at.js --apply
 *   node scripts/migrations/s6-notified-at.js --cutoff=2026-11-10T15:00:00Z --apply
 *   node scripts/migrations/s6-notified-at.js --restore --apply
 *
 * El backup guarda las filas afectadas antes del cambio. Un --restore pisa el documento completo: usalo solo poco
 * después de la corrida.
 */
function buildUnnotifiedFilter(cutoff) {
  const filter = { status: 'completed', notifiedAt: null };
  if (cutoff) filter.completedAt = { $lt: cutoff };
  return filter;
}

function parseOptionalCutoff(options) {
  if (options.cutoff === undefined) return null;

  const cutoff = new Date(options.cutoff);
  if (Number.isNaN(cutoff.getTime())) {
    throw new Error('--cutoff inválido: usá una fecha ISO, por ejemplo --cutoff=2026-11-10T15:00:00Z');
  }
  return cutoff;
}

await runMigration({
  name: 's6-notified-at',
  handlers: {
    async run({ apply, log, backup, options }) {
      const cutoff = parseOptionalCutoff(options);
      const userAchievements = mongoose.connection.collection('userachievements');
      const unnotifiedFilter = buildUnnotifiedFilter(cutoff);

      const unnotifiedRows = await userAchievements.find(unnotifiedFilter).toArray();
      log(
        `Logros completados sin notifiedAt${cutoff ? ` (completados antes de ${cutoff.toISOString()})` : ''}: ${unnotifiedRows.length}`
      );
      if (!cutoff) {
        log(
          'Atención: sin --cutoff esta corrida también marcaría finalizaciones silenciosas. Usalo después del deploy.'
        );
      }

      if (!apply || unnotifiedRows.length === 0) return;

      const backupPath = backup({ collection: 'userachievements', documents: unnotifiedRows });
      log(`Backup: ${backupPath}`);

      const result = await userAchievements.updateMany(unnotifiedFilter, [
        { $set: { notifiedAt: { $ifNull: ['$completedAt', '$updatedAt'] } } },
      ]);
      log(`Modificadas: ${result.modifiedCount}`);
    },
  },
});
