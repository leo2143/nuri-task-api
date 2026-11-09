/**
 * Catálogo de logros: única fuente de los tipos, los eventos que disparan progreso y las condiciones que cada
 * evento admite. Lo consumen el modelo, los DTOs, el servicio de administración y el evaluador de condiciones.
 */

export const ACHIEVEMENT_TYPES = ['task', 'goal', 'metric', 'streak'];

export const ACHIEVEMENT_TRIGGER_EVENTS = ['task:completed', 'goal:completed', 'task:goal-changed', 'streak:updated'];

export const CONDITION_KEYS = ['timeWindow', 'sameWindow', 'maxDurationHours'];

/**
 * Condiciones permitidas por evento. Un evento sin condiciones (streak:updated) las rechaza todas.
 * - timeWindow: franja horaria local del usuario, evaluada sobre el instante del evento
 * - sameWindow: el progreso solo cuenta eventos de una misma franja (o del mismo día local sin franja)
 * - maxDurationHours: tiempo máximo entre la creación y el primer cierre de la meta
 */
export const ALLOWED_CONDITIONS_BY_TRIGGER = {
  'task:completed': ['timeWindow', 'sameWindow'],
  'goal:completed': ['timeWindow', 'maxDurationHours'],
  'task:goal-changed': ['timeWindow'],
  'streak:updated': [],
};

/**
 * Claves de condición presentes en `conditions` que el evento no admite.
 * @param {string} triggerEvent
 * @param {Object|null|undefined} conditions
 * @returns {string[]}
 */
export function getDisallowedConditionKeys(triggerEvent, conditions) {
  const allowedKeys = ALLOWED_CONDITIONS_BY_TRIGGER[triggerEvent] ?? [];
  return Object.keys(conditions ?? {}).filter(
    conditionKey => conditions[conditionKey] !== undefined && !allowedKeys.includes(conditionKey)
  );
}

/**
 * Mensaje de error para condiciones no permitidas por el evento.
 * @param {string} triggerEvent
 * @param {string[]} disallowedKeys
 * @returns {string}
 */
export function buildDisallowedConditionsMessage(triggerEvent, disallowedKeys) {
  return `Las condiciones ${disallowedKeys.join(', ')} no están permitidas para el evento ${triggerEvent}`;
}

/**
 * Respuesta de `GET /api/achievements/catalog`: lo que el formulario de administración puede elegir.
 * @returns {{ triggers: Array<{ triggerEvent: string, allowedConditions: string[] }>, types: string[] }}
 */
export function buildAchievementCatalog() {
  return {
    triggers: ACHIEVEMENT_TRIGGER_EVENTS.map(triggerEvent => ({
      triggerEvent,
      allowedConditions: [...ALLOWED_CONDITIONS_BY_TRIGGER[triggerEvent]],
    })),
    types: [...ACHIEVEMENT_TYPES],
  };
}
