import { ForbiddenResponseModel } from '../models/responseModel.js';

/**
 * Verifica si el usuario tiene una suscripción activa
 * @param {Object} subscription - Objeto de suscripción del usuario
 * @returns {boolean}
 */
const isSubscriptionActive = subscription => {
  return subscription && subscription.isActive === true;
};

/**
 * Verifica si la suscripción ha expirado
 * @param {Date} endDate - Fecha de expiración de la suscripción
 * @returns {boolean}
 */
const isSubscriptionExpired = endDate => {
  if (!endDate) return false;

  const now = new Date();
  const expiration = new Date(endDate);

  return now > expiration;
};
/**
 * Middleware para validar que el usuario sea administrador O tenga suscripción activa
 * Permite acceso si cumple cualquiera de las dos condiciones
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.user - Usuario decodificado del JWT
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void}
 */
export const validateSubscription = (req, res, next) => {
  try {
    const { user } = req;

    if (user.isAdmin) {
      return next();
    }

    if (!isSubscriptionActive(user.subscription)) {
      const response = new ForbiddenResponseModel(
        'Acceso denegado. Se requiere suscripción o permisos de administrador'
      );
      return res.status(response.status).json(response);
    }

    if (isSubscriptionExpired(user.subscription.endDate)) {
      const response = new ForbiddenResponseModel(
        'Tu suscripción ha expirado. Renueva tu plan o contacta al administrador'
      );
      return res.status(response.status).json(response);
    }

    next();
  } catch (error) {
    const response = new ForbiddenResponseModel('Error al verificar permisos');
    return res.status(response.status).json(response);
  }
};
