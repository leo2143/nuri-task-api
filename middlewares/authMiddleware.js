import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UnauthorizedResponseModel, ForbiddenResponseModel } from '../models/responseModel.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

/**
 * Middleware para validar tokens JWT en rutas protegidas
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.headers - Headers de la petición
 * @param {string} req.headers.authorization - Token JWT en formato "Bearer <token>"
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void} No retorna valor, continúa o envía respuesta de error
 * Valida el token JWT del header Authorization y agrega la información del usuario al request
 */
export const validateToken = (req, res, next) => {
  const token = req.headers.authorization;
  try {
    const decoded = verifyJwt(req, token);
    if (!decoded) {
      const response = new UnauthorizedResponseModel('No se proporcionó token de autenticación');
      return res.status(response.status).json(response);
    }
    next();
  } catch (error) {
    const response = new UnauthorizedResponseModel('Token inválido o expirado');
    return res.status(response.status).json(response);
  }
};

/**
 * Middleware para validar tokens JWT y permisos de administrador
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.headers - Headers de la petición
 * @param {string} req.headers.authorization - Token JWT en formato "Bearer <token>"
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void} No retorna valor, continúa o envía respuesta de error
 * Valida el token JWT y verifica que el usuario tenga permisos de administrador
 */
export const validateAdminToken = (req, res, next) => {
  const token = req.headers.authorization;
  try {
    const decoded = verifyJwt(req, token);
    if (!decoded) {
      const response = new UnauthorizedResponseModel('No se proporcionó token de autenticación');
      return res.status(response.status).json(response);
    }
    if (!decoded.isAdmin) {
      const response = new ForbiddenResponseModel('Acceso denegado. Se requieren permisos de administrador');
      return res.status(response.status).json(response);
    }
    next();
  } catch (error) {
    const response = new UnauthorizedResponseModel('Token inválido o expirado');
    return res.status(response.status).json(response);
  }
};

const verifyJwt = (req, token) => {
  if (!token) {
    return null;
  }
  const tokenLimpio = token.split(' ')[1];
  const decoded = jwt.verify(tokenLimpio, JWT_SECRET);
  req.userId = decoded.userId;
  req.user = decoded;
  return decoded;
};
