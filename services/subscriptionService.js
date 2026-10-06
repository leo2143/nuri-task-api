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

      try {
        await user.save();
      } catch (saveError) {
        console.error(chalk.red('Error al guardar suscripción tras crear preapproval MP, reintento:'), saveError);
        try {
          await user.save();
        } catch (retryError) {
          console.error(
            chalk.red(`No se persistió mercadoPagoId=${mpSubscription.id} para user=${userId}. Compensando cancelación MP.`),
            retryError
          );
          try {
            await MercadoPagoService.cancelSubscription(mpSubscription.id);
          } catch (cancelError) {
            console.error(chalk.red('No se pudo cancelar el preapproval huérfano de MP:'), cancelError);
          }
          return new ErrorResponseModel('No se pudo activar la suscripción. Intentá de nuevo');
        }
      }

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

      try {
        await user.save();
      } catch (saveError) {
        console.error(chalk.red('MP ya canceló; error al persistir, reintento:'), saveError);
        try {
          await user.save();
        } catch (retryError) {
          console.error(
            chalk.red(`Suscripción MP cancelada pero user=${userId} sigue isActive en Mongo.`),
            retryError
          );
          return new ErrorResponseModel('La cancelación en MercadoPago se hizo, pero no pudimos actualizar tu cuenta. Reintentá.');
        }
      }

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
    if (type === 'subscription_preapproval') {
      return this.#handleSubscriptionUpdate(dataId);
    }

    if (type === 'subscription_authorized_payment') {
      console.log(chalk.blue(`Pago de suscripción recibido: ${dataId}`));
      return true;
    }

    console.log(chalk.yellow(`Webhook tipo no manejado: ${type}`));
    return true;
  }

  static #subscriptionAlreadyApplied(user, isActive, mercadoPagoId) {
    return user.subscription?.isActive === isActive && user.subscription?.mercadoPagoId === mercadoPagoId;
  }

  static async #saveUserWithRetry(user) {
    try {
      await user.save();
    } catch (firstError) {
      console.error(chalk.red('Error al persistir usuario tras MP, reintento:'), firstError);
      await user.save();
    }
  }

  static async #handleSubscriptionUpdate(subscriptionId) {
    const mpData = await MercadoPagoService.getSubscription(subscriptionId);
    const isActive = MP_STATUS_MAP[mpData.status] ?? false;

    const user = await User.findOne({ 'subscription.mercadoPagoId': subscriptionId });

    if (!user && mpData.external_reference) {
      const userByRef = await User.findById(mpData.external_reference);
      if (userByRef) {
        if (this.#subscriptionAlreadyApplied(userByRef, isActive, subscriptionId)) {
          return true;
        }
        userByRef.subscription = {
          isActive,
          startDate: isActive ? new Date(mpData.date_created) : userByRef.subscription?.startDate,
          endDate: null,
          mercadoPagoId: subscriptionId,
        };
        await this.#saveUserWithRetry(userByRef);
        console.log(chalk.green(`Suscripción actualizada via external_reference para usuario ${mpData.external_reference}: ${mpData.status}`));
        return true;
      }
    }

    if (!user) {
      console.error(chalk.yellow(`No se encontró usuario para suscripción MP: ${subscriptionId}`));
      return false;
    }

    if (this.#subscriptionAlreadyApplied(user, isActive, subscriptionId)) {
      return true;
    }

    user.subscription = {
      isActive,
      startDate: isActive ? new Date(mpData.date_created) : user.subscription?.startDate,
      endDate: null,
      mercadoPagoId: subscriptionId,
    };
    await this.#saveUserWithRetry(user);

    console.log(chalk.green(`Suscripción actualizada para usuario ${user._id}: ${mpData.status} → isActive: ${isActive}`));
    return true;
  }
}
