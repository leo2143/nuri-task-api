import { passwordField, validateZod } from '../zodHelpers.js';
import { TokenDto } from './TokenDto.js';

/**
 * DTO para resetear contraseña con token
 */
export class ResetPasswordDto extends TokenDto {
  static schema = TokenDto.schema.extend({
    newPassword: passwordField,
  });

  constructor(data) {
    super(data);
    this.newPassword = data.newPassword;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      token: this.token,
      newPassword: this.newPassword,
    });
  }

  toPlainObject() {
    return {
      ...super.toPlainObject(),
      newPassword: this.newPassword,
    };
  }
}
