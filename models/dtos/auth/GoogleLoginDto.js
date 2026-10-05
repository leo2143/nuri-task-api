import { z } from 'zod';
import { validateZod } from '../zodHelpers.js';

/**
 * Body de POST /api/auth/google ({ code }).
 */
export class GoogleLoginDto {
  static schema = z.object({
    code: z
      .string({ required_error: 'El código de autorización es requerido' })
      .trim()
      .min(1, 'El código de autorización es requerido'),
  });

  constructor(data = {}) {
    this.code = data.code;
  }

  validate() {
    return validateZod(this.constructor.schema, { code: this.code });
  }

  toPlainObject() {
    return {
      code: String(this.code).trim(),
    };
  }
}
