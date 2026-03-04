import { CronController } from './cronController.js';
import { validateCronSecret } from '../../middlewares/cronAuthMiddleware.js';

/**
 * Configura las rutas de cron jobs.
 * Protegidas por CRON_SECRET (enviado por Vercel automáticamente).
 * @param {Object} app - Instancia de Express
 */
export const setupCronRoutes = app => {
  app.get('/api/cron/morning', validateCronSecret, (req, res) => {
    // #swagger.tags = ['Cron Jobs']
    // #swagger.summary = 'Job mañana: tareas por vencer + usuarios inactivos'
    return CronController.morningJob(req, res);
  });

  app.get('/api/cron/evening', validateCronSecret, (req, res) => {
    // #swagger.tags = ['Cron Jobs']
    // #swagger.summary = 'Job noche: rachas en riesgo'
    return CronController.eveningJob(req, res);
  });
};
