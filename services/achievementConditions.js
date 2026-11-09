import { addDaysToYmd, localMinutesOfDay, toLocalYmd } from './helpers/dateTime.js';

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * @param {string} hourMinute - `HH:mm`
 * @returns {number} Minutos desde la medianoche
 */
function toMinutesOfDay(hourMinute) {
  const [hours, minutes] = hourMinute.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Evaluadores puros por condición: cada uno recibe el valor configurado y el contexto del evento y responde
 * si el evento los cumple. Qué condiciones admite cada evento lo define `ALLOWED_CONDITIONS_BY_TRIGGER`.
 * `sameWindow` no filtra eventos: cambia cómo se cuenta el progreso (ver `evaluateAchievementConditions`).
 * @type {Object<string, (conditionValue: any, context: EvaluationContext) => boolean>}
 */
const CONDITION_EVALUATORS = {
  /**
   * Franja local `[start, end)`: el inicio se incluye, el fin no. Si start > end la franja cruza la medianoche.
   * Se evalúa por hora de pared local del instante del evento.
   */
  timeWindow({ start, end }, { occurredAt, timezone }) {
    const minutesOfDay = localMinutesOfDay(occurredAt, timezone);
    const startMinutes = toMinutesOfDay(start);
    const endMinutes = toMinutesOfDay(end);

    return startMinutes < endMinutes
      ? minutesOfDay >= startMinutes && minutesOfDay < endMinutes
      : minutesOfDay >= startMinutes || minutesOfDay < endMinutes;
  },

  /** Tiempo transcurrido (instantes reales) entre la creación de la meta y su primer cierre. */
  maxDurationHours(maxHours, { occurredAt, startedAt }) {
    if (!startedAt) return false;
    return new Date(occurredAt).getTime() - new Date(startedAt).getTime() <= maxHours * MS_PER_HOUR;
  },
};

/**
 * Identidad de la instancia de franja a la que pertenece el evento, ordenable como string (`YYYY-MM-DD`).
 * Con franja horaria es la fecha local en que EMPEZÓ la franja (una franja nocturna que cruza la medianoche
 * pertenece al día en que arrancó); sin franja es el día calendario local del usuario.
 * @param {{start: string, end: string}|undefined} timeWindow
 * @param {EvaluationContext} context
 * @returns {string}
 */
function getWindowKey(timeWindow, { occurredAt, timezone }) {
  const localDay = toLocalYmd(occurredAt, timezone);
  if (!timeWindow) return localDay;

  const crossesMidnight = toMinutesOfDay(timeWindow.start) > toMinutesOfDay(timeWindow.end);
  const startedBeforeMidnight = localMinutesOfDay(occurredAt, timezone) >= toMinutesOfDay(timeWindow.start);
  return crossesMidnight && !startedBeforeMidnight ? addDaysToYmd(localDay, -1) : localDay;
}

/**
 * Evalúa las condiciones de un logro contra un evento. Es pura: solo usa el instante del SERVIDOR (`occurredAt`)
 * y la zona del usuario; cualquier hora que mande el cliente no entra acá.
 * Las condiciones se combinan con AND. Un logro sin condiciones siempre pasa.
 * @param {Object|null|undefined} conditions - `{ timeWindow?, sameWindow?, maxDurationHours? }`
 * @param {EvaluationContext} context
 * @returns {{passes: boolean, windowKey: string|null}} `windowKey` solo si el logro tiene `sameWindow`
 *
 * @typedef {Object} EvaluationContext
 * @property {Date} occurredAt - Instante del evento: `completedAt` de la tarea o `firstCompletedAt` de la meta
 * @property {string} timezone - Zona IANA del usuario
 * @property {Date|null} [startedAt] - Inicio del ciclo medido (`createdAt` de la meta), para `maxDurationHours`
 */
export function evaluateAchievementConditions(conditions, context) {
  const activeConditions = conditions ?? {};

  for (const [conditionKey, evaluator] of Object.entries(CONDITION_EVALUATORS)) {
    const conditionValue = activeConditions[conditionKey];
    if (conditionValue === undefined || conditionValue === null) continue;
    if (!evaluator(conditionValue, context)) return { passes: false, windowKey: null };
  }

  return {
    passes: true,
    windowKey: activeConditions.sameWindow === true ? getWindowKey(activeConditions.timeWindow, context) : null,
  };
}

/**
 * Indica si un logro necesita la zona del usuario para evaluarse.
 * @param {Object|null|undefined} conditions
 * @returns {boolean}
 */
export function conditionsNeedTimezone(conditions) {
  return Boolean(conditions?.timeWindow) || conditions?.sameWindow === true;
}
