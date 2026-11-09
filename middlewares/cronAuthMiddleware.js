import { timingSafeEqual } from 'node:crypto';
import { UnauthorizedResponseModel } from '../models/responseModel.js';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Compara el header contra `Bearer <CRON_SECRET>` en tiempo constante. timingSafeEqual exige buffers del mismo
 * largo: un largo distinto ya es un rechazo (revela el largo del secreto, no su contenido).
 * @param {string|undefined} authHeader
 * @returns {boolean}
 */
const isValidBearer = authHeader => {
  if (typeof authHeader !== 'string') return false;

  const expected = Buffer.from(`Bearer ${CRON_SECRET}`);
  const received = Buffer.from(authHeader);
  return received.length === expected.length && timingSafeEqual(received, expected);
};

/**
 * Middleware que valida el header Authorization enviado por Vercel Cron Jobs.
 * Vercel envia: Authorization: Bearer <CRON_SECRET>
 */
export const validateCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!CRON_SECRET) {
    const response = new UnauthorizedResponseModel('CRON_SECRET no configurado en el servidor');
    return res.status(response.status).json(response);
  }

  if (!isValidBearer(authHeader)) {
    const response = new UnauthorizedResponseModel('Acceso no autorizado al endpoint cron');
    return res.status(response.status).json(response);
  }

  next();
};
