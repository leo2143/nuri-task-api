import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UnauthorizedResponseModel, ForbiddenResponseModel } from '../models/responseModel.js';
import { UserServiceHelpers } from '../services/helpers/userServiceHelpers.js';
import { getRequestUser } from './requestUser.js';
import { readAuthToken } from './authCookie.js';

dotenv.config();

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
  const token = readAuthToken(req);
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
export const validateAdminToken = async (req, res, next) => {
  const token = readAuthToken(req);
  try {
    const decoded = verifyJwt(req, token);
    if (!decoded) {
      const response = new UnauthorizedResponseModel('No se proporcionó token de autenticación');
      return res.status(response.status).json(response);
    }

    const user = await getRequestUser(req);
    if (!user?.isAdmin) {
      const response = new ForbiddenResponseModel('Acceso denegado. Se requieren permisos de administrador');
      return res.status(response.status).json(response);
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const response = new UnauthorizedResponseModel('Token inválido o expirado');
      return res.status(response.status).json(response);
    }
    const response = new ForbiddenResponseModel('Error al verificar permisos');
    return res.status(response.status).json(response);
  }
};

const verifyJwt = (req, token) => {
  if (!token) {
    return null;
  }
  const decoded = jwt.verify(token, UserServiceHelpers.getJwtSecret());
  req.userId = decoded.userId;
  req.user = decoded;
  return decoded;
};
