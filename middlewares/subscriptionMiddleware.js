import User from '../models/userModel.js';
import { ForbiddenResponseModel } from '../models/responseModel.js';

const isSubscriptionActive = subscription => {
  return subscription && subscription.isActive === true;
};

const isSubscriptionExpired = endDate => {
  if (!endDate) return false;
  return new Date() > new Date(endDate);
};

/**
 * Middleware que verifica suscripcion activa consultando la DB.
 * Permite acceso si el usuario es admin o tiene suscripcion vigente.
 */
export const validateSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('subscription isAdmin').lean();

    if (!user) {
      const response = new ForbiddenResponseModel('Usuario no encontrado');
      return res.status(response.status).json(response);
    }

    if (user.isAdmin) {
      return next();
    }

    if (!isSubscriptionActive(user.subscription)) {
      const response = new ForbiddenResponseModel(
        'Acceso denegado. Se requiere suscripción activa para esta funcionalidad'
      );
      return res.status(response.status).json(response);
    }

    if (isSubscriptionExpired(user.subscription.endDate)) {
      const response = new ForbiddenResponseModel(
        'Tu suscripción ha expirado. Renová tu plan para continuar'
      );
      return res.status(response.status).json(response);
    }

    next();
  } catch (error) {
    const response = new ForbiddenResponseModel('Error al verificar permisos');
    return res.status(response.status).json(response);
  }
};
