import mongoose from 'mongoose';
import { runMigration } from './support/cli.js';
import { DEFAULT_TIMEZONE } from '../../services/helpers/dateTime.js';

/**
 * S2: completa las métricas existentes con claves de día local (`YYYY-MM-DD`).
 *
 *   - `lastActivityDay`: día de `lastActivityDate` en DEFAULT_TIMEZONE.
 *   - `history[].day`: día de `history[].date` en DEFAULT_TIMEZONE.
 *   - `history[].goalsCompleted`: 0 donde falta (las metas no se contaban por día).
 *   - Una fila de `history` sin `date` ni `day` no se puede ubicar en ningún día: se descarta (queda en el backup)
 *     para que todas las filas terminen con `day` y nunca con `day: null`.
 *   - Índice { lastActivityDay: 1 }.
 *
 * Se usa DEFAULT_TIMEZONE (no la zona actual del usuario) porque los instantes guardados
 * antes de esta migración los calculó el código anterior, que trabajaba siempre en esa zona.
 * Solo completa lo que falta: una fila que ya tiene `day` no se toca. Idempotente: una segunda
 * corrida no encuentra nada para modificar.
 *
 * Importante: correla junto con el deploy. El esquema exige `history[].day` y, sin `lastActivityDay`,
 * el pipeline atómico toma la próxima actividad como la primera (la racha vuelve a 1).
 *
 *   node scripts/migrations/s2-metrics-day-keys.js                                 (dry-run)
 *   node scripts/migrations/s2-metrics-day-keys.js --apply
 *   node scripts/migrations/s2-metrics-day-keys.js --restore --apply
 *   node scripts/migrations/s2-metrics-day-keys.js --step=drop-legacy-streaks      (dry-run)
 *   node scripts/migrations/s2-metrics-day-keys.js --step=drop-legacy-streaks --apply
 *
 * `--restore` pisa el documento completo con el backup: usalo solo poco después de la corrida.
 * Para recuperar la colección `streaks` borrada: `--step=drop-legacy-streaks --restore --apply`.
 */
const LEGACY_STREAKS_COLLECTION = 'streaks';
const DAY_FORMAT = '%Y-%m-%d';

const MISSING_ACTIVITY_DAY_FILTER = { lastActivityDay: null, lastActivityDate: { $type: 'date' } };
const MISSING_HISTORY_DAY_FILTER = { history: { $elemMatch: { day: { $exists: false } } } };
const NEEDS_BACKFILL_FILTER = { $or: [MISSING_ACTIVITY_DAY_FILTER, MISSING_HISTORY_DAY_FILTER] };

const toDefaultZoneDay = dateExpression => ({
  $dateToString: { format: DAY_FORMAT, date: dateExpression, timezone: DEFAULT_TIMEZONE },
});

/**
 * Un solo pipeline para ambos campos. Cada rama conserva el valor existente si ya está,
 * así el update nunca pisa datos que el código nuevo ya escribió.
 */
const BACKFILL_PIPELINE = [
  {
    $set: {
      lastActivityDay: {
        $cond: [
          {
            $and: [
              { $eq: [{ $ifNull: ['$lastActivityDay', null] }, null] },
              { $eq: [{ $type: '$lastActivityDate' }, 'date'] },
            ],
          },
          toDefaultZoneDay('$lastActivityDate'),
          { $ifNull: ['$lastActivityDay', null] },
        ],
      },
      history: {
        $map: {
          input: {
            $filter: {
              input: { $ifNull: ['$history', []] },
              as: 'row',
              cond: {
                $or: [{ $eq: [{ $type: '$$row.day' }, 'string'] }, { $eq: [{ $type: '$$row.date' }, 'date'] }],
              },
            },
          },
          as: 'entry',
          in: {
            $cond: [
              { $eq: [{ $type: '$$entry.day' }, 'string'] },
              '$$entry',
              {
                $mergeObjects: [
                  '$$entry',
                  {
                    day: toDefaultZoneDay('$$entry.date'),
                    goalsCompleted: { $ifNull: ['$$entry.goalsCompleted', 0] },
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
];

await runMigration({
  name: 's2-metrics-day-keys',
  handlers: {
    async run({ apply, log, backup }) {
      const metrics = mongoose.connection.collection('metrics');

      const pendingMetrics = await metrics.find(NEEDS_BACKFILL_FILTER).toArray();
      const withoutActivityDay = pendingMetrics.filter(
        metric => !metric.lastActivityDay && metric.lastActivityDate instanceof Date
      ).length;
      log(`Métricas a completar: ${pendingMetrics.length} (sin lastActivityDay: ${withoutActivityDay})`);

      const hasActivityDayIndex = (await metrics.indexes()).some(
        index => Object.keys(index.key).length === 1 && index.key.lastActivityDay === 1
      );
      log(`Índice { lastActivityDay: 1 }: ${hasActivityDayIndex ? 'existe' : 'falta'}`);

      if (!apply) return;

      if (pendingMetrics.length > 0) {
        const backupPath = backup({ collection: 'metrics', documents: pendingMetrics });
        log(`Backup: ${backupPath}`);

        const result = await metrics.updateMany(NEEDS_BACKFILL_FILTER, BACKFILL_PIPELINE);
        log(`Modificadas: ${result.modifiedCount}`);
      }

      if (!hasActivityDayIndex) {
        await metrics.createIndex({ lastActivityDay: 1 });
        log('Índice { lastActivityDay: 1 } creado');
      }
    },

    steps: {
      /**
       * Borra la colección `streaks` que dejó el modelo huérfano eliminado. Correlo recién cuando
       * verificaste las rachas en producción: exporta la colección completa antes de borrarla.
       */
      async 'drop-legacy-streaks'({ apply, log, backup }) {
        const collections = await mongoose.connection.db.listCollections({ name: LEGACY_STREAKS_COLLECTION }).toArray();
        if (collections.length === 0) {
          log(`La colección "${LEGACY_STREAKS_COLLECTION}" no existe: nada para borrar`);
          return;
        }

        const streaks = mongoose.connection.collection(LEGACY_STREAKS_COLLECTION);
        const legacyStreaks = await streaks.find({}).toArray();
        log(`Documentos en "${LEGACY_STREAKS_COLLECTION}": ${legacyStreaks.length}`);

        if (!apply) return;

        const backupPath = backup({ collection: LEGACY_STREAKS_COLLECTION, documents: legacyStreaks });
        log(`Backup: ${backupPath}`);

        await streaks.drop();
        log(`Colección "${LEGACY_STREAKS_COLLECTION}" borrada`);
      },
    },
  },
});
