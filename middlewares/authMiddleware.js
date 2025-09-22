import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ErrorResponseModel } from '../models/responseModel.js';

dotenv.config();

// Clave secreta para firmar los tokens (en producción debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

/**
 * Middleware para validar tokens JWT
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @param {Function} next - Next middleware function
 */
export const validarToken = (req, res, next) => {
  // El token viaja en el header Authorization
  const token = req.headers.authorization;
  
  // Chequeo si se pasó el token
  if (!token) {
    return res.status(401).json(new ErrorResponseModel('No se pasó el token'));
  }

  try {
    // Extraer el token del formato "Bearer <token>"
    const tokenLimpio = token.split(' ')[1];
    
    // Verificar el token
    const decoded = jwt.verify(tokenLimpio, JWT_SECRET);
    
    // Agregar la información del usuario al request
    req.userId = decoded.userId;
    req.user = decoded; // Opcional: agregar toda la información del usuario
    
    // Continuar al siguiente middleware
    next();
  } catch (error) {
    return res.status(403).json(new ErrorResponseModel('Token inválido'));
  }
};

/**
 * Middleware opcional para rutas que pueden ser públicas o privadas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validarTokenOpcional = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    // Si no hay token, continuar sin autenticación
    req.userId = null;
    req.user = null;
    return next();
  }

  try {
    const tokenLimpio = token.split(' ')[1];
    const decoded = jwt.verify(tokenLimpio, JWT_SECRET);
    
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    // Si el token es inválido, continuar sin autenticación
    req.userId = null;
    req.user = null;
    next();
  }
};
