import webpush from 'web-push';
import PushSubscription from '../models/pushSubscriptionModel.js';
import chalk from 'chalk';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@nuritask.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn(chalk.yellow('VAPID keys no configuradas. Las notificaciones push no funcionarán.'));
}

export class PushNotificationService {
  /**
   * Guarda una suscripción push para un usuario
   */
  static async saveSubscription(userId, subscription) {
    try {
      const existing = await PushSubscription.findOne({
        userId,
        endpoint: subscription.endpoint,
      });

      if (existing) {
        existing.keys = subscription.keys;
        await existing.save();
        return existing;
      }

      const newSub = new PushSubscription({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });

      return await newSub.save();
    } catch (error) {
      console.error(chalk.red('Error guardando suscripción push:'), error);
      throw error;
    }
  }

  /**
   * Elimina una suscripción push por endpoint
   */
  static async removeSubscription(userId, endpoint) {
    try {
      const result = await PushSubscription.findOneAndDelete({ userId, endpoint });
      return result;
    } catch (error) {
      console.error(chalk.red('Error eliminando suscripción push:'), error);
      throw error;
    }
  }

  /**
   * Envía una notificación push a todas las suscripciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} payload - { title, body, icon?, url? }
   */
  static async sendNotification(userId, payload) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

    try {
      const subscriptions = await PushSubscription.find({ userId });

      if (subscriptions.length === 0) return;

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon/android-chrome-192x192.png',
        url: payload.url || '/',
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            notificationPayload
          )
        )
      );

      // Limpiar suscripciones inválidas (410 Gone o 404)
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'rejected') {
          const statusCode = results[i].reason?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await PushSubscription.findByIdAndDelete(subscriptions[i]._id);
            console.log(chalk.yellow(`Suscripción expirada eliminada para usuario ${userId}`));
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('Error enviando notificación push:'), error);
    }
  }

  /**
   * Envía una notificación a todos los usuarios suscritos (broadcast)
   */
  static async sendNotificationToAll(payload) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

    try {
      const subscriptions = await PushSubscription.find({});

      if (subscriptions.length === 0) return;

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon/android-chrome-192x192.png',
        url: payload.url || '/',
      });

      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            notificationPayload
          )
        )
      );

      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'rejected') {
          const statusCode = results[i].reason?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await PushSubscription.findByIdAndDelete(subscriptions[i]._id);
          }
        }
      }

      console.log(chalk.green(`Broadcast enviado a ${subscriptions.length} suscripciones`));
    } catch (error) {
      console.error(chalk.red('Error en broadcast push:'), error);
    }
  }

  /**
   * Devuelve la clave pública VAPID
   */
  static getVapidPublicKey() {
    return VAPID_PUBLIC_KEY || null;
  }
}
