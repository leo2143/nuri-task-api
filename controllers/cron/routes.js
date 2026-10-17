import { CronController } from './cronController.js';
import { validateCronSecret } from '../../middlewares/cronAuthMiddleware.js';

/**
 * Configura las rutas de cron jobs.
 * Protegidas por CRON_SECRET (enviado por Vercel automáticamente).
 * @param {Object} app - Instancia de Express
 */
export const setupCronRoutes = app => {
  app.get('/api/cron/:jobName', validateCronSecret, (req, res) => {
    // #swagger.tags = ['Cron Jobs']
    // #swagger.summary = 'Ejecuta un job de cron por nombre (allowlist)'
    return CronController.run(req, res);
  });
};
