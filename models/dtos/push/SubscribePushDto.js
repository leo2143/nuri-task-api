import { z } from 'zod';
import { validateZod } from '../zodHelpers.js';
import { PushEndpointDto } from './PushEndpointDto.js';

/**
 * Suscripción Web Push: endpoint + keys (p256dh, auth).
 */
export class SubscribePushDto extends PushEndpointDto {
  static schema = PushEndpointDto.schema.extend({
    keys: z.object(
      {
        p256dh: z.string().min(1, 'Suscripción inválida: faltan keys (p256dh, auth)'),
        auth: z.string().min(1, 'Suscripción inválida: faltan keys (p256dh, auth)'),
      },
      { required_error: 'Suscripción inválida: faltan keys (p256dh, auth)' }
    ),
  });

  constructor(data = {}) {
    super(data);
    this.keys = data.keys;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      endpoint: this.endpoint,
      keys: this.keys,
    });
  }

  toPlainObject() {
    return {
      ...super.toPlainObject(),
      keys: {
        p256dh: this.keys.p256dh.trim(),
        auth: this.keys.auth.trim(),
      },
    };
  }
}
