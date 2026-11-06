import { formatDateYmdInTimeZone } from './dateTime.js';

export const DUE_DATE_PAST_MESSAGE = 'La fecha límite no puede ser anterior al día actual';
export const DUE_DATE_INVALID_MESSAGE = 'Debe ser una fecha válida';

/**
 * YYYY-MM-DD del calendario que el cliente mandó (primeros 10 caracteres), nunca el día UTC de un instante corrido.
 * Una fecha almacenada (Date) se lee como su día UTC, que es como se guarda la fecha flotante.
 * @param {Date|string|null|undefined} dueDate
 * @returns {string|null} null si no hay fecha o no es una fecha válida
 */
export function toDueDateYmd(dueDate) {
  if (dueDate === undefined || dueDate === null || dueDate === '') return null;
  if (Number.isNaN(new Date(dueDate).getTime())) return null;

  return dueDate instanceof Date ? dueDate.toISOString().slice(0, 10) : String(dueDate).slice(0, 10);
}

/**
 * Hoy en la zona de producto. Interino: pasa a ser el "hoy" del usuario cuando la zona horaria viaja en el request.
 * @returns {string} YYYY-MM-DD
 */
export function getTodayYmd() {
  return formatDateYmdInTimeZone(new Date());
}

/**
 * Indica si la fecha límite cae antes de "hoy". Sin fecha o con fecha inválida no está en el pasado.
 * @param {Date|string|null|undefined} dueDate
 * @param {string} [todayYmd] - Por defecto, hoy en la zona de producto
 * @returns {boolean}
 */
export function isDueDateInPast(dueDate, todayYmd = getTodayYmd()) {
  const dueYmd = toDueDateYmd(dueDate);
  return dueYmd !== null && dueYmd < todayYmd;
}

/**
 * Validación de fecha límite para las rutas de UPDATE: solo se evalúa cuando el valor entrante
 * cambia respecto del guardado, así editar el título de una meta ya vencida (p. ej. completada) sigue funcionando.
 * @param {Date|string|null|undefined} incomingDueDate - Valor que llega en el update (undefined = no se envió)
 * @param {Date|string|null|undefined} storedDueDate - Valor guardado en el documento
 * @param {string} [todayYmd] - Por defecto, hoy en la zona de producto
 * @returns {string|null} Mensaje de error o null si se puede guardar
 */
export function getDueDateChangeError(incomingDueDate, storedDueDate, todayYmd = getTodayYmd()) {
  const incomingYmd = toDueDateYmd(incomingDueDate);
  if (incomingYmd === null) return null;
  if (incomingYmd === toDueDateYmd(storedDueDate)) return null;

  return incomingYmd < todayYmd ? DUE_DATE_PAST_MESSAGE : null;
}
