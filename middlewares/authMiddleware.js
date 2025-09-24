import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ErrorResponseModel } from '../models/responseModel.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

/**
 * Middleware para validar tokens JWT en rutas protegidas
 * @function validarToken
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.headers - Headers de la petición
 * @param {string} req.headers.authorization - Token JWT en formato "Bearer <token>"
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void} No retorna valor, continúa o envía respuesta de error
 * @description Valida el token JWT del header Authorization y agrega la información del usuario al request
 * @example
 */
export const validarToken = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json(new ErrorResponseModel('No se pasó el token'));
  }

  try {
    const tokenLimpio = token.split(' ')[1];
    
    const decoded = jwt.verify(tokenLimpio, JWT_SECRET);
    
    req.userId = decoded.userId;
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json(new ErrorResponseModel('Token inválido'));
  }
};

/**
 * Middleware opcional para rutas que pueden ser públicas o privadas
 * @function validarTokenOpcional
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.headers - Headers de la petición
 * @param {string} [req.headers.authorization] - Token JWT opcional en formato "Bearer <token>"
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {void} No retorna valor, siempre continúa al siguiente middleware
 * @description Valida el token JWT si está presente, pero no falla si no hay token
 * @example
 */
export const validarTokenOpcional = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
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
    req.userId = null;
    req.user = null;
    next();
  }
};
