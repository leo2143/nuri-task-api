import { z } from 'zod';
import { tokenField, validateZod } from '../zodHelpers.js';

/**
 * Token de verificación / reset (params o body).
 */
export class TokenDto {
  static schema = z.object({
    token: tokenField,
  });

  constructor(data = {}) {
    this.token = data.token;
  }

  validate() {
    return validateZod(this.constructor.schema, { token: this.token });
  }

  toPlainObject() {
    return {
      token: String(this.token).trim(),
    };
  }
}
