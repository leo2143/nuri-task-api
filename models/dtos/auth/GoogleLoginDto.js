import { z } from 'zod';
import { timezoneField, validateZod } from '../zodHelpers.js';

/**
 * Body de POST /api/auth/google ({ code, timezone? }). La zona es opcional y leniente.
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
    this.timezone = timezoneField.parse(data.timezone);
  }

  validate() {
    return validateZod(this.constructor.schema, { code: this.code });
  }

  toPlainObject() {
    return {
      code: String(this.code).trim(),
      ...(this.timezone ? { timezone: this.timezone } : {}),
    };
  }
}
