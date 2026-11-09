import chalk from 'chalk';
import { JOB_REGISTRY } from './jobRegistry.js';
import { GLOBAL_TIMEZONE_KEY, runWorkUnit } from './support/workUnitRunner.js';
import { fetchTimezoneGroups } from './support/timezoneGroups.js';
import { getZonedParts, toLocalYmd } from '../../services/helpers/dateTime.js';
import { BadRequestResponseModel, ErrorResponseModel, SuccessResponseModel } from '../../models/responseModel.js';

/** Margen bajo los 60 s de `maxDuration`: pasado este tiempo no se empiezan unidades nuevas. */
const MAX_DISPATCH_MS = 50 * 1000;
/** Un tick más viejo que esto ya no es de "esta hora": se saltea en vez de enviar a destiempo. */
const STALE_TICK_MS = 90 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const HOUR_PARAM_PATTERN = /^\d{1,2}$/;
// Header que Vercel documenta en cada invocación de cron: el schedule tal cual ("0 14 * * *")
const SCHEDULE_HEADER_PATTERN = /^\s*\d{1,2}\s+(\d{1,2})\s+\*\s+\*\s+\*\s*$/;

/**
 * Hora UTC (0-23) de este tick. En orden:
 * 1. `?h=H` en el path del cron (primario: vercel.json declara 24 paths `/api/cron/dispatch?h=0..23`);
 * 2. el header `x-vercel-cron-schedule` (`M H * * *`);
 * 3. la hora actual UTC, con un warning (en Hobby el cron puede dispararse en cualquier minuto de su hora).
 * Un `h` presente pero inválido no cae al resto: es un error.
 * @param {Object} req
 * @param {Date} now
 * @returns {{hour: number, source: 'query'|'header'|'clock'}|{error: string}}
 */
export function resolveDispatchHour(req, now) {
  const rawHour = req.query.h;
  if (rawHour !== undefined) {
    const isValid = typeof rawHour === 'string' && HOUR_PARAM_PATTERN.test(rawHour) && Number(rawHour) <= 23;
    return isValid ? { hour: Number(rawHour), source: 'query' } : { error: 'h debe ser un entero entre 0 y 23' };
  }

  const scheduleMatch = SCHEDULE_HEADER_PATTERN.exec(req.headers['x-vercel-cron-schedule'] ?? '');
  if (scheduleMatch && Number(scheduleMatch[1]) <= 23) {
    return { hour: Number(scheduleMatch[1]), source: 'header' };
  }

  console.warn(chalk.yellow('[Cron] dispatch sin ?h ni x-vercel-cron-schedule: se usa la hora UTC actual'));
  return { hour: now.getUTCHours(), source: 'clock' };
}

/**
 * Último `H:00Z` que no es posterior a `now`. Si el tick llega pasado el cambio de hora (jitter de Hobby),
 * la hora sigue siendo la que se programó.
 * @param {number} hour - 0-23
 * @param {Date} now
 * @returns {Date}
 */
export function getDispatchInstant(hour, now) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour);
  return new Date(today > now.getTime() ? today - MS_PER_DAY : today);
}

/**
 * Si la hora local `localHour` no existe en la fecha local de `dispatchInstant` (salto de horario de verano) y
 * `dispatchInstant` es la primera hora local que existe después del hueco. Detección exacta con la hora local
 * del instante y la de una hora antes: la anterior cae antes de `localHour` (en la misma fecha o en la
 * anterior) y la actual ya pasó `localHour`.
 * @param {string} timeZone
 * @param {number} localHour
 * @param {Date} dispatchInstant
 * @returns {boolean}
 */
function isFirstHourAfterSkippedHour(timeZone, localHour, dispatchInstant) {
  const current = getZonedParts(dispatchInstant, timeZone);
  if (current.hour <= localHour) return false;

  const previous = getZonedParts(new Date(dispatchInstant.getTime() - MS_PER_HOUR), timeZone);
  const isSameLocalDate =
    previous.year === current.year && previous.month === current.month && previous.day === current.day;
  return !isSameLocalDate || previous.hour < localHour;
}

/**
 * Unidades de trabajo que corresponden al instante del tick: un job de zona corre para un grupo si en esa zona
 * la hora local en `dispatchInstant` es la del job o, cuando el horario de verano salta justo esa hora (p. ej.
 * 00:00 en America/Santiago), si es la primera hora local que existe después del hueco; no hay recuperación de
 * otras horas perdidas. La clave única del ledger evita duplicados. Los jobs globales, si la hora UTC coincide.
 * @param {Map<string, import('./support/timezoneGroups.js').TimezoneGroup>} groups
 * @param {Date} dispatchInstant
 * @param {Date} now
 * @returns {import('./support/workUnitRunner.js').WorkUnit[]}
 */
export function planWorkUnits(groups, dispatchInstant, now) {
  const units = [];

  for (const [jobName, job] of Object.entries(JOB_REGISTRY)) {
    if (job.scope === 'global') {
      if (dispatchInstant.getUTCHours() === job.utcHour) {
        units.push({ jobName, job, timezone: GLOBAL_TIMEZONE_KEY, localDate: toLocalYmd(dispatchInstant, 'UTC'), now });
      }
      continue;
    }

    for (const group of groups.values()) {
      const isJobHour =
        getZonedParts(dispatchInstant, group.key).hour === job.localHour ||
        isFirstHourAfterSkippedHour(group.key, job.localHour, dispatchInstant);
      if (isJobHour) {
        units.push({
          jobName,
          job,
          timezone: group.key,
          localDate: toLocalYmd(dispatchInstant, group.key),
          now,
          group,
        });
      }
    }
  }

  return units;
}

/**
 * Dispatcher horario. Vercel Hobby solo admite crons diarios, así que vercel.json declara 24 entradas
 * (`0 H * * *` -> `/api/cron/dispatch?h=H`), una por hora UTC, y cada tick decide qué jobs tocan en cada zona.
 *
 * Contrato de fallos: no hay reintentos automáticos. Una unidad que falla queda `failed` en el ledger y se
 * pierde para ese día local salvo que otra invocación (duplicada o manual) la retome; las unidades que no
 * alcanzan a empezar antes de MAX_DISPATCH_MS tampoco se reclaman. Si algo falló o quedó sin correr, responde
 * 500 (solo se ve en los logs de cron de Vercel). Los push pendientes los recupera el runner de cada unidad.
 */
export class CronDispatcher {
  /**
   * GET /api/cron/dispatch?h=H[&dryRun=1]
   * `dryRun=1` solo se acepta fuera de producción (un preview puede apuntar a la base de producción): resuelve la
   * hora y las unidades y devuelve lo que correría, sin ledger, sin notificaciones y sin push.
   */
  static async dispatch(req, res) {
    const now = new Date();
    const isDryRun = req.query.dryRun === '1';

    if (req.query.dryRun !== undefined && !isDryRun) {
      return CronDispatcher.#send(res, new BadRequestResponseModel('dryRun solo acepta el valor 1'));
    }
    if (isDryRun && process.env.VERCEL_ENV === 'production') {
      return CronDispatcher.#send(res, new BadRequestResponseModel('dryRun no está disponible en producción'));
    }

    const resolvedHour = resolveDispatchHour(req, now);
    if (resolvedHour.error) {
      return CronDispatcher.#send(res, new BadRequestResponseModel(resolvedHour.error));
    }

    const dispatchInstant = getDispatchInstant(resolvedHour.hour, now);
    if (now.getTime() - dispatchInstant.getTime() > STALE_TICK_MS) {
      console.warn(chalk.yellow(`[Cron] Tick de las ${dispatchInstant.toISOString()} demasiado viejo: se saltea`));
      return CronDispatcher.#send(
        res,
        new SuccessResponseModel({ skipped: 'stale', dispatchInstant }, 'Tick vencido, se saltea')
      );
    }

    try {
      const groups = await fetchTimezoneGroups();
      const units = planWorkUnits(groups, dispatchInstant, now);
      const summary = { hour: resolvedHour.hour, source: resolvedHour.source, dispatchInstant, units: units.length };

      if (isDryRun) {
        const planned = units.map(({ jobName, timezone, localDate }) => ({ jobName, timezone, localDate }));
        console.log(chalk.cyan(`[Cron] dryRun h=${resolvedHour.hour}: correrían ${units.length} unidades`), planned);
        return CronDispatcher.#send(
          res,
          new SuccessResponseModel({ ...summary, dryRun: true, planned }, 'dryRun: no se ejecutó nada')
        );
      }

      const results = await CronDispatcher.#runUntilDeadline(units);
      const failed = results.filter(outcome => outcome.status === 'failed').length;
      const unreached = units.length - results.length;
      const data = { ...summary, ran: results.length, failed, unreached, results };

      console.log(
        chalk.cyan(
          `[Cron] dispatch h=${resolvedHour.hour}: ${results.length}/${units.length} unidades, ${failed} fallidas`
        )
      );

      if (failed > 0 || unreached > 0) {
        const response = new ErrorResponseModel('Dispatch incompleto: hubo unidades fallidas o sin ejecutar', 500);
        response.meta = data;
        return CronDispatcher.#send(res, response);
      }
      return CronDispatcher.#send(res, new SuccessResponseModel(data, 'Dispatch ejecutado correctamente'));
    } catch (error) {
      console.error(chalk.red('[Cron] Error en dispatch:'), error);
      return CronDispatcher.#send(res, new ErrorResponseModel('Error ejecutando el dispatch', 500));
    }
  }

  /**
   * Corre las unidades en orden hasta agotar el margen de tiempo. Las que no empiezan a tiempo no se reclaman, y
   * una unidad en curso corta entre lotes al llegar al mismo límite (queda `failed`, reclamable).
   * @param {import('./support/workUnitRunner.js').WorkUnit[]} units
   */
  static async #runUntilDeadline(units) {
    const startedAt = Date.now();
    const results = [];

    for (const unit of units) {
      if (Date.now() - startedAt > MAX_DISPATCH_MS) break;
      results.push(await runWorkUnit(unit, { deadline: startedAt + MAX_DISPATCH_MS }));
    }

    return results;
  }

  static #send(res, response) {
    return res.status(response.status).json(response);
  }
}
