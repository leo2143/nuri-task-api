import User from '../models/userModel.js';
import {
  SuccessResponseModel,
  NotFoundResponseModel,
  BadRequestResponseModel,
} from '../models/responseModel.js';
import { ErrorHandler } from './helpers/errorHandler.js';

const SUBSCRIPTION_DURATION_DAYS = 30;

export class SubscriptionService {
  static async activateSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel('Usuario no encontrado');
      }

      if (user.subscription?.isActive) {
        return new BadRequestResponseModel('Ya tenés una suscripción activa');
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + SUBSCRIPTION_DURATION_DAYS);

      user.subscription = { isActive: true, startDate: now, endDate };
      await user.save();

      return new SuccessResponseModel(
        { subscription: user.subscription },
        'Suscripción activada correctamente'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'activar suscripción');
    }
  }

  static async deactivateSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel('Usuario no encontrado');
      }

      if (!user.subscription?.isActive) {
        return new BadRequestResponseModel('No tenés una suscripción activa');
      }

      user.subscription = { isActive: false, startDate: null, endDate: null };
      await user.save();

      return new SuccessResponseModel(
        { subscription: user.subscription },
        'Suscripción cancelada correctamente'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'cancelar suscripción');
    }
  }

  static async getSubscriptionStatus(userId) {
    try {
      const user = await User.findById(userId).select('subscription').lean();
      if (!user) {
        return new NotFoundResponseModel('Usuario no encontrado');
      }

      return new SuccessResponseModel(
        { subscription: user.subscription },
        'Estado de suscripción obtenido correctamente'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener estado de suscripción');
    }
  }
}
