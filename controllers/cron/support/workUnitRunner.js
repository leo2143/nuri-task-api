import chalk from 'chalk';
import JobRun, { JOB_RUN_RETENTION_MS } from '../../../models/jobRunModel.js';
import User from '../../../models/userModel.js';
import { ScheduledNotificationService } from '../../../services/scheduledNotificationService.js';
import { buildGroupUserFilter } from './timezoneGroups.js';

/** Una corrida `claimed` más vieja que esto se considera abandonada (la función murió) y otra invocación la retoma. */
const LEASE_MS = 90 * 1000;
/** Usuarios por lote: cada consulta y cada corrida del job quedan acotadas dentro de los 60 s de la función. */
const USER_BATCH_SIZE = 500;
const DUPLICATE_KEY_ERROR_CODE = 11000;

/** Clave de zona que usa el ledger para los jobs que no dependen de una zona. */
export const GLOBAL_TIMEZONE_KEY = 'global';

/**
 * @typedef {Object} WorkUnit
 * @property {string} jobName - Nombre en JOB_REGISTRY
 * @property {Object} job - Entrada del registro
 * @property {string} timezone - Clave de la zona (o `GLOBAL_TIMEZONE_KEY`)
 * @property {string} localDate - Día local `YYYY-MM-DD` del disparo (UTC para los globales)
 * @property {Date} now - Instante del disparo
 * @property {import('./timezoneGroups.js').TimezoneGroup} [group] - Usuarios de la zona (solo jobs por zona)
 */

/**
 * Ejecuta una unidad de trabajo (job + zona + día local).
 *
 * Con ledger (`useLedger`, el camino del dispatcher) la unidad se reclama de forma atómica: si dos invocaciones
 * llegan a la vez solo una la procesa. Sin ledger (corridas manuales) no se reclama ni se escribe nada, así una
 * demo no bloquea ni es bloqueada por una corrida programada.
 *
 * Carrera conocida: una corrida manual y un tick pueden procesar la misma unidad a la vez (la manual no pasa por
 * el ledger). La dedup por usuario, tipo y día local evita notificaciones duplicadas en la bandeja; lo peor que
 * puede pasar es un push repetido (los push son at-least-once).
 *
 * Los jobs NO se reintentan solos: si una unidad falla queda `failed` y solo otra invocación (un duplicado del
 * mismo tick o una corrida manual) la retoma. Después de cada lote se empujan los push pendientes y vigentes del
 * tipo del job (incluidos los que quedaron pendientes en días anteriores), aunque el job haya terminado sin crear nada o haya fallado: así no quedan push varados.
 * @param {WorkUnit} unit
 * @param {Object} [options]
 * @param {boolean} [options.useLedger=true]
 * @returns {Promise<{jobName: string, timezone: string, localDate: string, status: 'done'|'failed'|'skipped', durationMs?: number, result?: Object, error?: string}>}
 */
export async function runWorkUnit(unit, { useLedger = true } = {}) {
  const { jobName, timezone, localDate } = unit;
  const identity = { jobName, timezone, localDate };

  if (useLedger && !(await claimUnit(unit))) {
    return { ...identity, status: 'skipped' };
  }

  const startedAt = Date.now();
  try {
    const result = await executeUnit(unit);
    const durationMs = Date.now() - startedAt;
    if (useLedger) await finishUnit(unit, 'done', durationMs);
    return { ...identity, status: 'done', durationMs, result };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(chalk.red(`[Cron] Falló ${jobName} (${timezone} ${localDate}):`), error);
    if (useLedger) await finishUnit(unit, 'failed', durationMs);
    return { ...identity, status: 'failed', durationMs, error: error.message };
  }
}

/**
 * Reclama la unidad. Primero intenta insertarla; si ya existe (clave única) intenta retomarla en UNA operación
 * atómica solo cuando quedó `failed` o su lease venció. El dueño es quien recibe el documento de vuelta;
 * `done` o un reclamo reciente de otra invocación significan que hay que saltearla.
 * @param {WorkUnit} unit
 * @returns {Promise<boolean>} true si esta invocación es dueña de la unidad
 */
async function claimUnit({ jobName, timezone, localDate, now }) {
  const key = { job: jobName, timezone, localDate };
  const claimedAt = new Date();

  try {
    await JobRun.create({
      ...key,
      status: 'claimed',
      claimedAt,
      expiresAt: new Date(now.getTime() + JOB_RUN_RETENTION_MS),
    });
    return true;
  } catch (error) {
    if (error?.code !== DUPLICATE_KEY_ERROR_CODE) throw error;
  }

  const reclaimed = await JobRun.findOneAndUpdate(
    {
      ...key,
      $or: [{ status: 'failed' }, { status: 'claimed', claimedAt: { $lt: new Date(claimedAt.getTime() - LEASE_MS) } }],
    },
    { $set: { status: 'claimed', claimedAt, finishedAt: null, durationMs: null } },
    { new: true }
  );
  return reclaimed !== null;
}

async function finishUnit({ jobName, timezone, localDate }, status, durationMs) {
  await JobRun.updateOne(
    { job: jobName, timezone, localDate },
    { $set: { status, finishedAt: new Date(), durationMs } }
  );
}

/**
 * Corre el job de la unidad. Los jobs globales corren una vez; los de zona, en lotes de usuarios.
 * @param {WorkUnit} unit
 * @returns {Promise<Object>} Resultado agregado de la unidad
 */
async function executeUnit({ job, group, timezone, localDate, now }) {
  if (job.scope === 'global') {
    return job.run();
  }

  const totals = { users: 0, notified: 0, persisted: 0 };
  for await (const userIds of iterateUserBatches(group)) {
    totals.users += userIds.length;

    const result = await runBatch(job, { userIds, timezone, localDate, now });
    totals.notified += result?.notified ?? 0;
    totals.persisted += result?.persisted ?? 0;
  }
  return totals;
}

/**
 * Corre el job sobre un lote y empuja los push pendientes del tipo, haya o no creado algo.
 * Si el job falla, igual se empuja lo pendiente y recién después se propaga el error original.
 * @param {Object} job
 * @param {{userIds: Array, timezone: string, localDate: string, now: Date}} context
 * @returns {Promise<Object>}
 */
async function runBatch(job, context) {
  let result;
  let failure = null;

  try {
    result = await job.run(context);
  } catch (error) {
    failure = error;
  }

  try {
    await ScheduledNotificationService.pushPendingNotifications({
      type: job.notificationType,
      userIds: context.userIds,
      now: context.now,
    });
  } catch (error) {
    if (failure) {
      console.error(chalk.red('[Cron] Falló también el envío de push pendientes:'), error);
    } else {
      failure = error;
    }
  }

  if (failure) throw failure;
  return result;
}

/**
 * Recorre los usuarios del grupo por páginas de `_id`, de a USER_BATCH_SIZE.
 * @param {import('./timezoneGroups.js').TimezoneGroup} group
 * @returns {AsyncGenerator<Array>} Lotes de ids de usuario
 */
async function* iterateUserBatches(group) {
  const groupFilter = buildGroupUserFilter(group);
  let lastId = null;

  while (true) {
    const filter = lastId ? { $and: [groupFilter, { _id: { $gt: lastId } }] } : groupFilter;
    const page = await User.find(filter).sort({ _id: 1 }).limit(USER_BATCH_SIZE).select('_id').lean();
    if (page.length === 0) return;

    yield page.map(user => user._id);
    if (page.length < USER_BATCH_SIZE) return;
    lastId = page[page.length - 1]._id;
  }
}
