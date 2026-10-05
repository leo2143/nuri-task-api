import { waitUntil } from '@vercel/functions';
import chalk from 'chalk';
import { NotificationService } from '../notificationService.js';
import { PushNotificationService } from '../pushNotificationService.js';

const PUSH_TIMEOUT_MS = 1000;

/**
 * Persiste la notificación in-app y encola el push (waitUntil en Vercel).
 * @param {{ userId: string, title: string, body: string, url?: string, type: string, icon?: string }} entry
 */
export async function persistAndNotify(entry) {
  const { userId, title, body, url, type, icon } = entry;

  await NotificationService.createMany([{ userId, title, body, url, type }]);

  const pushPromise = PushNotificationService.sendNotification(userId, {
    title,
    body,
    url,
    icon,
  }).catch((err) => {
    console.error(chalk.yellow('Error enviando push:', err));
  });

  if (process.env.VERCEL === '1') {
    waitUntil(pushPromise);
    return;
  }

  await Promise.race([
    pushPromise,
    new Promise((resolve) => {
      setTimeout(resolve, PUSH_TIMEOUT_MS);
    }),
  ]);
}
