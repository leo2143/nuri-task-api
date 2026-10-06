import { z } from 'zod';
import { EmailDto } from './EmailDto.js';
import { passwordField, validateZod } from '../zodHelpers.js';

/**
 * DTO para crear un nuevo usuario
 */
export class CreateUserDto extends EmailDto {
  static schema = EmailDto.schema.extend({
    name: z
      .string({ required_error: 'El nombre es requerido y debe ser un valor válido' })
      .trim()
      .min(1, 'El nombre es requerido y debe ser un valor válido'),
    password: passwordField,
  });

  constructor(data) {
    super(data);
    this.name = data.name;
    this.password = data.password;
  }

  static validatePasswordValue(password) {
    const result = passwordField.safeParse(password);
    return result.success ? null : result.error.issues[0].message;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      email: this.email,
      name: this.name,
      password: this.password,
    });
  }

  toPlainObject() {
    return {
      name: this.name.trim(),
      ...super.toPlainObject(),
      password: this.password,
    };
  }
}
