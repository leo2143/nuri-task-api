import { NotificationController } from './notificationController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Configura las rutas de notificaciones in-app
 * @param {Object} app - Instancia de Express
 */
export const setupNotificationRoutes = app => {
  app.get('/api/notifications/unread-count', validateToken, (req, res) => {
    // #swagger.tags = ['Notifications']
    // #swagger.summary = 'Obtiene el conteo de notificaciones no leídas'
    return NotificationController.getUnreadCount(req, res);
  });

  app.get('/api/notifications', validateToken, (req, res) => {
    // #swagger.tags = ['Notifications']
    // #swagger.summary = 'Lista las notificaciones del usuario (paginadas)'
    return NotificationController.getAll(req, res);
  });

  app.patch('/api/notifications/read-all', validateToken, (req, res) => {
    // #swagger.tags = ['Notifications']
    // #swagger.summary = 'Marca todas las notificaciones como leídas'
    return NotificationController.markAllAsRead(req, res);
  });

  app.patch('/api/notifications/:id/read', validateToken, (req, res) => {
    // #swagger.tags = ['Notifications']
    // #swagger.summary = 'Marca una notificación como leída'
    return NotificationController.markAsRead(req, res);
  });
};
