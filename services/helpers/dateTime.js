/**
 * Primitivas de fecha con zona horaria IANA.
 *
 * Dos tipos de fecha que nunca se mezclan:
 * - INSTANTES (createdAt, completedAt, occurredAt): se resuelven en la zona del usuario.
 * - FECHAS FLOTANTES (dueDate, guardada como `YYYY-MM-DDT12:00:00Z`): se comparan y muestran como su Y-M-D UTC.
 *
 * La lógica de días usa claves `YYYY-MM-DD` y aritmética sobre esas claves, nunca ms / 24h
 * (un día local dura 23 o 25 horas en los cambios de horario).
 */

/** Zona de producto ("ART") para usuarios sin zona propia. */
export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const HOUR_MINUTE_PATTERN = /^(\d{2}):(\d{2})$/;

// Nombre con región: empieza con letra y tiene al menos una "/" (descarta "+05:00", "UTC", "GMT", "Z")
const REGION_TIMEZONE_PATTERN = /^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+$/;
const MAX_TIMEZONE_LENGTH = 64;
// Primer segmento no permitido: "Etc/*" y formas de offset ("UTC+5/..", "GMT-3/..")
const DENIED_FIRST_SEGMENT_PATTERN = /^(etc|(utc|gmt)[+-].*)$/i;

const partsFormatters = new Map();
// Tope del cache: hay ~420 zonas IANA, así que 512 cubre todas las grafías reales; más allá no se cachea
const MAX_CACHED_FORMATTERS = 512;

/**
 * Formateador de partes por zona, cacheado: construir un Intl.DateTimeFormat es caro y las zonas son pocas.
 * El cache tiene tope para que entradas arbitrarias nunca lo hagan crecer sin límite.
 * Una zona null/vacía se resuelve a `DEFAULT_TIMEZONE`; una cadena inválida lanza RangeError (Intl).
 * @param {string|null|undefined} timeZone
 * @returns {Intl.DateTimeFormat}
 */
function getPartsFormatter(timeZone) {
  const zone = timeZone || DEFAULT_TIMEZONE;
  let formatter = partsFormatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    if (partsFormatters.size < MAX_CACHED_FORMATTERS) {
      partsFormatters.set(zone, formatter);
    }
  }
  return formatter;
}

/**
 * Partes de calendario locales de un instante en una zona.
 * @param {Date|number} instant
 * @param {string|null} [timeZone] - null/undefined = `DEFAULT_TIMEZONE`
 * @returns {{year:number, month:number, day:number, hour:number, minute:number, second:number, weekday:number}}
 *   `month` 1-12 y `weekday` 0 (domingo) a 6 (sábado)
 */
export function getZonedParts(instant, timeZone = DEFAULT_TIMEZONE) {
  const parts = {};
  for (const { type, value } of getPartsFormatter(timeZone).formatToParts(instant)) {
    if (type !== 'literal') {
      parts[type] = Number(value);
    }
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Algunos ICU devuelven 24 a medianoche con h23
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
    weekday: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(),
  };
}

/**
 * Desfase de la zona respecto de UTC en ms, evaluado en el instante dado (incluye el horario de verano vigente).
 * @param {number} timestamp
 * @param {string} timeZone
 * @returns {number}
 */
function getOffsetMs(timestamp, timeZone) {
  const { year, month, day, hour, minute, second } = getZonedParts(timestamp, timeZone);
  const wholeSecondTimestamp = timestamp - (((timestamp % 1000) + 1000) % 1000);
  return Date.UTC(year, month - 1, day, hour, minute, second) - wholeSecondTimestamp;
}

/**
 * Clave de día local `YYYY-MM-DD` de un instante en una zona.
 * @param {Date|number} instant
 * @param {string} [timeZone]
 * @returns {string}
 */
export function toLocalYmd(instant, timeZone = DEFAULT_TIMEZONE) {
  const { year, month, day } = getZonedParts(instant, timeZone);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Minutos transcurridos desde la medianoche local del instante (0-1439).
 * @param {Date|number} instant
 * @param {string} [timeZone]
 * @returns {number}
 */
export function localMinutesOfDay(instant, timeZone = DEFAULT_TIMEZONE) {
  const { hour, minute } = getZonedParts(instant, timeZone);
  return hour * 60 + minute;
}

/**
 * @param {string} ymd - `YYYY-MM-DD`
 * @returns {number} ms UTC de la medianoche de esa fecha
 */
function ymdToUtcMs(ymd) {
  const match = YMD_PATTERN.exec(ymd);
  if (!match) {
    throw new RangeError(`Invalid YMD: ${ymd}`);
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Suma `days` (puede ser negativo) a una clave `YYYY-MM-DD`. Aritmética de calendario pura.
 * @param {string} ymd
 * @param {number} days
 * @returns {string}
 */
export function addDaysToYmd(ymd, days) {
  return new Date(ymdToUtcMs(ymd) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Días de calendario entre dos claves `YYYY-MM-DD`: `a - b` (positivo cuando `a` es posterior).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function diffYmdDays(a, b) {
  return Math.round((ymdToUtcMs(a) - ymdToUtcMs(b)) / MS_PER_DAY);
}

/**
 * Instante UTC de una hora de pared local (`ymd` + `HH:mm`) en una zona.
 * Resuelve el desfase en el instante objetivo con dos pasadas. En una hora repetida (fin del horario de verano)
 * devuelve la primera ocurrencia; en una hora inexistente (inicio del horario de verano) devuelve la hora de pared
 * corrida hacia adelante por el salto (p. ej. 02:30 en Nueva York el día del cambio da 07:30Z, es decir 03:30 EDT).
 * Solo las 02:00 devuelven el instante exacto del salto: para decidir "qué hora local es" usar `getZonedParts`.
 * @param {string} ymd - `YYYY-MM-DD`
 * @param {string} hourMinute - `HH:mm`
 * @param {string} [timeZone]
 * @returns {Date}
 */
export function zonedTimeToInstant(ymd, hourMinute, timeZone = DEFAULT_TIMEZONE) {
  const match = HOUR_MINUTE_PATTERN.exec(hourMinute);
  if (!match) {
    throw new RangeError(`Invalid HH:mm: ${hourMinute}`);
  }

  const wallClockAsUtc = ymdToUtcMs(ymd) + (Number(match[1]) * 60 + Number(match[2])) * 60 * 1000;

  const firstOffset = getOffsetMs(wallClockAsUtc, timeZone);
  const firstGuess = wallClockAsUtc - firstOffset;
  const secondOffset = getOffsetMs(firstGuess, timeZone);
  if (secondOffset === firstOffset) {
    return new Date(firstGuess);
  }

  const secondGuess = wallClockAsUtc - secondOffset;
  if (getOffsetMs(secondGuess, timeZone) === secondOffset) {
    return new Date(secondGuess);
  }

  // La hora de pared no existe (salto de horario de verano): se corre hacia adelante por el tamaño del salto
  return new Date(Math.max(firstGuess, secondGuess));
}

/**
 * Ventana [start, end) de un día local: de la medianoche local de `ymd` a la de `ymd + 1`.
 * @param {string} ymd - `YYYY-MM-DD`
 * @param {string} [timeZone]
 * @returns {{start: Date, end: Date}}
 */
export function getLocalDayRange(ymd, timeZone = DEFAULT_TIMEZONE) {
  return {
    start: zonedTimeToInstant(ymd, '00:00', timeZone),
    end: zonedTimeToInstant(addDaysToYmd(ymd, 1), '00:00', timeZone),
  };
}

/**
 * Valida un nombre de zona IANA con región (`America/Bogota`). Acepta solo nombres que:
 * - empiezan con letra y tienen al menos una "/" (descarta `+05:00`, `UTC`, `GMT`, `Z`);
 * - no son `Etc/*` ni formas de offset;
 * - los reconoce `Intl.DateTimeFormat` (insensible a mayúsculas: guardar siempre la forma de `canonicalTimeZone`).
 * No usa `Intl.supportedValuesOf('timeZone')`: solo lista nombres canónicos y rechazaría alias válidos del dispositivo.
 * @param {unknown} timeZone
 * @returns {boolean}
 */
export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== 'string') return false;

  const candidate = timeZone.trim();
  if (candidate.length === 0 || candidate.length > MAX_TIMEZONE_LENGTH) return false;
  if (!REGION_TIMEZONE_PATTERN.test(candidate)) return false;
  if (DENIED_FIRST_SEGMENT_PATTERN.test(candidate.split('/')[0])) return false;

  try {
    // Formateador descartable: el input llega sin autenticar y no debe ensuciar el cache
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return true;
  } catch {
    return false;
  }
}

/**
 * Forma que `Intl` resuelve para una zona. Sirve para guardar el valor y como CLAVE de igualdad/agrupación.
 * La grafía depende del ICU del runtime (p. ej. `Asia/Kolkata` puede resolverse como `Asia/Calcutta`):
 * nunca se asume ni se escribe una grafía a mano, y la clave nunca se usa como valor de consulta.
 * No lanza: devuelve null cuando el valor no es una zona válida (ver `isValidTimeZone`).
 * @param {unknown} timeZone
 * @returns {string|null}
 */
export function canonicalTimeZone(timeZone) {
  if (!isValidTimeZone(timeZone)) return null;

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: timeZone.trim() }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/**
 * Zona a usar para un usuario: la suya si es válida, si no la de producto (usuarios legados sin zona).
 * @param {unknown} timeZone
 * @returns {string}
 */
export function resolveTimeZone(timeZone) {
  return isValidTimeZone(timeZone) ? timeZone.trim() : DEFAULT_TIMEZONE;
}

/**
 * Normaliza una fecha límite a su forma flotante: mediodía UTC del día de calendario que mandó el cliente
 * (primeros 10 caracteres), nunca el día UTC de un instante corrido por zona horaria.
 * @param {Date|string|null|undefined} dueDate
 * @returns {Date|null} null si no hay fecha o no es válida
 */
export function toFloatingYmd(dueDate) {
  if (dueDate === undefined || dueDate === null || dueDate === '') return null;

  const ymd = dueDate instanceof Date ? dueDate.toISOString().slice(0, 10) : String(dueDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;

  const floating = new Date(`${ymd}T12:00:00Z`);
  if (Number.isNaN(floating.getTime()) || floating.toISOString().slice(0, 10) !== ymd) return null;

  return floating;
}

/**
 * Ventana UTC [start, end) que contiene la fecha flotante de `ymd` (guardada a las 12:00Z).
 * @param {string} ymd - `YYYY-MM-DD`
 * @returns {{start: Date, end: Date}}
 */
export function getFloatingDayRange(ymd) {
  const startMs = ymdToUtcMs(ymd);
  return { start: new Date(startMs), end: new Date(startMs + MS_PER_DAY) };
}
