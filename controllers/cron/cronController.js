import { ScheduledNotificationService } from '../../services/scheduledNotificationService.js';
import { SuccessResponseModel } from '../../models/responseModel.js';
import chalk from 'chalk';

/**
 * Controlador para los endpoints cron invocados por Vercel Cron Jobs.
 * Cada método agrupa uno o más checks de notificaciones programadas.
 */
export class CronController {
  /**
   * Job nocturno: reset de rachas + tareas por vencer + usuarios inactivos
   * Ejecutado por Vercel Cron a las 00:00 (Argentina)
   */
  static async morningJob(_req, res) {
    try {
      console.log(chalk.cyan('[Cron] Ejecutando morning job...'));

      await ScheduledNotificationService.resetExpiredStreaks();

      const [dueResult, inactiveResult] = await Promise.all([
        ScheduledNotificationService.checkDueTasks(),
        ScheduledNotificationService.checkInactiveUsers(),
      ]);

      const response = new SuccessResponseModel(
        {
          dueTasks: dueResult,
          inactiveUsers: inactiveResult,
        },
        'Morning job ejecutado correctamente'
      );

      res.status(response.status).json(response);
    } catch (error) {
      console.error(chalk.red('[Cron] Error en morning job:'), error);
      res.status(500).json({ message: 'Error ejecutando morning job', status: 500, success: false });
    }
  }

  /**
   * Job de la noche: rachas en riesgo
   * Ejecutado por Vercel Cron a las 8 PM (Argentina)
   */
  static async eveningJob(_req, res) {
    try {
      console.log(chalk.cyan('[Cron] Ejecutando evening job...'));

      const streakResult = await ScheduledNotificationService.checkStreaksAtRisk();

      const response = new SuccessResponseModel(
        { streaksAtRisk: streakResult },
        'Evening job ejecutado correctamente'
      );

      res.status(response.status).json(response);
    } catch (error) {
      console.error(chalk.red('[Cron] Error en evening job:'), error);
      res.status(500).json({ message: 'Error ejecutando evening job', status: 500, success: false });
    }
  }
}
