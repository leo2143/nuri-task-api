/**
 * Pipelines de actualización (MongoDB 4.2+) del progreso de un UserAchievement. Cada uno es UNA escritura atómica
 * con upsert por `{ user, achievement }`, aplicada con el driver nativo: Mongoose no castea pipelines y el upsert
 * necesita los valores por defecto y las marcas de tiempo que el esquema pondría.
 *
 * Reglas comunes:
 * - una fila `completed` queda congelada (conserva `currentCount` y `window`): un logro completado nunca se revierte
 * - el filtro del upsert NUNCA incluye `status`: con un filtro `status != completed` una fila completada no coincidiría
 *   y el upsert intentaría insertar otra, rompiendo el índice único `{ user, achievement }` (E11000)
 */

const isCompleted = { $eq: ['$status', 'completed'] };

/**
 * Elige entre dejar la fila como está (completada) o aplicar el cambio.
 * @param {Object|string} frozenValue - Expresión cuando la fila ya está completada
 * @param {Object|string|number} activeValue - Expresión cuando la fila sigue en curso
 */
const unlessCompleted = (frozenValue, activeValue) => ({ $cond: [isCompleted, frozenValue, activeValue] });

/**
 * Valores por defecto y marcas de tiempo que un documento insertado por upsert recibiría del esquema.
 * @param {Object} progressFields - Campos de progreso a calcular en la misma etapa
 * @returns {Object[]}
 */
function withRowDefaults(progressFields) {
  return [
    {
      $set: {
        status: { $ifNull: ['$status', 'locked'] },
        unlockedAt: { $ifNull: ['$unlockedAt', null] },
        completedAt: { $ifNull: ['$completedAt', null] },
        createdAt: { $ifNull: ['$createdAt', '$$NOW'] },
        updatedAt: '$$NOW',
        ...progressFields,
      },
    },
  ];
}

/** Suma 1 al progreso acumulado (logros sin `sameWindow`). */
export function buildIncrementProgressPipeline() {
  return withRowDefaults({
    currentCount: unlessCompleted('$currentCount', { $add: [{ $ifNull: ['$currentCount', 0] }, 1] }),
  });
}

/**
 * Asigna el valor absoluto del progreso (`streak:updated`: la racha actual). Nunca baja una fila completada.
 * @param {number} value
 */
export function buildAbsoluteProgressPipeline(value) {
  return withRowDefaults({
    currentCount: unlessCompleted('$currentCount', { $literal: value }),
  });
}

/**
 * Cuenta eventos dentro de una misma instancia de franja (logros con `sameWindow`).
 * Las claves son fechas locales `YYYY-MM-DD`, ordenables como string:
 * - misma clave: suma 1
 * - clave mayor (o sin franja guardada): reinicia en 1
 * - clave MENOR (evento tardío o fuera de orden): se ignora, sin reinicio ni suma
 * `currentCount` refleja el conteo de la instancia vigente.
 * @param {string} windowKey - Instancia del evento (ver `evaluateAchievementConditions`)
 */
export function buildWindowProgressPipeline(windowKey) {
  const eventKey = { $literal: windowKey };
  const storedKey = { $ifNull: ['$window.key', null] };
  const storedCount = { $ifNull: ['$window.count', 0] };

  const startsNewInstance = { $or: [{ $eq: [storedKey, null] }, { $gt: [eventKey, storedKey] }] };
  const continuesInstance = { $eq: [storedKey, eventKey] };

  return withRowDefaults({
    window: unlessCompleted('$window', {
      $cond: [
        startsNewInstance,
        { key: eventKey, count: 1 },
        { $cond: [continuesInstance, { key: eventKey, count: { $add: [storedCount, 1] } }, '$window'] },
      ],
    }),
    currentCount: unlessCompleted('$currentCount', {
      $cond: [
        startsNewInstance,
        1,
        { $cond: [continuesInstance, { $add: [storedCount, 1] }, { $ifNull: ['$currentCount', 0] }] },
      ],
    }),
  });
}
