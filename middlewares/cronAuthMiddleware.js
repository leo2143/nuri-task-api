import { UnauthorizedResponseModel } from '../models/responseModel.js';

const CRON_SECRET = process.env.CRON_SECRET;

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

  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    const response = new UnauthorizedResponseModel('Acceso no autorizado al endpoint cron');
    return res.status(response.status).json(response);
  }

  next();
};
