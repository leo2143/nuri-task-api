import Todo from '../models/todoModel.js';
import Metrics from '../models/metricsModel.js';
import PushSubscription from '../models/pushSubscriptionModel.js';
import { PushNotificationService } from './pushNotificationService.js';
import { NotificationService } from './notificationService.js';
import chalk from 'chalk';

/**
 * Servicio que contiene la lógica de las notificaciones programadas.
 * Estos métodos son invocados por los endpoints cron de Vercel.
 */
export class ScheduledNotificationService {
  /**
   * Persiste notificaciones in-app para todos los usuarios y envía push
   * solo a aquellos con suscripción activa.
   * @param {Array<{userId: string, payload: Object}>} entries
   * @param {string} label - Etiqueta para el log
   * @param {string} type - Tipo de notificación (due_task, streak_risk, inactivity)
   * @returns {Promise<{notified: number, persisted: number}>}
   */
  static async _sendToSubscribedUsers(entries, label, type) {
    await NotificationService.createMany(
      entries.map(({ userId, payload }) => ({
        userId,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        type,
      }))
    );

    let notified = 0;

    for (const { userId, payload } of entries) {
      const hasSub = await PushSubscription.exists({ userId });
      if (!hasSub) continue;

      await PushNotificationService.sendNotification(userId, payload);
      notified++;
    }

    console.log(chalk.green(`[Cron] ${label}: ${entries.length} persistidas, ${notified} push enviados`));
    return { notified, persisted: entries.length };
  }

  /**
   * Notifica a usuarios que tienen tareas con dueDate = hoy y no completadas.
   * Agrupa por userId para enviar una sola notificación por usuario.
   */
  static async checkDueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTasks = await Todo.find({
      dueDate: { $gte: today, $lt: tomorrow },
      completed: false,
    }).lean();

    if (dueTasks.length === 0) {
      console.log(chalk.blue('[Cron] No hay tareas por vencer hoy'));
      return { notified: 0 };
    }

    const tasksByUser = new Map();
    for (const task of dueTasks) {
      const uid = task.userId.toString();
      if (!tasksByUser.has(uid)) tasksByUser.set(uid, []);
      tasksByUser.get(uid).push(task);
    }

    const entries = Array.from(tasksByUser, ([userId, tasks]) => ({
      userId,
      payload:
        tasks.length === 1
          ? {
              title: 'Tu tarea te espera',
              body: `'${tasks[0].title}' vence hoy. ¡Dale, que estás cerca!`,
              url: '/tasks',
            }
          : {
              title: 'Tenés tareas por vencer',
              body: `Hay ${tasks.length} tareas que vencen hoy. Paso a paso, ¡vos podés con todo!`,
              url: '/tasks',
            },
    }));

    return this._sendToSubscribedUsers(entries, 'Tareas por vencer', 'due_task');
  }

  /**
   * Notifica a usuarios con racha activa (currentStreak > 0) que no completaron
   * ninguna tarea hoy. Se ejecuta por la noche para darles tiempo.
   */
  static async checkStreaksAtRisk() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metricsAtRisk = await Metrics.find({
      currentStreak: { $gt: 0 },
      lastActivityDate: { $lt: today },
    }).lean();

    if (metricsAtRisk.length === 0) {
      console.log(chalk.blue('[Cron] No hay rachas en riesgo'));
      return { notified: 0 };
    }

    const entries = metricsAtRisk.map(metric => ({
      userId: metric.userId.toString(),
      payload: {
        title: `¡Llevás ${metric.currentStreak} días seguidos!`,
        body: 'No pares ahora, completá una tarea hoy y seguí sumando. ¡Vos podés!',
        url: '/tasks',
      },
    }));

    return this._sendToSubscribedUsers(entries, 'Rachas en riesgo', 'streak_risk');
  }

  /**
   * Notifica a usuarios inactivos (sin actividad en los últimos 2 días)
   * que tienen suscripción push activa.
   */
  static async checkInactiveUsers() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(0, 0, 0, 0);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const inactiveMetrics = await Metrics.find({
      $or: [
        { lastActivityDate: { $lte: twoDaysAgo } },
        { lastActivityDate: null },
      ],
    }).lean();

    if (inactiveMetrics.length === 0) {
      console.log(chalk.blue('[Cron] No hay usuarios inactivos'));
      return { notified: 0 };
    }

    const entries = inactiveMetrics.map(metric => ({
      userId: metric.userId.toString(),
      payload: {
        title: '¡Cada día cuenta!',
        body: 'Hace un tiempito que no te vemos. Volvé a Nuri Task y seguí avanzando, tus metas te esperan.',
        url: '/',
      },
    }));

    return this._sendToSubscribedUsers(entries, 'Usuarios inactivos', 'inactivity');
  }
}
