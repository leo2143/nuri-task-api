import User from '../models/userModel.js';
import {
  SuccessResponseModel,
  NotFoundResponseModel,
  BadRequestResponseModel,
  ErrorResponseModel,
} from '../models/responseModel.js';
import { MercadoPagoService } from './mercadoPagoService.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import chalk from 'chalk';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3000';

const MP_STATUS_MAP = {
  authorized: true,
  pending: false,
  paused: false,
  cancelled: false,
};

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

      const mpSubscription = await MercadoPagoService.createSubscription({
        payerEmail: user.email,
        externalReference: user._id.toString(),
        backUrl: `${FRONTEND_URL}/subscription/callback`,
        notificationUrl: `${API_URL}/api/webhooks/mercadopago`,
      });

      user.subscription = {
        ...user.subscription,
        mercadoPagoId: mpSubscription.id,
      };
      await user.save();

      return new SuccessResponseModel(
        { init_point: mpSubscription.init_point },
        'Redirigiendo a MercadoPago para completar el pago'
      );
    } catch (error) {
      console.error(chalk.red('Error al crear suscripción en MercadoPago:', error.message));
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

      if (user.subscription.mercadoPagoId) {
        await MercadoPagoService.cancelSubscription(user.subscription.mercadoPagoId);
      }

      user.subscription = {
        isActive: false,
        startDate: null,
        endDate: null,
        mercadoPagoId: null,
      };
      await user.save();

      return new SuccessResponseModel(
        { subscription: user.subscription },
        'Suscripción cancelada correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al cancelar suscripción en MercadoPago:', error.message));
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

  static async processWebhook(type, dataId) {
    try {
      if (type === 'subscription_preapproval') {
        return this.#handleSubscriptionUpdate(dataId);
      }

      if (type === 'subscription_authorized_payment') {
        console.log(chalk.blue(`Pago de suscripción recibido: ${dataId}`));
        return true;
      }

      console.log(chalk.yellow(`Webhook tipo no manejado: ${type}`));
      return true;
    } catch (error) {
      console.error(chalk.red('Error procesando webhook:', error.message));
      return false;
    }
  }

  static async #handleSubscriptionUpdate(subscriptionId) {
    const mpData = await MercadoPagoService.getSubscription(subscriptionId);
    const isActive = MP_STATUS_MAP[mpData.status] ?? false;

    const user = await User.findOne({ 'subscription.mercadoPagoId': subscriptionId });

    if (!user && mpData.external_reference) {
      const userByRef = await User.findById(mpData.external_reference);
      if (userByRef) {
        userByRef.subscription = {
          isActive,
          startDate: isActive ? new Date(mpData.date_created) : userByRef.subscription?.startDate,
          endDate: null,
          mercadoPagoId: subscriptionId,
        };
        await userByRef.save();
        console.log(chalk.green(`Suscripción actualizada via external_reference para usuario ${mpData.external_reference}: ${mpData.status}`));
        return true;
      }
    }

    if (!user) {
      console.error(chalk.yellow(`No se encontró usuario para suscripción MP: ${subscriptionId}`));
      return false;
    }

    user.subscription = {
      isActive,
      startDate: isActive ? new Date(mpData.date_created) : user.subscription?.startDate,
      endDate: null,
      mercadoPagoId: subscriptionId,
    };
    await user.save();

    console.log(chalk.green(`Suscripción actualizada para usuario ${user._id}: ${mpData.status} → isActive: ${isActive}`));
    return true;
  }
}
