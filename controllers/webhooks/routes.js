import { WebhookController } from './webhookController.js';

export const setupWebhookRoutes = app => {
  app.post('/api/webhooks/mercadopago', (req, res) => {
    // #swagger.tags = ['Webhooks']
    // #swagger.summary = 'Webhook de MercadoPago para notificaciones de suscripción'
    return WebhookController.mercadoPago(req, res);
  });
};
