import { PushNotificationService } from '../../services/pushNotificationService.js';
import { SuccessResponseModel, CreatedResponseModel, BadRequestResponseModel } from '../../models/responseModel.js';

/**
 * Controlador para manejar las peticiones HTTP de notificaciones push
 */
export class PushController {
  /**
   * Registra una suscripción push para el usuario autenticado
   */
  static async subscribe(req, res) {
    try {
      const userId = req.userId;
      const { endpoint, keys } = req.body;

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        const response = new BadRequestResponseModel('Suscripción inválida: faltan endpoint o keys (p256dh, auth)');
        return res.status(response.status).json(response);
      }

      const subscription = await PushNotificationService.saveSubscription(userId, { endpoint, keys });
      const response = new CreatedResponseModel(subscription, 'Suscripción push registrada correctamente');
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en subscribe:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina una suscripción push del usuario autenticado
   */
  static async unsubscribe(req, res) {
    try {
      const userId = req.userId;
      const { endpoint } = req.body;

      if (!endpoint) {
        const response = new BadRequestResponseModel('Se requiere el endpoint de la suscripción');
        return res.status(response.status).json(response);
      }

      await PushNotificationService.removeSubscription(userId, endpoint);
      const response = new SuccessResponseModel(null, 'Suscripción push eliminada correctamente');
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en unsubscribe:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Devuelve la clave pública VAPID
   */
  static async getVapidKey(_req, res) {
    try {
      const vapidKey = PushNotificationService.getVapidPublicKey();

      if (!vapidKey) {
        const response = new BadRequestResponseModel('VAPID keys no configuradas en el servidor');
        return res.status(response.status).json(response);
      }

      const response = new SuccessResponseModel({ publicKey: vapidKey }, 'Clave VAPID obtenida correctamente');
      res.status(response.status).json(response);
    } catch (error) {
      console.error('Error en getVapidKey:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
