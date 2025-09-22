import { SuccessResponseModel, ErrorResponseModel, NotFoundResponseModel } from '../models/responseModel.js';

/**
 * Middleware para manejar rutas no encontradas (404)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json(new NotFoundResponseModel('Ruta no encontrada'));
};

/**
 * Middleware para manejar errores generales del servidor (500)
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json(new ErrorResponseModel('Error interno del servidor'));
};

/**
 * Middleware para validar que el servidor esté funcionando
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const healthCheck = (req, res, next) => {
  if (req.path === '/health') return res.status(200).json(new SuccessResponseModel(null, 0, 'Servidor funcionando correctamente'));
  next();
};
