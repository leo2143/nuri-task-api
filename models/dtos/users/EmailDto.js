import { z } from 'zod';
import { emailField, validateZod } from '../zodHelpers.js';

/**
 * DTO base de email. Login, forgot y resend heredan la misma regla.
 */
export class EmailDto {
  static schema = z.object({
    email: emailField,
  });

  constructor(data = {}) {
    this.email = data.email;
  }

  validate() {
    return validateZod(this.constructor.schema, { email: this.email });
  }

  toPlainObject() {
    return {
      email: String(this.email).trim().toLowerCase(),
    };
  }
}
