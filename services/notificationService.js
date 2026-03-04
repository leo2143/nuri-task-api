import Notification from '../models/notificationModel.js';
import { SuccessResponseModel, NotFoundResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { NotificationFilterDto } from '../models/dtos/notifications/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';

export class NotificationService {
  /**
   * Crea múltiples notificaciones en bulk.
   * @param {Array<{userId: string, title: string, body: string, url?: string, type: string}>} entries
   */
  static async createMany(entries) {
    if (entries.length === 0) return;
    await Notification.insertMany(entries);
  }

  /**
   * Obtiene las notificaciones de un usuario con filtros y paginación por cursor.
   */
  static async getByUserId(userId, filters = {}) {
    try {
      const filterDto = new NotificationFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const query = { userId, ...filterDto.toMongoQuery() };

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(filterDto.limit + 1)
        .lean();

      const { results, meta } = filterDto.processPaginationResults(notifications);

      if (results.length === 0) {
        return new NotFoundResponseModel('No se encontraron notificaciones');
      }

      return new SuccessResponseModel(results, 'Notificaciones obtenidas correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener notificaciones');
    }
  }

  /**
   * Devuelve la cantidad de notificaciones no leídas del usuario.
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ userId, read: false });
      return new SuccessResponseModel({ count }, 'Conteo obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'contar notificaciones');
    }
  }

  /**
   * Marca una o todas las notificaciones como leídas.
   * @param {string} userId - ID del usuario
   * @param {string|null} notificationId - ID de la notificación (null = marcar todas)
   */
  static async markAsRead(userId, notificationId = null) {
    try {
      if (notificationId) {
        const notification = await Notification.findOneAndUpdate(
          { _id: notificationId, userId },
          { read: true },
          { new: true }
        );

        if (!notification) {
          return new NotFoundResponseModel('Notificación no encontrada');
        }

        return new SuccessResponseModel(notification, 'Notificación marcada como leída');
      }

      const result = await Notification.updateMany(
        { userId, read: false },
        { read: true }
      );

      return new SuccessResponseModel(
        { modified: result.modifiedCount },
        'Todas las notificaciones marcadas como leídas'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'marcar notificación como leída');
    }
  }
}
