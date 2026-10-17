import { CRON_JOBS, DEMO_CRON_TYPES, DEMO_NOTIFY_JOBS } from '../cron/cronJobs.js';
import { NotificationService } from '../../services/notificationService.js';
import { DemoSeedService } from '../../services/demoSeedService.js';
import {
  SuccessResponseModel,
  NotFoundResponseModel,
  ErrorResponseModel,
} from '../../models/responseModel.js';
import chalk from 'chalk';

/**
 * Disparo on-demand de jobs de notificación para demos (Swagger).
 */
export class DemoNotificationController {
  /**
   * Borra del inbox del admin los tipos cron que bloquean el próximo fire.
   */
  static async clean(req, res) {
    const result = await NotificationService.deleteCronTypesForUser(req.userId, DEMO_CRON_TYPES);
    return res.status(result.status).json(result);
  }

  /**
   * Ejecuta un job de notificación allowlisted.
   */
  static async runJob(jobName, req, res) {
    if (!DEMO_NOTIFY_JOBS.includes(jobName) || !CRON_JOBS[jobName]) {
      const response = new NotFoundResponseModel(`Job de demo desconocido: ${jobName}`);
      return res.status(response.status).json(response);
    }

    try {
      console.log(chalk.cyan(`[Demo] Ejecutando ${jobName}...`));
      const data = await CRON_JOBS[jobName]();
      const response = new SuccessResponseModel(data, `Job ${jobName} ejecutado correctamente`);
      return res.status(response.status).json(response);
    } catch (error) {
      console.error(chalk.red(`[Demo] Error en ${jobName}:`), error);
      const response = new ErrorResponseModel(`Error ejecutando job ${jobName}`, 500);
      return res.status(response.status).json(response);
    }
  }

  /**
   * Ejecuta los 15 jobs de notif en orden de producción, sin clean.
   */
  static async runAll(req, res) {
    try {
      console.log(chalk.cyan('[Demo] Ejecutando todos los jobs de notificación...'));
      const results = {};

      for (const jobName of DEMO_NOTIFY_JOBS) {
        results[jobName] = await CRON_JOBS[jobName]();
      }

      const response = new SuccessResponseModel(results, 'Jobs de notificación ejecutados');
      return res.status(response.status).json(response);
    } catch (error) {
      console.error(chalk.red('[Demo] Error en run-all:'), error);
      const response = new ErrorResponseModel('Error ejecutando todos los jobs', 500);
      return res.status(response.status).json(response);
    }
  }

  /**
   * Atrasa fechas de documentos [Demo] del usuario indicado.
   */
  static async seedClock(req, res) {
    const result = await DemoSeedService.applyClock(req.body);
    return res.status(result.status).json(result);
  }
}
