import { diffYmdDays } from './dateTime.js';

/**
 * Reglas de rachas sobre claves de día local `YYYY-MM-DD` (nunca ms / 24h).
 * Un día activo es cualquier día local en que el usuario completó una tarea o una meta.
 */

/**
 * Racha efectiva al leer: si pasó más de un día local desde la última actividad, la racha está rota (0).
 * No escribe nada. Una diferencia negativa (el usuario viajó hacia atrás en el huso) cuenta como mismo día.
 * @param {{currentStreak?: number, lastActivityDay?: string|null}} metrics
 * @param {string} todayYmd - Día local de hoy del usuario
 * @returns {number}
 */
export function getEffectiveStreak(metrics, todayYmd) {
  const storedStreak = metrics.currentStreak ?? 0;
  if (!metrics.lastActivityDay) return storedStreak;

  return diffYmdDays(todayYmd, metrics.lastActivityDay) > 1 ? 0 : storedStreak;
}

/**
 * Qué le pasa a la racha cuando hay actividad en `day`. Es la misma regla que aplica el pipeline atómico
 * (`metricsActivityPipeline.js`): sirve para derivar los datos de respuesta a partir del documento previo.
 * - sin actividad previa: racha 1
 * - diff <= 0 (mismo día, o un día anterior por cambio de huso): la racha no cambia y `lastActivityDay` no retrocede
 * - diff 1: racha + 1
 * - diff > 1: la racha se reinicia en 1
 * @param {{currentStreak?: number, bestStreak?: number, lastActivityDay?: string|null}} previous - Documento previo
 * @param {string} day - Día local de la actividad
 * @returns {{
 *   currentStreak: number,
 *   bestStreak: number,
 *   lastActivityDay: string,
 *   prevEffectiveStreak: number,
 *   streakIncreased: boolean
 * }}
 */
export function describeStreakTransition(previous, day) {
  const storedStreak = previous.currentStreak ?? 0;
  const storedBest = previous.bestStreak ?? 0;
  const lastActivityDay = previous.lastActivityDay ?? null;

  const dayDiff = lastActivityDay ? diffYmdDays(day, lastActivityDay) : null;

  let currentStreak;
  if (dayDiff === null) {
    currentStreak = 1;
  } else if (dayDiff <= 0) {
    currentStreak = storedStreak;
  } else if (dayDiff === 1) {
    currentStreak = storedStreak + 1;
  } else {
    currentStreak = 1;
  }

  const prevEffectiveStreak = dayDiff !== null && dayDiff > 1 ? 0 : storedStreak;

  return {
    currentStreak,
    bestStreak: Math.max(storedBest, currentStreak),
    lastActivityDay: dayDiff === null || dayDiff > 0 ? day : lastActivityDay,
    prevEffectiveStreak,
    streakIncreased: currentStreak > prevEffectiveStreak,
  };
}
