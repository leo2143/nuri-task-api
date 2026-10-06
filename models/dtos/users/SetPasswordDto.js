import { z } from 'zod';
import { passwordField, validateZod } from '../zodHelpers.js';

/**
 * Establece password en cuenta Google (sin clave previa).
 */
export class SetPasswordDto {
  static schema = z.object({
    newPassword: passwordField,
  });

  constructor(data = {}) {
    this.newPassword = data.newPassword;
  }

  validate() {
    return validateZod(this.constructor.schema, { newPassword: this.newPassword });
  }

  toPlainObject() {
    return {
      newPassword: this.newPassword,
    };
  }
}
