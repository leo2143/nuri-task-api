import { EmailDto } from './EmailDto.js';
import { loginPasswordField, validateZod } from '../zodHelpers.js';

/**
 * DTO para login de usuario
 */
export class LoginUserDto extends EmailDto {
  static schema = EmailDto.schema.extend({
    password: loginPasswordField,
  });

  constructor(data) {
    super(data);
    this.password = data.password;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      email: this.email,
      password: this.password,
    });
  }

  toPlainObject() {
    return {
      ...super.toPlainObject(),
      password: this.password,
    };
  }
}
