import Todo from '../models/todoModel.js';
import Goal from '../models/goalsModel.js';
import Metrics from '../models/metricsModel.js';
import Notification from '../models/notificationModel.js';
import PushSubscription from '../models/pushSubscriptionModel.js';
import User from '../models/userModel.js';
import Moodboard from '../models/moodboardModel.js';
import { PushNotificationService } from './pushNotificationService.js';
import { NotificationService } from './notificationService.js';
import {
  DEFAULT_TIMEZONE,
  addDaysToYmd,
  getFloatingDayRange,
  getLocalDayRange,
  resolveTimeZone,
  toLocalYmd,
} from './helpers/dateTime.js';
import chalk from 'chalk';

/** Íconos PWA alineados a Figma (archivos en nuri-task-app/public/notifications). */
const PUSH_ICONS = {
  due_task: '/notifications/due-task.svg',
  streak_risk: '/notifications/nuri-fire.svg',
  inactivity: '/notifications/nuri-happy.svg',
  streak_increase: '/notifications/nuri-fire.svg',
  achievement_completed: '/notifications/crown.svg',
  high_priority_upcoming: '/notifications/due-task.svg',
  overdue_task: '/notifications/nuri-happy.svg',
  overdue_goal: '/notifications/nuri-happy.svg',
  goal_completed: '/notifications/nuri-happy.svg',
  empty_goal: '/notifications/nuri-happy.svg',
  day_recap: '/notifications/nuri-happy.svg',
  due_goal: '/notifications/due-task.svg',
  high_priority_upcoming_goal: '/notifications/due-task.svg',
  stalled_goal: '/notifications/nuri-happy.svg',
  pause_too_long: '/notifications/nuri-happy.svg',
  overdue_backlog: '/notifications/nuri-happy.svg',
  moodboard_nudge: '/notifications/nuri-happy.svg',
  premium_nag: '/notifications/nuri-happy.svg',
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const CALENDAR_NOTIFICATION_TYPES = ['due_task', 'overdue_task', 'overdue_goal'];
const INACTIVITY_SKIP_TYPES = [...CALENDAR_NOTIFICATION_TYPES, 'stalled_goal', 'overdue_backlog'];
const INACTIVITY_COOLDOWN_DAYS = 7;
const STALLED_DAYS = 7;
const PAUSE_TOO_LONG_DAYS = 14;
const MOODBOARD_EMPTY_DAYS = 7;
const MOODBOARD_STALE_DAYS = 21;
const PREMIUM_NAG_COOLDOWN_DAYS = 14;
const OVERDUE_BACKLOG_DAYS = 7;
const OVERDUE_BACKLOG_COOLDOWN_DAYS = 7;
const FREE_GOALS_LIMIT = 2;
// Usuarios por consulta de suscripciones push: acota cada `$in` dentro de los 60 s de la función
const PUSH_SUBSCRIPTION_BATCH_SIZE = 500;

/**
 * Servicio de notificaciones programadas. Cada método es un job diario propio.
 *
 * Los jobs por zona horaria reciben un contexto `{ userIds, timezone, localDate, now }`:
 * - `userIds`: lote de usuarios a evaluar (null = todos);
 * - `timezone`: zona IANA del grupo; todo "día" se evalúa en esa zona;
 * - `localDate`: `YYYY-MM-DD` local del momento del disparo;
 * - `now`: instante del disparo.
 * Sin contexto, un job corre para todos los usuarios en la zona de producto (ART).
 */
export class ScheduledNotificationService {
  /**
   * Persiste las notificaciones in-app (con el push marcado como pendiente) y empuja las pendientes
   * de esos usuarios. Si la función muere a mitad del envío, lo que quedó pendiente se empuja en la
   * próxima corrida del mismo tipo (`pushPendingNotifications`).
   * @param {Array<{userId: string, payload: Object}>} entries
   * @param {string} label - Etiqueta para el log
   * @param {string} type - Tipo de notificación
   * @param {number} [cooldownDays] - Días de calendario sin repetir el tipo
   * @param {Object} [context] - Contexto del job (ver la doc de la clase)
   * @returns {Promise<{notified: number, persisted: number}>}
   */
  static async _sendToSubscribedUsers(entries, label, type, cooldownDays = 0, context) {
    const pendingEntries = await this._excludeNotifiedSince(entries, type, cooldownDays, context);
    if (pendingEntries.length === 0) {
      console.log(chalk.blue(`[Cron] ${label}: ya notificados`));
      return { notified: 0, persisted: 0 };
    }

    await NotificationService.createMany(
      pendingEntries.map(({ userId, payload }) => ({
        userId,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        type,
        // null explícito = push pendiente (ver pushPendingNotifications)
        pushSentAt: null,
      }))
    );

    const { sent } = await this.pushPendingNotifications({
      type,
      userIds: pendingEntries.map(entry => entry.userId),
      dayRange: this._getDayRange(0, this.resolveContext(context)),
    });

    console.log(chalk.green(`[Cron] ${label}: ${pendingEntries.length} persistidas, ${sent} push enviados`));
    return { notified: sent, persisted: pendingEntries.length };
  }

  /**
   * Empuja las notificaciones de un tipo cuyo push quedó pendiente (`pushSentAt: null`) en la ventana dada.
   * Se rearma el payload desde el documento guardado (el ícono sale de PUSH_ICONS, el modelo no lo guarda).
   *
   * Un documento se marca como enviado (`pushSentAt` = ahora) si se entregó a alguna suscripción, si el usuario
   * no tiene suscripciones o si todos los fallos fueron permanentes. Si hubo fallos transitorios (o VAPID sin
   * configurar) queda pendiente para la próxima corrida. Es at-least-once: si la función muere entre el envío y
   * la marca, el próximo intento puede duplicar ese push.
   * @param {Object} params
   * @param {string} params.type - Tipo de notificación
   * @param {Array|null} [params.userIds] - Lote de usuarios (null = todos)
   * @param {{start: Date, end: Date}} params.dayRange - Ventana [start, end) de `createdAt`
   * @returns {Promise<{pending: number, sent: number}>}
   */
  static async pushPendingNotifications({ type, userIds = null, dayRange }) {
    const pending = await Notification.find({
      type,
      ...(userIds ? { userId: { $in: userIds } } : {}),
      createdAt: { $gte: dayRange.start, $lt: dayRange.end },
      // $type 'null' (no `pushSentAt: null`, que también matchea documentos sin el campo) y pega en el índice parcial
      pushSentAt: { $type: 'null' },
    }).lean();

    if (pending.length === 0) return { pending: 0, sent: 0 };

    const subscriptionsByUser = await this._fetchSubscriptionsByUser(pending.map(doc => doc.userId));

    let sent = 0;
    for (const doc of pending) {
      const subscriptions = subscriptionsByUser.get(doc.userId.toString()) ?? [];

      let shouldMark = subscriptions.length === 0;
      if (!shouldMark) {
        const result = await PushNotificationService.sendNotification(
          doc.userId,
          { title: doc.title, body: doc.body, url: doc.url, icon: PUSH_ICONS[type] },
          subscriptions
        );
        if (result.delivered > 0) sent++;
        shouldMark = result.delivered > 0 || !result.transientFailure;
      }

      if (shouldMark) {
        await Notification.updateOne({ _id: doc._id, pushSentAt: { $type: 'null' } }, { $set: { pushSentAt: new Date() } });
      }
    }

    return { pending: pending.length, sent };
  }

  /**
   * Suscripciones push de un conjunto de usuarios, leídas en lotes (una consulta por lote).
   * @private
   * @param {Array} userIds
   * @returns {Promise<Map<string, Array>>} userId (string) -> suscripciones
   */
  static async _fetchSubscriptionsByUser(userIds) {
    const uniqueUserIds = [...new Set(userIds.map(userId => userId.toString()))];
    const subscriptionsByUser = new Map();

    for (let index = 0; index < uniqueUserIds.length; index += PUSH_SUBSCRIPTION_BATCH_SIZE) {
      const batch = uniqueUserIds.slice(index, index + PUSH_SUBSCRIPTION_BATCH_SIZE);
      const subscriptions = await PushSubscription.find({ userId: { $in: batch } });
      for (const subscription of subscriptions) {
        const key = subscription.userId.toString();
        if (!subscriptionsByUser.has(key)) subscriptionsByUser.set(key, []);
        subscriptionsByUser.get(key).push(subscription);
      }
    }

    return subscriptionsByUser;
  }

  /**
   * Completa el contexto de un job con sus valores por defecto: todos los usuarios, zona de producto,
   * "hoy" calculado a partir de `now`. Una zona inválida cae a la de producto.
   * @param {{userIds?: Array|null, timezone?: string, localDate?: string, now?: Date}} [context]
   * @returns {{userIds: Array|null, timezone: string, localDate: string, now: Date}}
   */
  static resolveContext({ userIds = null, timezone = DEFAULT_TIMEZONE, localDate, now = new Date() } = {}) {
    const zone = resolveTimeZone(timezone);
    return { userIds, timezone: zone, localDate: localDate ?? toLocalYmd(now, zone), now };
  }

  /**
   * Fragmento de filtro que limita una consulta al lote de usuarios del contexto.
   * @private
   * @param {{userIds: Array|null}} ctx
   * @param {string} [field] - Campo que referencia al usuario (`userId` o `_id`)
   * @returns {Object}
   */
  static _userScope(ctx, field = 'userId') {
    return ctx.userIds ? { [field]: { $in: ctx.userIds } } : {};
  }

  /**
   * Omite usuarios notificados del mismo tipo desde el inicio de hace `days` días de calendario locales.
   * days = 0 equivale a “ya notificado hoy”.
   */
  static async _excludeNotifiedSince(entries, type, days = 0, context) {
    const { start } = this._getDayRange(-days, this.resolveContext(context));

    const userIds = entries.map((entry) => entry.userId);
    const existing = await Notification.find({
      userId: { $in: userIds },
      type,
      createdAt: { $gte: start },
    })
      .select('userId')
      .lean();

    const alreadyNotified = new Set(existing.map((doc) => doc.userId.toString()));
    return entries.filter((entry) => !alreadyNotified.has(String(entry.userId)));
  }

  /**
   * Ventana [start, end) del día de calendario local `daysFromToday` días después de `ctx.localDate` (0 = hoy).
   * Se cuentan días de calendario, no múltiplos de 24 h: un día local dura 23 o 25 h en los cambios de horario.
   * @private
   * @param {number} daysFromToday
   * @param {{localDate: string, timezone: string}} ctx
   * @returns {{start: Date, end: Date}}
   */
  static _getDayRange(daysFromToday, ctx) {
    return getLocalDayRange(addDaysToYmd(ctx.localDate, daysFromToday), ctx.timezone);
  }

  /**
   * Ventana UTC [start, end) de una fecha límite (flotante, guardada a las 12:00Z) que cae `daysFromToday` días
   * después de `ctx.localDate`. La fecha límite es un día de calendario sin zona: se compara contra el "hoy"
   * del usuario como Y-M-D, nunca como instante.
   * @private
   * @param {number} daysFromToday
   * @param {{localDate: string}} ctx
   * @returns {{start: Date, end: Date}}
   */
  static _getDueDateRange(daysFromToday, ctx) {
    return getFloatingDayRange(this._getYmd(daysFromToday, ctx));
  }

  /**
   * YYYY-MM-DD del día de calendario local `daysFromToday` días después de `ctx.localDate`.
   * @private
   */
  static _getYmd(daysFromToday, ctx) {
    return addDaysToYmd(ctx.localDate, daysFromToday);
  }

  /**
   * Lista de tareas filtrada a un día calendario.
   * @private
   */
  static _tasksDateFilterUrl(ymd, extraQuery = '') {
    return `/tasks?dueDateFrom=${ymd}&dueDateTo=${ymd}${extraQuery}`;
  }

  /**
   * Lista de metas activas filtrada a un día calendario.
   * @private
   */
  static _goalsDateFilterUrl(ymd, extraQuery = '') {
    return `/goals?dueDateFrom=${ymd}&dueDateTo=${ymd}&status=active${extraQuery}`;
  }

  /**
   * Ordena high > medium > low. Prioridad desconocida queda como medium.
   * @private
   */
  static _sortTasksByPriority(tasks) {
    return [...tasks].sort(
      (left, right) => (PRIORITY_ORDER[left.priority] ?? 1) - (PRIORITY_ORDER[right.priority] ?? 1)
    );
  }

  /**
   * Agrupa documentos por userId.
   * @private
   */
  static _groupTasksByUser(tasks) {
    const tasksByUser = new Map();
    for (const task of tasks) {
      const userId = task.userId.toString();
      if (!tasksByUser.has(userId)) tasksByUser.set(userId, []);
      tasksByUser.get(userId).push(task);
    }
    return tasksByUser;
  }

  /**
   * Notifica a usuarios que tienen tareas con dueDate = hoy y no completadas.
   * Agrupa por userId para enviar una sola notificación por usuario.
   */
  static async checkDueTasks(context) {
    const ctx = this.resolveContext(context);
    const { start, end } = this._getDueDateRange(0, ctx);

    const dueTasks = await Todo.find({
      ...this._userScope(ctx),
      dueDate: { $gte: start, $lt: end },
      completed: false,
    }).lean();

    if (dueTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas por vencer hoy'));
      return { notified: 0, persisted: 0 };
    }

    const tasksByUser = this._groupTasksByUser(dueTasks);
    const listUrl = this._tasksDateFilterUrl(this._getYmd(0, ctx));

    const entries = Array.from(tasksByUser, ([userId, tasks]) => {
      const sortedTasks = this._sortTasksByPriority(tasks);
      const singleTask = sortedTasks.length === 1 ? sortedTasks[0] : null;
      return {
        userId,
        payload: singleTask
          ? {
              title: 'Tu tarea te espera',
              body: `'${singleTask.title}' es para hoy. ¡Dale, que estás cerca!`,
              url: `/tasks?task=${singleTask._id}`,
            }
          : {
              title: 'Tenés tareas para hoy',
              body: `Hay ${sortedTasks.length} tareas para hoy. Paso a paso, ¡vos podés con todo!`,
              url: listUrl,
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Tareas por vencer', 'due_task', 0, ctx);
  }

  /**
   * Notifica tareas no completadas cuya fecha era ayer.
   */
  static async checkOverdueTasks(context) {
    const ctx = this.resolveContext(context);
    const { start, end } = this._getDueDateRange(-1, ctx);

    const overdueTasks = await Todo.find({
      ...this._userScope(ctx),
      dueDate: { $gte: start, $lt: end },
      completed: false,
    }).lean();

    if (overdueTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas de ayer sin completar'));
      return { notified: 0, persisted: 0 };
    }

    const tasksByUser = this._groupTasksByUser(overdueTasks);
    const listUrl = this._tasksDateFilterUrl(this._getYmd(-1, ctx));

    const entries = Array.from(tasksByUser, ([userId, tasks]) => {
      const sortedTasks = this._sortTasksByPriority(tasks);
      const singleTask = sortedTasks.length === 1 ? sortedTasks[0] : null;
      return {
        userId,
        payload: singleTask
          ? {
              title: 'Podemos rearmar esto',
              body: `'${singleTask.title}' quedó para ayer. Si querés, cambiale la fecha y seguí a tu ritmo.`,
              url: `/tasks/${singleTask._id}/edit`,
            }
          : {
              title: 'Hay tiempo para rearmar',
              body: `Tenés ${sortedTasks.length} tareas de ayer. No hay problema: podés cambiarles la fecha y seguir.`,
              url: listUrl,
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Tareas de ayer', 'overdue_task', 0, ctx);
  }

  /**
   * Notifica metas activas cuya fecha era ayer.
   */
  static async checkOverdueGoals(context) {
    const ctx = this.resolveContext(context);
    const { start, end } = this._getDueDateRange(-1, ctx);

    const overdueGoals = await Goal.find({
      ...this._userScope(ctx),
      dueDate: { $gte: start, $lt: end },
      status: 'active',
    }).lean();

    if (overdueGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas de ayer sin completar'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(overdueGoals);
    const listUrl = this._goalsDateFilterUrl(this._getYmd(-1, ctx));

    const entries = Array.from(goalsByUser, ([userId, goals]) => {
      const sortedGoals = this._sortTasksByPriority(goals);
      const singleGoal = sortedGoals.length === 1 ? sortedGoals[0] : null;
      return {
        userId,
        payload: singleGoal
          ? {
              title: 'Podemos mirar esto juntos',
              body: `Ayer habías pensado en '${singleGoal.title}'. Si querés, lo miramos o movemos la fecha.`,
              url: `/goals/${singleGoal._id}`,
            }
          : {
              title: 'Hay tiempo para rearmar',
              body: `Hay ${sortedGoals.length} metas de ayer. No hay problema: podés mirarlas o cambiarles la fecha.`,
              url: listUrl,
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Metas de ayer', 'overdue_goal', 0, ctx);
  }

  /**
   * Notifica tareas de prioridad alta que vencen exactamente en 4 días.
   * Una notificación por usuario y día (tipo high_priority_upcoming).
   */
  static async checkUpcomingHighPriorityTasks(context) {
    const ctx = this.resolveContext(context);
    const { start, end } = this._getDueDateRange(4, ctx);

    const upcomingTasks = await Todo.find({
      ...this._userScope(ctx),
      dueDate: { $gte: start, $lt: end },
      completed: false,
      priority: 'high',
    }).lean();

    if (upcomingTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas de prioridad alta que vencen en 4 días'));
      return { notified: 0, persisted: 0 };
    }

    const tasksByUser = this._groupTasksByUser(upcomingTasks);
    const listUrl = this._tasksDateFilterUrl(this._getYmd(4, ctx), '&priority=high');

    const entries = Array.from(tasksByUser, ([userId, tasks]) => {
      const singleTask = tasks.length === 1 ? tasks[0] : null;
      return {
        userId,
        payload: singleTask
          ? {
              title: 'Esta merece tu foco',
              body: `'${singleTask.title}' es importante y es para dentro de 4 días. Si la arrancás ahora, llegás con tiempo.`,
              url: `/tasks?task=${singleTask._id}`,
            }
          : {
              title: 'Hay tareas importantes en camino',
              body: `Tenés ${tasks.length} tareas importantes para dentro de 4 días. Paso a paso, ahora es más fácil.`,
              url: listUrl,
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Tareas de prioridad alta en 4 días', 'high_priority_upcoming', 0, ctx);
  }

  /**
   * Notifica metas activas con dueDate hoy y al menos una tarea.
   */
  static async checkDueGoals(context) {
    const ctx = this.resolveContext(context);
    const { start, end } = this._getDueDateRange(0, ctx);

    const dueGoals = await Goal.find({
      ...this._userScope(ctx),
      dueDate: { $gte: start, $lt: end },
      status: 'active',
      totalTasks: { $gt: 0 },
    }).lean();

    if (dueGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas con fecha para hoy'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(dueGoals);
    const listUrl = this._goalsDateFilterUrl(this._getYmd(0, ctx));

    const entries = Array.from(goalsByUser, ([userId, goals]) => {
      const sortedGoals = this._sortTasksByPriority(goals);
      const singleGoal = sortedGoals.length === 1 ? sortedGoals[0] : null;
      return {
        userId,
        payload: singleGoal
          ? {
              title: 'Tu meta te espera',
              body: `'${singleGoal.title}' es para hoy. ¡Dale, que estás cerca!`,
              url: `/goals/${singleGoal._id}`,
            }
          : {
              title: 'Tenés metas para hoy',
              body: `Hay ${sortedGoals.length} metas para hoy. Paso a paso, ¡vos podés con todo!`,
              url: listUrl,
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Metas con fecha para hoy', 'due_goal', 0, ctx);
  }

  /**
   * Notifica metas activas sin tareas cuya fecha es hoy o exactamente en 4 días.
   */
  static async checkEmptyGoals(context) {
    const ctx = this.resolveContext(context);
    const today = this._getDueDateRange(0, ctx);
    const inFourDays = this._getDueDateRange(4, ctx);

    const emptyGoals = await Goal.find({
      ...this._userScope(ctx),
      status: 'active',
      totalTasks: 0,
      $or: [
        { dueDate: { $gte: today.start, $lt: today.end } },
        { dueDate: { $gte: inFourDays.start, $lt: inFourDays.end } },
      ],
    }).lean();

    if (emptyGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas vacías para hoy o +4 días'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(emptyGoals);

    const entries = Array.from(goalsByUser, ([userId, goals]) => {
      const singleGoal = goals.length === 1 ? goals[0] : null;
      return {
        userId,
        payload: singleGoal
          ? {
              title: 'Esta meta todavía espera el primer paso',
              body: `'${singleGoal.title}' todavía no tiene pasos. Cuando quieras, armamos el primero.`,
              url: `/goals/${singleGoal._id}`,
            }
          : {
              title: 'Hay metas sin el primer paso',
              body: `Tenés ${goals.length} metas activas sin tareas. Cuando quieras, armamos el primero.`,
              url: '/goals?status=active',
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Metas vacías', 'empty_goal', 0, ctx);
  }

  /**
   * Notifica metas activas de prioridad alta que vencen exactamente en 4 días y tienen tareas.
   */
  static async checkUpcomingHighPriorityGoals(context) {
    const ctx = this.resolveContext(context);
    const { start, end } = this._getDueDateRange(4, ctx);

    const upcomingGoals = await Goal.find({
      ...this._userScope(ctx),
      dueDate: { $gte: start, $lt: end },
      status: 'active',
      priority: 'high',
      totalTasks: { $gt: 0 },
    }).lean();

    if (upcomingGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas de prioridad alta que vencen en 4 días'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(upcomingGoals);
    const listUrl = this._goalsDateFilterUrl(this._getYmd(4, ctx), '&priority=high');

    const entries = Array.from(goalsByUser, ([userId, goals]) => {
      const singleGoal = goals.length === 1 ? goals[0] : null;
      return {
        userId,
        payload: singleGoal
          ? {
              title: 'Esta merece tu foco',
              body: `'${singleGoal.title}' es importante y es para dentro de 4 días. Si la arrancás ahora, llegás con tiempo.`,
              url: `/goals/${singleGoal._id}`,
            }
          : {
              title: 'Hay metas importantes en camino',
              body: `Tenés ${goals.length} metas importantes para dentro de 4 días. Paso a paso, ahora es más fácil.`,
              url: listUrl,
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Metas de prioridad alta en 4 días', 'high_priority_upcoming_goal', 0, ctx);
  }

  /**
   * Recap positivo de la noche: usuarios que completaron al menos una tarea hoy.
   */
  static async checkDayRecap(context) {
    const ctx = this.resolveContext(context);
    const today = ctx.localDate;

    const metricsWithActivity = await Metrics.find({
      ...this._userScope(ctx),
      history: {
        $elemMatch: {
          day: today,
          $or: [{ tasksCompleted: { $gt: 0 } }, { goalsCompleted: { $gt: 0 } }],
        },
      },
    }).lean();

    if (metricsWithActivity.length === 0) {
      console.log(chalk.blue('[Cron] Nadie completó tareas ni metas hoy para el recap'));
      return { notified: 0, persisted: 0 };
    }

    const entries = metricsWithActivity.map((metric) => {
      const todayRecord = metric.history.find((entry) => entry.day === today);
      return {
        userId: metric.userId.toString(),
        payload: {
          title: 'Qué día',
          body: `Hoy cerraste ${this._describeDayActivity(todayRecord)}. Eso suma. Mañana seguimos.`,
          url: '/',
        },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Recap del día', 'day_recap', 0, ctx);
  }

  /**
   * Arma las partes del recap: "3 tareas", "1 meta" o "3 tareas y 1 meta".
   * @private
   * @param {{tasksCompleted?: number, goalsCompleted?: number}} dayRecord
   * @returns {string}
   */
  static _describeDayActivity({ tasksCompleted = 0, goalsCompleted = 0 }) {
    const parts = [];
    if (tasksCompleted > 0) {
      parts.push(`${tasksCompleted} ${tasksCompleted === 1 ? 'tarea' : 'tareas'}`);
    }
    if (goalsCompleted > 0) {
      parts.push(`${goalsCompleted} ${goalsCompleted === 1 ? 'meta' : 'metas'}`);
    }
    return parts.join(' y ');
  }

  /**
   * Notifica a usuarios con racha activa cuya última actividad fue ayer
   * (aún no completaron tarea hoy). Se ejecuta por la noche.
   */
  static async checkStreaksAtRisk(context) {
    const ctx = this.resolveContext(context);
    const yesterday = this._getYmd(-1, ctx);

    // Última actividad ayer: la racha guardada sigue vigente (es la efectiva) y hoy todavía no hubo actividad
    const metricsAtRisk = await Metrics.find({
      ...this._userScope(ctx),
      currentStreak: { $gt: 0 },
      lastActivityDay: yesterday,
    }).lean();

    if (metricsAtRisk.length === 0) {
      console.log(chalk.blue('[Cron] No hay rachas en riesgo'));
      return { notified: 0, persisted: 0 };
    }

    const entries = metricsAtRisk.map(metric => ({
      userId: metric.userId.toString(),
      payload: {
        title: `¡Tu racha de ${metric.currentStreak} días está en riesgo!`,
        body: 'Todavía no completaste tareas hoy. ¡Entrá y seguí sumando para no perderla!',
        url: '/metrics',
      },
    }));

    return this._sendToSubscribedUsers(entries, 'Rachas en riesgo', 'streak_risk', 0, ctx);
  }

  /**
   * Notifica a usuarios inactivos (sin actividad en los últimos 2 días).
   * Omite quien nunca tuvo actividad, quien ya recibió due/overdue hoy,
   * y quien ya tiene inactivity en los últimos INACTIVITY_COOLDOWN_DAYS días.
   */
  static async checkInactiveUsers(context) {
    const ctx = this.resolveContext(context);
    const twoDaysAgo = this._getYmd(-2, ctx);

    // Las claves YYYY-MM-DD ordenan igual que las fechas, así que $lte compara bien
    const inactiveMetrics = await Metrics.find({
      ...this._userScope(ctx),
      lastActivityDay: { $ne: null, $lte: twoDaysAgo },
    }).lean();

    if (inactiveMetrics.length === 0) {
      console.log(chalk.blue('[Cron] No hay usuarios inactivos'));
      return { notified: 0, persisted: 0 };
    }

    const userIds = inactiveMetrics.map((metric) => metric.userId);
    const { start: startOfDay } = this._getDayRange(0, ctx);
    const { start: cooldownStart } = this._getDayRange(-INACTIVITY_COOLDOWN_DAYS, ctx);

    const [calendarNotified, recentInactivity] = await Promise.all([
      Notification.find({
        userId: { $in: userIds },
        type: { $in: INACTIVITY_SKIP_TYPES },
        createdAt: { $gte: startOfDay },
      })
        .select('userId')
        .lean(),
      Notification.find({
        userId: { $in: userIds },
        type: 'inactivity',
        createdAt: { $gte: cooldownStart },
      })
        .select('userId')
        .lean(),
    ]);

    const skipUserIds = new Set([
      ...calendarNotified.map((doc) => doc.userId.toString()),
      ...recentInactivity.map((doc) => doc.userId.toString()),
    ]);
    const remaining = inactiveMetrics.filter(
      (metric) => !skipUserIds.has(metric.userId.toString())
    );

    if (remaining.length === 0) {
      console.log(chalk.blue('[Cron] Usuarios inactivos: ya cubiertos por calendario o cooldown'));
      return { notified: 0, persisted: 0 };
    }

    const entries = remaining.map(metric => ({
      userId: metric.userId.toString(),
      payload: {
        title: '¡Cada día cuenta!',
        body: 'Hace un tiempito que no te vemos. Volvé a Nuri Task y seguí avanzando, tus metas te esperan.',
        url: '/',
      },
    }));

    return this._sendToSubscribedUsers(entries, 'Usuarios inactivos', 'inactivity', 0, ctx);
  }

  /**
   * Meta activa con hijos, sin movimiento en STALLED_DAYS.
   */
  static async checkStalledGoals(context) {
    const ctx = this.resolveContext(context);
    const { start: cutoff } = this._getDayRange(-STALLED_DAYS, ctx);

    const stalledGoals = await Goal.find({
      ...this._userScope(ctx),
      status: 'active',
      $expr: { $gt: [{ $add: ['$totalTasks', '$totalSubGoals'] }, 0] },
      $or: [
        { lastChildActivity: { $lte: cutoff } },
        { lastChildActivity: null, createdAt: { $lte: cutoff } },
      ],
    }).lean();

    if (stalledGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas estancadas'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(stalledGoals);
    const entries = Array.from(goalsByUser, ([userId, goals]) => {
      const singleGoal = goals.length === 1 ? goals[0] : null;
      return {
        userId,
        payload: singleGoal
          ? {
              title: 'Tu meta sigue ahí',
              body: `'${singleGoal.title}' tiene pasos y hace un tiempo que no se mueve. Cuando quieras, retomalos.`,
              url: `/goals/${singleGoal._id}`,
            }
          : {
              title: 'Hay metas que esperan un paso',
              body: `Tenés ${goals.length} metas con pasos quietos. Un pasito alcanza.`,
              url: '/goals?status=active',
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Metas estancadas', 'stalled_goal', STALLED_DAYS, ctx);
  }

  /**
   * Meta en pausa hace PAUSE_TOO_LONG_DAYS o más.
   */
  static async checkPausedTooLong(context) {
    const ctx = this.resolveContext(context);
    const { start: cutoff } = this._getDayRange(-PAUSE_TOO_LONG_DAYS, ctx);

    const pausedGoals = await Goal.find({
      ...this._userScope(ctx),
      status: 'paused',
      pausedAt: { $lte: cutoff },
    }).lean();

    if (pausedGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas en pausa larga'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(pausedGoals);
    const entries = Array.from(goalsByUser, ([userId, goals]) => {
      const singleGoal = goals.length === 1 ? goals[0] : null;
      return {
        userId,
        payload: singleGoal
          ? {
              title: '¿Seguimos con esta meta?',
              body: `'${singleGoal.title}' está en pausa hace un tiempo. Si querés, la reanudamos o la dejamos así.`,
              url: `/goals/${singleGoal._id}`,
            }
          : {
              title: 'Hay metas en pausa',
              body: `Tenés ${goals.length} metas en pausa hace un tiempo. Si querés, las reanudamos o las dejamos así.`,
              url: '/goals?status=paused',
            },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Metas en pausa larga', 'pause_too_long', PAUSE_TOO_LONG_DAYS, ctx);
  }

  /**
   * Tareas y metas con fecha de hace 7+ días (no pisa el job de ayer).
   */
  static async checkOverdueBacklog(context) {
    const ctx = this.resolveContext(context);
    const { start: startOfDay } = this._getDayRange(0, ctx);
    const { start: backlogCutoff } = this._getDueDateRange(-(OVERDUE_BACKLOG_DAYS - 1), ctx);

    const [alreadyToday] = await Promise.all([
      Notification.find({
        ...this._userScope(ctx),
        type: { $in: ['overdue_task', 'overdue_goal'] },
        createdAt: { $gte: startOfDay },
      })
        .select('userId')
        .lean(),
    ]);
    const skipUserIds = new Set(alreadyToday.map((doc) => doc.userId.toString()));

    const [overdueTasks, overdueGoals] = await Promise.all([
      Todo.find({ ...this._userScope(ctx), completed: false, dueDate: { $lt: backlogCutoff } }).lean(),
      Goal.find({ ...this._userScope(ctx), status: 'active', dueDate: { $lt: backlogCutoff } }).lean(),
    ]);

    const itemsByUser = new Map();
    for (const task of overdueTasks) {
      const userId = task.userId.toString();
      if (skipUserIds.has(userId)) continue;
      if (!itemsByUser.has(userId)) itemsByUser.set(userId, { tasks: [], goals: [] });
      itemsByUser.get(userId).tasks.push(task);
    }
    for (const goal of overdueGoals) {
      const userId = goal.userId.toString();
      if (skipUserIds.has(userId)) continue;
      if (!itemsByUser.has(userId)) itemsByUser.set(userId, { tasks: [], goals: [] });
      itemsByUser.get(userId).goals.push(goal);
    }

    if (itemsByUser.size === 0) {
      console.log(chalk.blue('[Cron] No hay backlog vencido de 7+ días'));
      return { notified: 0, persisted: 0 };
    }

    const ymd = this._getYmd(-(OVERDUE_BACKLOG_DAYS - 1), ctx);
    const entries = Array.from(itemsByUser, ([userId, { tasks, goals }]) => {
      const total = tasks.length + goals.length;
      const singleTask = tasks.length === 1 && goals.length === 0 ? tasks[0] : null;
      const singleGoal = goals.length === 1 && tasks.length === 0 ? goals[0] : null;
      return {
        userId,
        payload: singleTask
          ? {
              title: 'Podemos rearmar esto con calma',
              body: `'${singleTask.title}' quedó atrás. Si querés, le cambiamos la fecha y seguimos.`,
              url: `/tasks/${singleTask._id}/edit`,
            }
          : singleGoal
            ? {
                title: 'Podemos rearmar esto con calma',
                body: `'${singleGoal.title}' quedó atrás. Si querés, le cambiamos la fecha y seguimos.`,
                url: `/goals/${singleGoal._id}`,
              }
            : {
                title: 'Podemos rearmar esto con calma',
                body: `Hay ${total} cosas con fecha atrás. Sin apuro: las miramos o les movemos el día.`,
                url: tasks.length >= goals.length
                  ? `/tasks?dueDateTo=${ymd}`
                  : `/goals?status=active&dueDateTo=${ymd}`,
              },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Backlog vencido', 'overdue_backlog', OVERDUE_BACKLOG_COOLDOWN_DAYS, ctx);
  }

  /**
   * Moodboard premium vacío o sin imagen nueva.
   */
  static async checkMoodboardNudge(context) {
    const ctx = this.resolveContext(context);
    const { start: startOfDay } = this._getDayRange(0, ctx);
    const premiumUsers = await User.find({
      ...this._userScope(ctx, '_id'),
      $or: [{ 'subscription.isActive': true }, { isAdmin: true }],
    })
      .select('_id subscription.startDate createdAt')
      .lean();

    if (premiumUsers.length === 0) {
      console.log(chalk.blue('[Cron] No hay usuarios premium para moodboard'));
      return { notified: 0, persisted: 0 };
    }

    const premiumNagToday = await Notification.find({
      userId: { $in: premiumUsers.map((user) => user._id) },
      type: 'premium_nag',
      createdAt: { $gte: startOfDay },
    })
      .select('userId')
      .lean();
    const skipNag = new Set(premiumNagToday.map((doc) => doc.userId.toString()));

    const boards = await Moodboard.find({
      userId: { $in: premiumUsers.map((user) => user._id) },
    }).lean();
    const boardByUser = new Map(boards.map((board) => [board.userId.toString(), board]));

    const { start: emptyCutoff } = this._getDayRange(-MOODBOARD_EMPTY_DAYS, ctx);
    const { start: staleCutoff } = this._getDayRange(-MOODBOARD_STALE_DAYS, ctx);

    const entries = [];
    for (const user of premiumUsers) {
      const userId = user._id.toString();
      if (skipNag.has(userId)) continue;

      const board = boardByUser.get(userId);
      const imageCount = board?.images?.length ?? 0;
      const premiumStart = user.subscription?.startDate || user.createdAt;

      if (imageCount === 0 && premiumStart && new Date(premiumStart) <= emptyCutoff) {
        entries.push({
          userId,
          payload: {
            title: 'Tu tablero está listo',
            body: 'Cuando quieras, subí una imagen que te represente.',
            url: '/moodboard',
          },
        });
        continue;
      }

      if (imageCount > 0 && board.lastImageAddedAt && new Date(board.lastImageAddedAt) <= staleCutoff) {
        entries.push({
          userId,
          payload: {
            title: '¿Sumamos una imagen?',
            body: 'Hace un tiempo que tu moodboard no cambia. Si te copa, agregá una.',
            url: '/moodboard',
          },
        });
      }
    }

    if (entries.length === 0) {
      console.log(chalk.blue('[Cron] No hay nudges de moodboard'));
      return { notified: 0, persisted: 0 };
    }

    return this._sendToSubscribedUsers(entries, 'Moodboard', 'moodboard_nudge', MOODBOARD_STALE_DAYS, ctx);
  }

  /**
   * Nag suave a free users que ya chocaron el techo de metas.
   */
  static async checkPremiumNag(context) {
    const ctx = this.resolveContext(context);
    const { start: cooldownStart } = this._getDayRange(-PREMIUM_NAG_COOLDOWN_DAYS, ctx);
    const recentCancelCutoff = cooldownStart;

    const freeUsers = await User.find({
      ...this._userScope(ctx, '_id'),
      isAdmin: { $ne: true },
      'subscription.isActive': { $ne: true },
      $or: [{ 'subscription.endDate': null }, { 'subscription.endDate': { $lte: recentCancelCutoff } }],
    })
      .select('_id')
      .lean();

    if (freeUsers.length === 0) {
      return { notified: 0, persisted: 0 };
    }

    const moodboardToday = await Notification.find({
      userId: { $in: freeUsers.map((user) => user._id) },
      type: 'moodboard_nudge',
      createdAt: { $gte: this._getDayRange(0, ctx).start },
    })
      .select('userId')
      .lean();
    const skipMoodboard = new Set(moodboardToday.map((doc) => doc.userId.toString()));

    const entries = [];
    for (const user of freeUsers) {
      if (skipMoodboard.has(user._id.toString())) continue;
      const goalCount = await Goal.countDocuments({ userId: user._id });
      if (goalCount < FREE_GOALS_LIMIT) continue;
      entries.push({
        userId: user._id.toString(),
        payload: {
          title: 'Hay más espacio para tus metas',
          body: 'Con Premium las metas son ilimitadas, y también el moodboard y las métricas. Si te sirve, lo miramos.',
          url: '/subscription',
        },
      });
    }

    if (entries.length === 0) {
      console.log(chalk.blue('[Cron] Nadie alcanzó el techo free para premium nag'));
      return { notified: 0, persisted: 0 };
    }

    return this._sendToSubscribedUsers(entries, 'Premium nag', 'premium_nag', PREMIUM_NAG_COOLDOWN_DAYS, ctx);
  }
}
