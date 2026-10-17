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
  formatDateYmdInTimeZone,
  getDayRangeInTimeZone,
  getStartOfDayInTimeZone,
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
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FREE_GOALS_LIMIT = 2;

/**
 * Servicio de notificaciones programadas. Cada método es un cron diario propio.
 */
export class ScheduledNotificationService {
  /**
   * Persiste notificaciones in-app para todos los usuarios y envía push
   * solo a aquellos con suscripción activa.
   * @param {Array<{userId: string, payload: Object}>} entries
   * @param {string} label - Etiqueta para el log
   * @param {string} type - Tipo de notificación
   * @returns {Promise<{notified: number, persisted: number}>}
   */
  static async _sendToSubscribedUsers(entries, label, type, cooldownDays = 0) {
    const pendingEntries = await this._excludeNotifiedSince(entries, type, cooldownDays);
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
      }))
    );

    let notified = 0;

    for (const { userId, payload } of pendingEntries) {
      const hasSub = await PushSubscription.exists({ userId });
      if (!hasSub) continue;

      await PushNotificationService.sendNotification(userId, {
        ...payload,
        icon: payload.icon || PUSH_ICONS[type],
      });
      notified++;
    }

    console.log(chalk.green(`[Cron] ${label}: ${pendingEntries.length} persistidas, ${notified} push enviados`));
    return { notified, persisted: pendingEntries.length };
  }

  /**
   * Omite usuarios notificados del mismo tipo desde el inicio de hace `days` días ART.
   * days = 0 equivale a “ya notificado hoy”.
   */
  static async _excludeNotifiedSince(entries, type, days = 0) {
    const start = getStartOfDayInTimeZone();
    start.setTime(start.getTime() - days * MS_PER_DAY);

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
   * Ventana [start, end) del día calendario ART corrido `daysFromToday` (0 = hoy).
   * @private
   */
  static _getDayRange(daysFromToday) {
    return getDayRangeInTimeZone(daysFromToday);
  }

  /**
   * YYYY-MM-DD en ART (misma base que `_getDayRange`).
   * @private
   */
  static _formatDateYmd(date) {
    return formatDateYmdInTimeZone(date);
  }

  /**
   * Lista de tareas filtrada a un día calendario.
   * @private
   */
  static _tasksDateFilterUrl(rangeStart, extraQuery = '') {
    const ymd = this._formatDateYmd(rangeStart);
    return `/tasks?dueDateFrom=${ymd}&dueDateTo=${ymd}${extraQuery}`;
  }

  /**
   * Lista de metas activas filtrada a un día calendario.
   * @private
   */
  static _goalsDateFilterUrl(rangeStart, extraQuery = '') {
    const ymd = this._formatDateYmd(rangeStart);
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
   * Resetea a 0 las rachas de usuarios cuya última actividad fue hace 2+ días.
   */
  static async resetExpiredStreaks() {
    const { start: yesterday } = this._getDayRange(-1);

    const result = await Metrics.updateMany(
      { currentStreak: { $gt: 0 }, lastActivityDate: { $lt: yesterday } },
      { $set: { currentStreak: 0 } }
    );

    if (result.modifiedCount > 0) {
      console.log(chalk.yellow(`[Cron] Rachas expiradas reseteadas: ${result.modifiedCount}`));
    }

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Notifica a usuarios que tienen tareas con dueDate = hoy y no completadas.
   * Agrupa por userId para enviar una sola notificación por usuario.
   */
  static async checkDueTasks() {
    const { start, end } = this._getDayRange(0);

    const dueTasks = await Todo.find({
      dueDate: { $gte: start, $lt: end },
      completed: false,
    }).lean();

    if (dueTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas por vencer hoy'));
      return { notified: 0, persisted: 0 };
    }

    const tasksByUser = this._groupTasksByUser(dueTasks);
    const listUrl = this._tasksDateFilterUrl(start);

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

    return this._sendToSubscribedUsers(entries, 'Tareas por vencer', 'due_task');
  }

  /**
   * Notifica tareas no completadas cuya fecha era ayer.
   */
  static async checkOverdueTasks() {
    const { start, end } = this._getDayRange(-1);

    const overdueTasks = await Todo.find({
      dueDate: { $gte: start, $lt: end },
      completed: false,
    }).lean();

    if (overdueTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas de ayer sin completar'));
      return { notified: 0, persisted: 0 };
    }

    const tasksByUser = this._groupTasksByUser(overdueTasks);
    const listUrl = this._tasksDateFilterUrl(start);

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

    return this._sendToSubscribedUsers(entries, 'Tareas de ayer', 'overdue_task');
  }

  /**
   * Notifica metas activas cuya fecha era ayer.
   */
  static async checkOverdueGoals() {
    const { start, end } = this._getDayRange(-1);

    const overdueGoals = await Goal.find({
      dueDate: { $gte: start, $lt: end },
      status: 'active',
    }).lean();

    if (overdueGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas de ayer sin completar'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(overdueGoals);
    const listUrl = this._goalsDateFilterUrl(start);

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

    return this._sendToSubscribedUsers(entries, 'Metas de ayer', 'overdue_goal');
  }

  /**
   * Notifica tareas de prioridad alta que vencen exactamente en 4 días.
   * Una notificación por usuario y día (tipo high_priority_upcoming).
   */
  static async checkUpcomingHighPriorityTasks() {
    const { start, end } = this._getDayRange(4);

    const upcomingTasks = await Todo.find({
      dueDate: { $gte: start, $lt: end },
      completed: false,
      priority: 'high',
    }).lean();

    if (upcomingTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas de prioridad alta que vencen en 4 días'));
      return { notified: 0, persisted: 0 };
    }

    const tasksByUser = this._groupTasksByUser(upcomingTasks);
    const listUrl = this._tasksDateFilterUrl(start, '&priority=high');

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

    return this._sendToSubscribedUsers(entries, 'Tareas de prioridad alta en 4 días', 'high_priority_upcoming');
  }

  /**
   * Notifica metas activas con dueDate hoy y al menos una tarea.
   */
  static async checkDueGoals() {
    const { start, end } = this._getDayRange(0);

    const dueGoals = await Goal.find({
      dueDate: { $gte: start, $lt: end },
      status: 'active',
      totalTasks: { $gt: 0 },
    }).lean();

    if (dueGoals.length === 0) {
      console.log(chalk.blue('[Cron] No hay metas con fecha para hoy'));
      return { notified: 0, persisted: 0 };
    }

    const goalsByUser = this._groupTasksByUser(dueGoals);
    const listUrl = this._goalsDateFilterUrl(start);

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

    return this._sendToSubscribedUsers(entries, 'Metas con fecha para hoy', 'due_goal');
  }

  /**
   * Notifica metas activas sin tareas cuya fecha es hoy o exactamente en 4 días.
   */
  static async checkEmptyGoals() {
    const today = this._getDayRange(0);
    const inFourDays = this._getDayRange(4);

    const emptyGoals = await Goal.find({
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

    return this._sendToSubscribedUsers(entries, 'Metas vacías', 'empty_goal');
  }

  /**
   * Notifica metas activas de prioridad alta que vencen exactamente en 4 días y tienen tareas.
   */
  static async checkUpcomingHighPriorityGoals() {
    const { start, end } = this._getDayRange(4);

    const upcomingGoals = await Goal.find({
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
    const listUrl = this._goalsDateFilterUrl(start, '&priority=high');

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

    return this._sendToSubscribedUsers(entries, 'Metas de prioridad alta en 4 días', 'high_priority_upcoming_goal');
  }

  /**
   * Recap positivo de la noche: usuarios que completaron al menos una tarea hoy.
   */
  static async checkDayRecap() {
    const { start, end } = this._getDayRange(0);

    const metricsWithActivity = await Metrics.find({
      history: {
        $elemMatch: {
          date: { $gte: start, $lt: end },
          tasksCompleted: { $gt: 0 },
        },
      },
    }).lean();

    if (metricsWithActivity.length === 0) {
      console.log(chalk.blue('[Cron] Nadie completó tareas hoy para el recap'));
      return { notified: 0, persisted: 0 };
    }

    const entries = metricsWithActivity.map((metric) => {
      const todayRecord = (metric.history || []).find(
        (entry) => entry.date >= start && entry.date < end && entry.tasksCompleted > 0
      );
      const count = todayRecord?.tasksCompleted ?? 1;
      const taskWord = count === 1 ? 'tarea' : 'tareas';
      return {
        userId: metric.userId.toString(),
        payload: {
          title: 'Qué día',
          body: `Hoy cerraste ${count} ${taskWord}. Eso suma. Mañana seguimos.`,
          url: '/',
        },
      };
    });

    return this._sendToSubscribedUsers(entries, 'Recap del día', 'day_recap');
  }

  /**
   * Notifica a usuarios con racha activa cuya última actividad fue ayer
   * (aún no completaron tarea hoy). Se ejecuta por la noche.
   */
  static async checkStreaksAtRisk() {
    const { start: today } = this._getDayRange(0);
    const { start: yesterday } = this._getDayRange(-1);

    const metricsAtRisk = await Metrics.find({
      currentStreak: { $gt: 0 },
      lastActivityDate: { $gte: yesterday, $lt: today },
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

    return this._sendToSubscribedUsers(entries, 'Rachas en riesgo', 'streak_risk');
  }

  /**
   * Notifica a usuarios inactivos (sin actividad en los últimos 2 días).
   * Omite quien nunca tuvo actividad, quien ya recibió due/overdue hoy,
   * y quien ya tiene inactivity en los últimos INACTIVITY_COOLDOWN_DAYS días.
   */
  static async checkInactiveUsers() {
    const { start: twoDaysAgo } = this._getDayRange(-2);

    const inactiveMetrics = await Metrics.find({
      lastActivityDate: { $ne: null, $lte: twoDaysAgo },
    }).lean();

    if (inactiveMetrics.length === 0) {
      console.log(chalk.blue('[Cron] No hay usuarios inactivos'));
      return { notified: 0, persisted: 0 };
    }

    const userIds = inactiveMetrics.map((metric) => metric.userId);
    const { start: startOfDay } = this._getDayRange(0);
    const cooldownStart = getStartOfDayInTimeZone();
    cooldownStart.setTime(cooldownStart.getTime() - INACTIVITY_COOLDOWN_DAYS * MS_PER_DAY);

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

    return this._sendToSubscribedUsers(entries, 'Usuarios inactivos', 'inactivity');
  }

  /**
   * Meta activa con hijos, sin movimiento en STALLED_DAYS.
   */
  static async checkStalledGoals() {
    const cutoff = new Date(getStartOfDayInTimeZone().getTime() - STALLED_DAYS * MS_PER_DAY);

    const stalledGoals = await Goal.find({
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

    return this._sendToSubscribedUsers(entries, 'Metas estancadas', 'stalled_goal', STALLED_DAYS);
  }

  /**
   * Meta en pausa hace PAUSE_TOO_LONG_DAYS o más.
   */
  static async checkPausedTooLong() {
    const cutoff = new Date(getStartOfDayInTimeZone().getTime() - PAUSE_TOO_LONG_DAYS * MS_PER_DAY);

    const pausedGoals = await Goal.find({
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

    return this._sendToSubscribedUsers(entries, 'Metas en pausa larga', 'pause_too_long', PAUSE_TOO_LONG_DAYS);
  }

  /**
   * Tareas y metas con fecha de hace 7+ días (no pisa el job de ayer).
   */
  static async checkOverdueBacklog() {
    const { start: startOfDay } = this._getDayRange(0);
    const { start: backlogCutoff } = this._getDayRange(-(OVERDUE_BACKLOG_DAYS - 1));

    const [alreadyToday] = await Promise.all([
      Notification.find({
        type: { $in: ['overdue_task', 'overdue_goal'] },
        createdAt: { $gte: startOfDay },
      })
        .select('userId')
        .lean(),
    ]);
    const skipUserIds = new Set(alreadyToday.map((doc) => doc.userId.toString()));

    const [overdueTasks, overdueGoals] = await Promise.all([
      Todo.find({ completed: false, dueDate: { $lt: backlogCutoff } }).lean(),
      Goal.find({ status: 'active', dueDate: { $lt: backlogCutoff } }).lean(),
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

    const ymd = this._formatDateYmd(backlogCutoff);
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

    return this._sendToSubscribedUsers(entries, 'Backlog vencido', 'overdue_backlog', OVERDUE_BACKLOG_COOLDOWN_DAYS);
  }

  /**
   * Moodboard premium vacío o sin imagen nueva.
   */
  static async checkMoodboardNudge() {
    const { start: startOfDay } = this._getDayRange(0);
    const premiumUsers = await User.find({
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

    const emptyCutoff = new Date(getStartOfDayInTimeZone().getTime() - MOODBOARD_EMPTY_DAYS * MS_PER_DAY);
    const staleCutoff = new Date(getStartOfDayInTimeZone().getTime() - MOODBOARD_STALE_DAYS * MS_PER_DAY);

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

    return this._sendToSubscribedUsers(entries, 'Moodboard', 'moodboard_nudge', MOODBOARD_STALE_DAYS);
  }

  /**
   * Nag suave a free users que ya chocaron el techo de metas.
   */
  static async checkPremiumNag() {
    const cooldownStart = new Date(
      getStartOfDayInTimeZone().getTime() - PREMIUM_NAG_COOLDOWN_DAYS * MS_PER_DAY
    );
    const recentCancelCutoff = cooldownStart;

    const freeUsers = await User.find({
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
      createdAt: { $gte: getStartOfDayInTimeZone() },
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

    return this._sendToSubscribedUsers(entries, 'Premium nag', 'premium_nag', PREMIUM_NAG_COOLDOWN_DAYS);
  }
}
