import { NotificationService } from '../../services/notificationService.js';

const SERVER_ERROR = { message: 'Error interno del servidor', status: 500, success: false };

/**
 * Controlador para las notificaciones in-app del usuario
 */
export class NotificationController {
  static async getAll(req, res) {
    try {
      const response = await NotificationService.getByUserId(req.userId, req.query);
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en getAll notifications:', error);
      res.status(500).json(SERVER_ERROR);
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const response = await NotificationService.getUnreadCount(req.userId);
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en getUnreadCount:', error);
      res.status(500).json(SERVER_ERROR);
    }
  }

  static async markAsRead(req, res) {
    try {
      const response = await NotificationService.markAsRead(req.userId, req.params.id);
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en markAsRead:', error);
      res.status(500).json(SERVER_ERROR);
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const response = await NotificationService.markAsRead(req.userId);
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en markAllAsRead:', error);
      res.status(500).json(SERVER_ERROR);
    }
  }
}
