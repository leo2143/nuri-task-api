import mongoose from 'mongoose';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pipeline de actualización (MongoDB 4.2+) que registra una actividad (tarea o meta) en el documento de métricas
 * en UNA sola escritura atómica. No se usa load-modify-save: `save()` no versiona los contadores escalares y dos
 * completados concurrentes perderían incrementos.
 *
 * Se usa con `findOneAndUpdate(..., { new: false })` para recibir el documento previo y derivar de la misma
 * operación la racha previa efectiva y si la racha subió (ver `describeStreakTransition`, misma regla).
 *
 * Reglas (día activo = día local con una tarea o una meta completada):
 * - sin actividad previa: racha 1
 * - diff <= 0 respecto de `lastActivityDay`: mismo día, la racha no cambia y `lastActivityDay` nunca retrocede
 * - diff 1: racha + 1; diff > 1: racha 1
 * - `bestStreak` = máximo(actual, nueva)
 * - la fila de historial del día la crea la primera actividad de cualquier tipo; cada tipo suma su propio contador
 * La diferencia de días usa `$dateFromString` sobre las claves (medianoches UTC) / 86400000, nunca `$dateDiff` (5.0+).
 *
 * @param {Object} activity
 * @param {'task'|'goal'} activity.kind - Tipo de actividad que se registra
 * @param {string} activity.day - Día local `YYYY-MM-DD` de la actividad
 * @param {Date} activity.dayStart - Instante de inicio de ese día local (se guarda como `history[].date`)
 * @param {Date} activity.occurredAt - Instante de la actividad (se guarda como `lastActivityDate`)
 * @returns {Object[]} Etapas del pipeline de actualización
 */
export function buildActivityDayPipeline({ kind, day, dayStart, occurredAt }) {
  const taskIncrement = kind === 'task' ? 1 : 0;
  const goalIncrement = kind === 'goal' ? 1 : 0;
  const dayLiteral = { $literal: day };

  const addToStoredCounter = (field, increment) => ({ $add: [{ $ifNull: [`$${field}`, 0] }, increment] });
  const storedStreak = { $ifNull: ['$currentStreak', 0] };

  const todayRowExists = { $in: [dayLiteral, { $ifNull: ['$history.day', []] }] };

  const bumpExistingRow = {
    $map: {
      input: '$history',
      as: 'row',
      in: {
        $cond: [
          { $eq: ['$$row.day', dayLiteral] },
          {
            $mergeObjects: [
              '$$row',
              {
                tasksCompleted: { $add: [{ $ifNull: ['$$row.tasksCompleted', 0] }, taskIncrement] },
                goalsCompleted: { $add: [{ $ifNull: ['$$row.goalsCompleted', 0] }, goalIncrement] },
              },
            ],
          },
          '$$row',
        ],
      },
    },
  };

  const appendNewRow = {
    $concatArrays: [
      { $ifNull: ['$history', []] },
      [
        {
          _id: new mongoose.Types.ObjectId(),
          date: dayStart,
          day: dayLiteral,
          tasksCompleted: taskIncrement,
          goalsCompleted: goalIncrement,
        },
      ],
    ],
  };

  return [
    {
      $set: {
        _dayDiff: {
          $cond: [
            { $eq: [{ $ifNull: ['$lastActivityDay', null] }, null] },
            null,
            {
              $divide: [
                {
                  $subtract: [
                    { $dateFromString: { dateString: dayLiteral } },
                    { $dateFromString: { dateString: '$lastActivityDay' } },
                  ],
                },
                MS_PER_DAY,
              ],
            },
          ],
        },
      },
    },
    {
      $set: {
        _nextStreak: {
          $switch: {
            branches: [
              { case: { $eq: ['$_dayDiff', null] }, then: 1 },
              { case: { $lte: ['$_dayDiff', 0] }, then: storedStreak },
              { case: { $eq: ['$_dayDiff', 1] }, then: { $add: [storedStreak, 1] } },
            ],
            default: 1,
          },
        },
      },
    },
    {
      $set: {
        currentStreak: '$_nextStreak',
        bestStreak: { $max: [{ $ifNull: ['$bestStreak', 0] }, '$_nextStreak'] },
        lastActivityDay: {
          $cond: [{ $or: [{ $eq: ['$_dayDiff', null] }, { $gt: ['$_dayDiff', 0] }] }, dayLiteral, '$lastActivityDay'],
        },
        lastActivityDate: {
          $cond: [{ $lt: [{ $ifNull: ['$_dayDiff', 0] }, 0] }, '$lastActivityDate', occurredAt],
        },
        totalTasksCompleted: addToStoredCounter('totalTasksCompleted', taskIncrement),
        totalGoalsCompleted: addToStoredCounter('totalGoalsCompleted', goalIncrement),
        history: { $cond: [todayRowExists, bumpExistingRow, appendNewRow] },
      },
    },
    { $unset: ['_dayDiff', '_nextStreak'] },
  ];
}
