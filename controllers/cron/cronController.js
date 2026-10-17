import { CRON_JOBS } from './cronJobs.js';
import {
  SuccessResponseModel,
  NotFoundResponseModel,
  ErrorResponseModel,
} from '../../models/responseModel.js';
import chalk from 'chalk';

/**
 * Un job diario por responsabilidad. vercel.json define el schedule.
 */
export class CronController {
  /**
   * Ejecuta el cron allowlisted en :jobName.
   */
  static async run(req, res) {
    const { jobName } = req.params;
    const job = CRON_JOBS[jobName];

    if (!job) {
      const response = new NotFoundResponseModel(`Cron job desconocido: ${jobName}`);
      return res.status(response.status).json(response);
    }

    try {
      console.log(chalk.cyan(`[Cron] Ejecutando ${jobName}...`));
      const data = await job();
      const response = new SuccessResponseModel(data, `Cron ${jobName} ejecutado correctamente`);
      return res.status(response.status).json(response);
    } catch (error) {
      console.error(chalk.red(`[Cron] Error en ${jobName}:`), error);
      const response = new ErrorResponseModel(`Error ejecutando cron ${jobName}`, 500);
      return res.status(response.status).json(response);
    }
  }
}
