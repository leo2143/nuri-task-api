import { PushNotificationService } from '../../services/pushNotificationService.js';
import { SuccessResponseModel, CreatedResponseModel, BadRequestResponseModel } from '../../models/responseModel.js';
import { SubscribePushDto, PushEndpointDto } from '../../models/dtos/push/index.js';

/**
 * Controlador para manejar las peticiones HTTP de notificaciones push
 */
export class PushController {
  /**
   * Registra una suscripción push para el usuario autenticado
   */
  static async subscribe(req, res) {
    try {
      const subscribeDto = new SubscribePushDto(req.body || {});
      const validation = subscribeDto.validate();
      if (!validation.isValid) {
        const response = new BadRequestResponseModel(validation.errors.join(', '));
        return res.status(response.status).json(response);
      }

      const subscription = await PushNotificationService.saveSubscription(
        req.userId,
        subscribeDto.toPlainObject()
      );
      const response = new CreatedResponseModel(
        { endpoint: subscription.endpoint },
        'Suscripción push registrada correctamente'
      );
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
      const endpointDto = new PushEndpointDto(req.body || {});
      const validation = endpointDto.validate();
      if (!validation.isValid) {
        const response = new BadRequestResponseModel(validation.errors.join(', '));
        return res.status(response.status).json(response);
      }

      await PushNotificationService.removeSubscription(req.userId, endpointDto.toPlainObject().endpoint);
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
