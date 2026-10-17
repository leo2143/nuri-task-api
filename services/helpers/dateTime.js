export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: DEFAULT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: DEFAULT_TIMEZONE,
  hour: '2-digit',
  hourCycle: 'h23',
});

/**
 * YYYY-MM-DD del instante en zona de producto (ART).
 */
export function formatDateYmdInTimeZone(date, timeZone = DEFAULT_TIMEZONE) {
  if (timeZone === DEFAULT_TIMEZONE) {
    return ymdFormatter.format(date);
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Instant UTC de las 00:00 del día calendario de `date` en `timeZone`.
 */
export function getStartOfDayInTimeZone(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const ymd = formatDateYmdInTimeZone(date, timeZone);
  const [year, month, day] = ymd.split('-').map(Number);

  for (let offsetHours = -14; offsetHours <= 14; offsetHours += 1) {
    const candidate = new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0, 0));
    if (formatDateYmdInTimeZone(candidate, timeZone) !== ymd) {
      continue;
    }

    const hour = Number(
      timeZone === DEFAULT_TIMEZONE
        ? hourFormatter.format(candidate)
        : new Intl.DateTimeFormat('en-US', {
            timeZone,
            hour: '2-digit',
            hourCycle: 'h23',
          }).format(candidate)
    );

    if (hour === 0) {
      return candidate;
    }
  }

  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
}

/**
 * Ventana [start, end) del día calendario ART corrido `daysFromToday` (0 = hoy).
 */
export function getDayRangeInTimeZone(daysFromToday = 0, timeZone = DEFAULT_TIMEZONE) {
  const start = getStartOfDayInTimeZone(new Date(), timeZone);
  start.setTime(start.getTime() + daysFromToday * MS_PER_DAY);
  const end = new Date(start.getTime() + MS_PER_DAY);
  return { start, end };
}

/**
 * Días calendario ART entre `from` y el inicio de hoy.
 */
export function getCalendarDaysSince(from, timeZone = DEFAULT_TIMEZONE) {
  if (!from) {
    return null;
  }

  const today = getStartOfDayInTimeZone(new Date(), timeZone);
  const then = getStartOfDayInTimeZone(new Date(from), timeZone);
  return Math.round((today.getTime() - then.getTime()) / MS_PER_DAY);
}
