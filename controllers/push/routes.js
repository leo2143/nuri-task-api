import { PushController } from './pushController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Configura las rutas de notificaciones push
 * @param {Object} app - Instancia de Express
 */
export const setupPushRoutes = app => {
  app.post('/api/push/subscribe', validateToken, (req, res) => {
    // #swagger.tags = ['Push Notifications']
    // #swagger.summary = 'Registra una suscripción push'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la suscripción push',
         required: true,
         schema: {
           endpoint: 'https://fcm.googleapis.com/fcm/send/...',
           keys: {
             p256dh: '...',
             auth: '...'
           }
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return PushController.subscribe(req, res);
  });

  app.delete('/api/push/unsubscribe', validateToken, (req, res) => {
    // #swagger.tags = ['Push Notifications']
    // #swagger.summary = 'Elimina una suscripción push'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Endpoint de la suscripción a eliminar',
         required: true,
         schema: {
           endpoint: 'https://fcm.googleapis.com/fcm/send/...'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return PushController.unsubscribe(req, res);
  });

  app.get('/api/push/vapid-key', (req, res) => {
    // #swagger.tags = ['Push Notifications']
    // #swagger.summary = 'Obtiene la clave pública VAPID'
    return PushController.getVapidKey(req, res);
  });
};
