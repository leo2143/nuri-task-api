import { SubscriptionController } from './subscriptionController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

export const setupSubscriptionRoutes = app => {
  app.post('/api/subscription/activate', validateToken, (req, res) => {
    // #swagger.tags = ['Subscription']
    // #swagger.summary = 'Activa la suscripción premium (mock)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return SubscriptionController.activate(req, res);
  });

  app.post('/api/subscription/cancel', validateToken, (req, res) => {
    // #swagger.tags = ['Subscription']
    // #swagger.summary = 'Cancela la suscripción premium'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return SubscriptionController.cancel(req, res);
  });

  app.get('/api/subscription/status', validateToken, (req, res) => {
    // #swagger.tags = ['Subscription']
    // #swagger.summary = 'Obtiene el estado actual de la suscripción'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return SubscriptionController.getStatus(req, res);
  });
};
