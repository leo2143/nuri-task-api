import chalk from 'chalk';
import JobRun, { JOB_RUN_RETENTION_MS, MAX_UNIT_ATTEMPTS } from '../../../models/jobRunModel.js';
import User from '../../../models/userModel.js';
import { ScheduledNotificationService } from '../../../services/scheduledNotificationService.js';
import { buildGroupUserFilter } from './timezoneGroups.js';

/** Una corrida `claimed` más vieja que esto se considera abandonada (la función murió) y otra invocación la retoma. */
export const LEASE_MS = 90 * 1000;
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
 * Una unidad que falla (o se corta por el `deadline`, incluso a mitad del envío de push de un lote) queda
 * `failed` y el dispatcher la vuelve a planear en los ticks siguientes del mismo día local, hasta MAX_UNIT_ATTEMPTS
 * intentos. Al terminar cada lote se guarda en el ledger el cursor (último usuario
 * procesado), así la retomada continúa desde ahí y no desde el primer lote. Después de cada lote se empujan los push pendientes y sin leer del
 * tipo del job creados en las últimas 48 h, aunque el job haya terminado sin crear nada o haya fallado: así no quedan push varados.
 * @param {WorkUnit} unit
 * @param {Object} [options]
 * @param {boolean} [options.useLedger=true]
 * @param {number} [options.deadline=Infinity] - Timestamp (ms) pasado el cual la unidad no empieza lotes nuevos
 * @returns {Promise<{jobName: string, timezone: string, localDate: string, status: 'done'|'failed'|'skipped', durationMs?: number, result?: Object, error?: string}>}
 */
export async function runWorkUnit(unit, { useLedger = true, deadline = Infinity } = {}) {
  const { jobName, timezone, localDate } = unit;
  const identity = { jobName, timezone, localDate };

  let claimedAt = null;
  let resumeAfter = null;
  let attempts = 1;
  if (useLedger) {
    try {
      const claim = await claimUnit(unit);
      if (!claim) return { ...identity, status: 'skipped' };
      ({ claimedAt, cursor: resumeAfter, attempts } = claim);
    } catch (error) {
      console.error(chalk.red(`[Cron] No se pudo reclamar ${jobName} (${timezone} ${localDate}):`), error);
      return { ...identity, status: 'failed', error: error.message };
    }
  }

  const startedAt = Date.now();
  let result;
  try {
    result = await executeUnit(unit, deadline, {
      resumeAfter,
      saveCursor: useLedger
        ? async lastUserId => {
            await saveCursor(unit, claimedAt, lastUserId);
            attempts = 1;
          }
        : null,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(chalk.red(`[Cron] Falló ${jobName} (${timezone} ${localDate}):`), error);
    const isExhausted = useLedger && attempts >= MAX_UNIT_ATTEMPTS;
    if (isExhausted) {
      console.error(
        chalk.red(
          `[Cron] Unidad agotada tras ${attempts} intentos, no se vuelve a planear: ${jobName} (${timezone} ${localDate})`
        )
      );
    }
    if (useLedger) await finishUnit(unit, claimedAt, isExhausted ? 'exhausted' : 'failed', durationMs);
    return { ...identity, status: 'failed', durationMs, error: error.message };
  }

  // La marca `done` queda fuera del try que decide si el job falló: un error del ledger no convierte un job
  // exitoso en fallido (finishUnit registra el error y no lo propaga).
  const durationMs = Date.now() - startedAt;
  if (useLedger) await finishUnit(unit, claimedAt, 'done', durationMs);
  return { ...identity, status: 'done', durationMs, result };
}

/**
 * Reclama la unidad. Primero intenta insertarla; si ya existe (clave única) intenta retomarla en UNA operación
 * atómica solo cuando quedó `failed` o su lease venció y todavía no agotó MAX_UNIT_ATTEMPTS. El dueño es quien recibe el documento de vuelta;
 * `done` o un reclamo reciente de otra invocación significan que hay que saltearla.
 * @param {WorkUnit} unit
 * @returns {Promise<{claimedAt: Date, cursor: import('mongoose').Types.ObjectId|null, attempts: number}|null>} el
 *   `claimedAt` de esta invocación, el cursor desde el que continuar (null = desde el primer usuario) y el número de
 *   intento si es dueña de la unidad;
 *   null si hay que saltearla
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
    return { claimedAt, cursor: null, attempts: 1 };
  } catch (error) {
    if (error?.code !== DUPLICATE_KEY_ERROR_CODE) throw error;
  }

  const reclaimed = await JobRun.findOneAndUpdate(
    {
      ...key,
      attempts: { $lt: MAX_UNIT_ATTEMPTS },
      $or: [{ status: 'failed' }, { status: 'claimed', claimedAt: { $lt: new Date(claimedAt.getTime() - LEASE_MS) } }],
    },
    { $set: { status: 'claimed', claimedAt, finishedAt: null, durationMs: null }, $inc: { attempts: 1 } },
    { new: true }
  );
  return reclaimed ? { claimedAt, cursor: reclaimed.cursor ?? null, attempts: reclaimed.attempts } : null;
}

/**
 * Guarda el último usuario procesado de la unidad, con la misma guarda de dueño que `finishUnit`. Avanzar el cursor
 * es progreso, así que `attempts` vuelve a 1: el tope MAX_UNIT_ATTEMPTS cuenta corridas seguidas sin avanzar. Un
 * fallo del ledger se registra y no se propaga: lo peor es que la retomada repita el último lote (la dedup lo absorbe).
 */
async function saveCursor({ jobName, timezone, localDate }, claimedAt, lastUserId) {
  try {
    await JobRun.updateOne(
      { job: jobName, timezone, localDate, status: 'claimed', claimedAt },
      { $set: { cursor: lastUserId, attempts: 1 } }
    );
  } catch (error) {
    console.error(chalk.red(`[Cron] No se pudo guardar el cursor de ${jobName} (${timezone} ${localDate}):`), error);
  }
}

/**
 * Cierra la unidad en el ledger solo si esta invocación sigue siendo la dueña (`claimedAt` es el que ella misma
 * escribió y la unidad sigue `claimed`): si el lease venció y otra invocación la retomó, no le pisa el estado.
 * Un fallo del ledger se registra y no se propaga: no debe abortar el resto del dispatch.
 */
async function finishUnit({ jobName, timezone, localDate }, claimedAt, status, durationMs) {
  try {
    await JobRun.updateOne(
      { job: jobName, timezone, localDate, status: 'claimed', claimedAt },
      { $set: { status, finishedAt: new Date(), durationMs } }
    );
  } catch (error) {
    console.error(chalk.red(`[Cron] No se pudo marcar ${status} ${jobName} (${timezone} ${localDate}):`), error);
  }
}

/**
 * Corre el job de la unidad. Los jobs globales corren una vez; los de zona, en lotes de usuarios.
 * Si se agota el `deadline` entre lotes, o a mitad del envío de push de un lote, corta con un error: la unidad
 * queda `failed` (trabajo incompleto) y el dispatcher la retoma en un tick posterior desde el cursor (un lote cuyo
 * envío quedó cortado no avanza el cursor, así la retomada lo rehace); lo ya notificado no se repite por la dedup de usuario,
 * tipo y día local.
 * @param {WorkUnit} unit
 * @param {number} deadline - Timestamp (ms) límite para empezar un lote nuevo
 * @param {Object} progress
 * @param {import('mongoose').Types.ObjectId|null} progress.resumeAfter - Último usuario ya procesado (null = desde el inicio)
 * @param {((lastUserId: import('mongoose').Types.ObjectId) => Promise<void>)|null} progress.saveCursor - Persiste el
 *   cursor tras cada lote completo (null = corrida sin ledger)
 * @returns {Promise<Object>} Resultado agregado de la unidad
 */
async function executeUnit({ job, group, timezone, localDate, now }, deadline, { resumeAfter, saveCursor }) {
  if (job.scope === 'global') {
    return job.run();
  }

  const totals = { users: 0, notified: 0, persisted: 0 };
  for await (const userIds of iterateUserBatches(group, resumeAfter)) {
    if (Date.now() > deadline) {
      throw new Error(`Se agotó el tiempo del dispatch con la unidad incompleta (${totals.users} usuarios procesados)`);
    }
    totals.users += userIds.length;

    const result = await runBatch(job, { userIds, timezone, localDate, now }, deadline);
    totals.notified += result?.notified ?? 0;
    totals.persisted += result?.persisted ?? 0;
    if (saveCursor) await saveCursor(userIds[userIds.length - 1]);
  }
  return totals;
}

/**
 * Corre el job sobre un lote y empuja los push pendientes del tipo, haya o no creado algo.
 * Si el job falla, igual se empuja lo pendiente y recién después se propaga el error original. Si el deadline cortó
 * el envío (en el job o en este empuje), falla con el error del deadline: el lote no puede darse por terminado
 * porque quedaron push pendientes de usuarios que el cursor dejaría atrás.
 * @param {Object} job
 * @param {{userIds: Array, timezone: string, localDate: string, now: Date}} context
 * @param {number} deadline - Timestamp (ms) límite: se pasa al job y al envío de push pendientes, que cortan ahí y
 *   dejan el resto pendiente
 * @returns {Promise<Object>}
 */
async function runBatch(job, context, deadline) {
  let result;
  let failure = null;

  try {
    result = await job.run({ ...context, deadline });
  } catch (error) {
    failure = error;
  }

  let wasPushTruncated = result?.truncated === true;
  try {
    const pushOutcome = await ScheduledNotificationService.pushPendingNotifications({
      type: job.notificationType,
      userIds: context.userIds,
      now: context.now,
      deadline,
    });
    wasPushTruncated ||= pushOutcome.truncated;
  } catch (error) {
    if (failure) {
      console.error(chalk.red('[Cron] Falló también el envío de push pendientes:'), error);
    } else {
      failure = error;
    }
  }

  if (failure) throw failure;
  if (wasPushTruncated) {
    throw new Error('Se agotó el tiempo del dispatch con push pendientes en el lote');
  }
  return result;
}

/**
 * Recorre los usuarios del grupo por páginas de `_id`, de a USER_BATCH_SIZE.
 * @param {import('./timezoneGroups.js').TimezoneGroup} group
 * @param {import('mongoose').Types.ObjectId|null} startAfter - Se empieza después de este `_id` (null = desde el inicio)
 * @returns {AsyncGenerator<Array>} Lotes de ids de usuario
 */
async function* iterateUserBatches(group, startAfter) {
  const groupFilter = buildGroupUserFilter(group);
  let lastId = startAfter;

  while (true) {
    const filter = lastId ? { $and: [groupFilter, { _id: { $gt: lastId } }] } : groupFilter;
    const page = await User.find(filter).sort({ _id: 1 }).limit(USER_BATCH_SIZE).select('_id').lean();
    if (page.length === 0) return;

    yield page.map(user => user._id);
    if (page.length < USER_BATCH_SIZE) return;
    lastId = page[page.length - 1]._id;
  }
}
