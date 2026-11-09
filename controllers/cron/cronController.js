import { JOB_REGISTRY } from './jobRegistry.js';
import { GLOBAL_TIMEZONE_KEY, runWorkUnit } from './support/workUnitRunner.js';
import { PRODUCT_TIMEZONE_KEY, fetchTimezoneGroups } from './support/timezoneGroups.js';
import { canonicalTimeZone, isValidTimeZone, toLocalYmd } from '../../services/helpers/dateTime.js';
import {
  SuccessResponseModel,
  NotFoundResponseModel,
  BadRequestResponseModel,
  ErrorResponseModel,
} from '../../models/responseModel.js';
import chalk from 'chalk';

/**
 * Corridas manuales de un job. Las corridas programadas las dispara el dispatcher (`/api/cron/dispatch`).
 */
export class CronController {
  /**
   * Ejecuta el job del registro indicado en :jobName, ahora, para los usuarios de una zona.
   *
   * - `?timezone=` (zona IANA, por defecto la de producto): una zona inválida responde 400.
   * - No pasa por el ledger ni respeta la hora local del job, y aun así empuja los push pendientes.
   *   Puede coincidir con un tick programado de la misma unidad; ver `runWorkUnit`.
   */
  static async run(req, res) {
    const { jobName } = req.params;
    const job = JOB_REGISTRY[jobName];

    if (!job) {
      const response = new NotFoundResponseModel(`Cron job desconocido: ${jobName}`);
      return res.status(response.status).json(response);
    }

    const requestedTimezone = req.query.timezone;
    if (requestedTimezone !== undefined && !isValidTimeZone(requestedTimezone)) {
      const response = new BadRequestResponseModel('timezone debe ser una zona horaria IANA válida (por ejemplo America/Bogota)');
      return res.status(response.status).json(response);
    }

    try {
      console.log(chalk.cyan(`[Cron] Ejecutando ${jobName}...`));
      const unit = await buildManualUnit(jobName, job, requestedTimezone);
      const outcome = await runWorkUnit(unit, { useLedger: false });

      if (outcome.status === 'failed') {
        const response = new ErrorResponseModel(`Error ejecutando cron ${jobName}`, 500);
        return res.status(response.status).json(response);
      }

      const response = new SuccessResponseModel(outcome.result, `Cron ${jobName} ejecutado correctamente`);
      return res.status(response.status).json(response);
    } catch (error) {
      console.error(chalk.red(`[Cron] Error en ${jobName}:`), error);
      const response = new ErrorResponseModel(`Error ejecutando cron ${jobName}`, 500);
      return res.status(response.status).json(response);
    }
  }
}

/**
 * Arma la unidad de una corrida manual: el grupo guardado de la zona pedida (con todas sus grafías) o, si
 * nadie la usa, un grupo vacío que no procesa usuarios.
 * @param {string} jobName
 * @param {Object} job
 * @param {string} [requestedTimezone] - Zona ya validada; por defecto la de producto
 * @returns {Promise<import('./support/workUnitRunner.js').WorkUnit>}
 */
async function buildManualUnit(jobName, job, requestedTimezone) {
  const now = new Date();

  if (job.scope === 'global') {
    return { jobName, job, timezone: GLOBAL_TIMEZONE_KEY, localDate: toLocalYmd(now, 'UTC'), now };
  }

  const key = requestedTimezone ? canonicalTimeZone(requestedTimezone) : PRODUCT_TIMEZONE_KEY;
  const groups = await fetchTimezoneGroups();
  const group = groups.get(key) ?? { key, spellings: [requestedTimezone.trim()], includesMissing: false };

  return { jobName, job, timezone: key, localDate: toLocalYmd(now, key), now, group };
}
