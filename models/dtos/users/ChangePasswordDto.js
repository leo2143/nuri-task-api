import { z } from 'zod';
import { loginPasswordField, passwordField, validateZod } from '../zodHelpers.js';

/**
 * DTO para cambiar la contraseña de un usuario
 */
export class ChangePasswordDto {
  static schema = z
    .object({
      oldPassword: loginPasswordField,
      newPassword: passwordField,
    })
    .refine(data => data.oldPassword !== data.newPassword, {
      message: 'La nueva contraseña debe ser diferente a la actual',
      path: ['newPassword'],
    });

  constructor(data) {
    this.oldPassword = data.oldPassword;
    this.newPassword = data.newPassword;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
    });
  }

  toPlainObject() {
    return {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
    };
  }
}
