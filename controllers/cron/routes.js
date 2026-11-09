import { CronController } from './cronController.js';
import { CronDispatcher } from './dispatcher.js';
import { validateCronSecret } from '../../middlewares/cronAuthMiddleware.js';

/**
 * Configura las rutas de cron jobs.
 * Protegidas por CRON_SECRET (enviado por Vercel automáticamente).
 * @param {Object} app - Instancia de Express
 */
export const setupCronRoutes = app => {
  // Antes de /:jobName: "dispatch" es un nombre reservado
  app.get('/api/cron/dispatch', validateCronSecret, (req, res) => {
    // #swagger.tags = ['Cron Jobs']
    // #swagger.summary = 'Dispatcher horario: corre los jobs que tocan esta hora en cada zona horaria'
    // #swagger.description = 'Lo invoca Vercel Cron 24 veces por día con ?h=0..23 (hora UTC). dryRun=1 solo fuera de producción.'
    return CronDispatcher.dispatch(req, res);
  });

  app.get('/api/cron/:jobName', validateCronSecret, (req, res) => {
    // #swagger.tags = ['Cron Jobs']
    // #swagger.summary = 'Ejecuta un job de cron por nombre (registro), para los usuarios de una zona (?timezone=)'
    return CronController.run(req, res);
  });
};
