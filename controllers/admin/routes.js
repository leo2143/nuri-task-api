import { DemoNotificationController } from './demoNotificationController.js';
import { validateAdminToken } from '../../middlewares/authMiddleware.js';

/**
 * Rutas admin de demo: disparar jobs de notificación desde Swagger.
 */
export const setupAdminDemoRoutes = app => {
  app.post('/api/admin/demo/seed-clock', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Atrasa fechas de documentos [Demo] para disparar crons'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Usuario dueño de los documentos [Demo]',
         required: true,
         schema: {
           userId: '507f1f77bcf86cd799439011'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.seedClock(req, res);
  });

  app.post('/api/admin/demo/notifications/clean', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Limpia las notificaciones cron del admin para poder reenviarlas'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.clean(req, res);
  });

  app.post('/api/admin/demo/notifications/run-all', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara todos los jobs de notificación, sin limpiar el inbox'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runAll(req, res);
  });

  app.post('/api/admin/demo/notifications/due-tasks', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job due-tasks (tareas de hoy)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('due-tasks', req, res);
  });

  app.post('/api/admin/demo/notifications/due-goals', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job due-goals (metas de hoy)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('due-goals', req, res);
  });

  app.post('/api/admin/demo/notifications/overdue-tasks', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job overdue-tasks (tareas de ayer)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('overdue-tasks', req, res);
  });

  app.post('/api/admin/demo/notifications/overdue-goals', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job overdue-goals (metas de ayer)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('overdue-goals', req, res);
  });

  app.post('/api/admin/demo/notifications/empty-goals', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job empty-goals (metas sin el primer paso)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('empty-goals', req, res);
  });

  app.post('/api/admin/demo/notifications/stalled-goals', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job stalled-goals (metas que no se mueven)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('stalled-goals', req, res);
  });

  app.post('/api/admin/demo/notifications/high-priority', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job high-priority (tareas importantes en camino)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('high-priority', req, res);
  });

  app.post('/api/admin/demo/notifications/high-priority-goals', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job high-priority-goals (metas importantes en camino)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('high-priority-goals', req, res);
  });

  app.post('/api/admin/demo/notifications/pause-too-long', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job pause-too-long (metas en pausa larga)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('pause-too-long', req, res);
  });

  app.post('/api/admin/demo/notifications/inactivity', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job inactivity (sin actividad reciente)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('inactivity', req, res);
  });

  app.post('/api/admin/demo/notifications/overdue-backlog', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job overdue-backlog (fechas de hace 7+ días)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('overdue-backlog', req, res);
  });

  app.post('/api/admin/demo/notifications/moodboard-nudge', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job moodboard-nudge (tablero vacío o quieto)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('moodboard-nudge', req, res);
  });

  app.post('/api/admin/demo/notifications/premium-nag', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job premium-nag (techo de 2 metas del plan free)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('premium-nag', req, res);
  });

  app.post('/api/admin/demo/notifications/day-recap', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job day-recap (resumen del día)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('day-recap', req, res);
  });

  app.post('/api/admin/demo/notifications/streak-risk', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Notifications - Demo']
    // #swagger.summary = 'Dispara el job streak-risk (racha en riesgo)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return DemoNotificationController.runJob('streak-risk', req, res);
  });
};
