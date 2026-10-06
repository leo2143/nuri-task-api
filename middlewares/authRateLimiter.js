import { rateLimit } from 'express-rate-limit';
import { ErrorResponseModel } from '../models/responseModel.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Store in-memory: en Vercel el conteo es por instancia, no global.
 * Sigue siendo mejor que nada; un store externo (Redis) unificaría el techo.
 */
function sendTooManyRequests(_req, res) {
  res
    .status(429)
    .json(new ErrorResponseModel('Demasiados intentos. Probá de nuevo en unos minutos', 429));
}

const sharedLimiterOptions = {
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: sendTooManyRequests,
};

/**
 * Techo por IP para login, registro, forgot, reset, resend y Google.
 */
export const authRateLimiter = rateLimit({
  ...sharedLimiterOptions,
  ipv6Subnet: 56,
});

/**
 * Techo extra por email cuando el body lo traequ
 */
export const authEmailRateLimiter = rateLimit({
  ...sharedLimiterOptions,
  skip: req => typeof req.body?.email !== 'string' || !req.body.email.trim(),
  keyGenerator: req => {
    const email = req.body.email.trim().toLowerCase();
    return `email:${email}`;
  },
  validate: { keyGeneratorIpFallback: false },
});

/**
 * IP + email. Reset/Google no mandan email: usar solo `authRateLimiter`.
 */
export const publicAuthRateLimiters = [authRateLimiter, authEmailRateLimiter];
