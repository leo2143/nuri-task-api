import { z } from 'zod';
import { validateZod } from '../zodHelpers.js';

/**
 * Endpoint de una suscripción Web Push (unsubscribe).
 */
export class PushEndpointDto {
  static schema = z.object({
    endpoint: z
      .string({ required_error: 'Se requiere el endpoint de la suscripción' })
      .trim()
      .min(1, 'Se requiere el endpoint de la suscripción'),
  });

  constructor(data = {}) {
    this.endpoint = data.endpoint;
  }

  validate() {
    return validateZod(this.constructor.schema, { endpoint: this.endpoint });
  }

  toPlainObject() {
    return {
      endpoint: String(this.endpoint).trim(),
    };
  }
}
