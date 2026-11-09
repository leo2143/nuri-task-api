import chalk from 'chalk';
import { JOB_REGISTRY } from './jobRegistry.js';
import JobRun, { MAX_UNIT_ATTEMPTS } from '../../models/jobRunModel.js';
import { GLOBAL_TIMEZONE_KEY, LEASE_MS, runWorkUnit } from './support/workUnitRunner.js';
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
 * Unidades de reintento: las del ledger que quedaron `failed` (p. ej. cortadas por el deadline) o `claimed` con el
 * lease vencido (la función murió) en el día local vigente de su zona. Vercel no reintenta crons, así que cada tick
 * revisa el día en curso de todas las zonas con UNA consulta indexada (`localDate` + `status`). Reclamarlas es
 * atómico y retoman desde el cursor guardado; una unidad que ya agotó MAX_UNIT_ATTEMPTS intentos no se vuelve a planear; la clave única del ledger y la dedup por usuario evitan duplicados.
 * @param {Map<string, import('./support/timezoneGroups.js').TimezoneGroup>} groups
 * @param {Date} dispatchInstant
 * @param {Date} now
 * @param {import('./support/workUnitRunner.js').WorkUnit[]} plannedUnits - Unidades nuevas de este tick (no se repiten)
 * @returns {Promise<import('./support/workUnitRunner.js').WorkUnit[]>}
 */
export async function planRetryUnits(groups, dispatchInstant, now, plannedUnits) {
  const currentDateByZone = new Map([[GLOBAL_TIMEZONE_KEY, toLocalYmd(dispatchInstant, 'UTC')]]);
  for (const group of groups.values()) {
    currentDateByZone.set(group.key, toLocalYmd(dispatchInstant, group.key));
  }

  const leaseExpiredBefore = new Date(now.getTime() - LEASE_MS);
  const incompleteRuns = await JobRun.find({
    localDate: { $in: [...new Set(currentDateByZone.values())] },
    attempts: { $lt: MAX_UNIT_ATTEMPTS },
    $or: [{ status: 'failed' }, { status: 'claimed', claimedAt: { $lt: leaseExpiredBefore } }],
  })
    .select('job timezone localDate')
    .lean();

  const plannedKeys = new Set(plannedUnits.map(unit => `${unit.jobName}|${unit.timezone}|${unit.localDate}`));
  const units = [];

  for (const run of incompleteRuns) {
    const job = JOB_REGISTRY[run.job];
    const isCurrentDay = currentDateByZone.get(run.timezone) === run.localDate;
    if (!job || !isCurrentDay || plannedKeys.has(`${run.job}|${run.timezone}|${run.localDate}`)) continue;

    const isGlobalRun = run.timezone === GLOBAL_TIMEZONE_KEY;
    if (isGlobalRun !== (job.scope === 'global')) continue;

    units.push({
      jobName: run.job,
      job,
      timezone: run.timezone,
      localDate: run.localDate,
      now,
      ...(isGlobalRun ? {} : { group: groups.get(run.timezone) }),
    });
  }

  return units;
}

/**
 * Dispatcher horario. Vercel Hobby solo admite crons diarios, así que vercel.json declara 24 entradas
 * (`0 H * * *` -> `/api/cron/dispatch?h=H`), una por hora UTC, y cada tick decide qué jobs tocan en cada zona.
 *
 * Contrato de fallos: una unidad que falla o se corta por el deadline queda `failed` en el ledger con su cursor, y
 * los ticks siguientes del mismo día local la retoman (ver `planRetryUnits`): primero corren las unidades nuevas de
 * la hora y después los reintentos, mientras alcance el margen de MAX_DISPATCH_MS. Una unidad se reintenta hasta
 * MAX_UNIT_ATTEMPTS veces (el primer intento cuenta); agotadas se registra y no se vuelve a planear. Pasado el día
 * local una unidad incompleta se pierde. Si algo falló o quedó sin correr, responde 500 (solo se ve en los logs de cron de Vercel).
 * Los push pendientes los recupera el runner de cada unidad.
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

      // Unidades nuevas de la hora primero; los reintentos del día van después con el margen que quede
      let retryUnits = [];
      try {
        retryUnits = await planRetryUnits(groups, dispatchInstant, now, units);
      } catch (error) {
        // Sin reintentos igual corren las unidades nuevas de la hora
        console.error(chalk.red('[Cron] No se pudieron planear los reintentos:'), error);
      }
      const allUnits = [...units, ...retryUnits];
      const results = await CronDispatcher.#runUntilDeadline(allUnits);
      const failed = results.filter(outcome => outcome.status === 'failed').length;
      const unreached = allUnits.length - results.length;
      const data = { ...summary, retries: retryUnits.length, ran: results.length, failed, unreached, results };

      console.log(
        chalk.cyan(
          `[Cron] dispatch h=${resolvedHour.hour}: ${results.length}/${allUnits.length} unidades (${retryUnits.length} reintentos), ${failed} fallidas`
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
   * una unidad en curso corta entre lotes al llegar al mismo límite (queda `failed` con su cursor, y un tick
   * posterior del mismo día local la retoma).
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
