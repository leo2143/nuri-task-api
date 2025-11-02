import { SuccessResponseModel, ErrorResponseModel, NotFoundResponseModel } from '../models/responseModel.js';

/**
 * Middleware para manejar rutas no encontradas (404)
 * @function notFoundHandler
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void} No retorna valor, envía respuesta 404
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json(new NotFoundResponseModel('Ruta no encontrada'));
};

/**
 * Middleware para manejar errores generales del servidor (500)
 * @function errorHandler
 * @param {Error} err - Objeto de error capturado
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void} No retorna valor, envía respuesta de error
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json(new ErrorResponseModel('Error interno del servidor'));
};

/**
 * Handler para el endpoint de health check
 * @function healthCheck
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {void} No retorna valor, envía respuesta de salud
 * @description Endpoint que responde si el servidor está funcionando correctamente
 */
export const healthCheck = (req, res) => {
  res.status(200).json(new SuccessResponseModel(null, 0, 'Servidor funcionando correctamente'));
};
