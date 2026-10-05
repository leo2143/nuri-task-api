import { z } from 'zod';
import { CreateUserDto } from './CreateUserDto.js';
import { emailField, validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar un usuario existente.
 * No acepta password: el cambio de clave va por changePassword / reset / UpdateAdminUserDto.
 */
export class UpdateUserDto extends CreateUserDto {
  static schema = z.object({
    name: z
      .string({ invalid_type_error: 'El nombre es requerido y debe ser un valor válido' })
      .trim()
      .min(1, 'El nombre es requerido y debe ser un valor válido')
      .optional(),
    email: emailField.optional(),
    profileImageUrl: z.string().optional(),
  });

  constructor(data) {
    super(data);
    this.name = data.name;
    this.email = data.email;
    this.profileImageUrl = data.profileImageUrl;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      name: this.name,
      email: this.email,
      profileImageUrl: this.profileImageUrl,
    });
  }

  toPlainObject() {
    const result = {};

    if (this.name !== undefined) {
      result.name = this.name.trim();
    }

    if (this.email !== undefined) {
      result.email = this.email.trim().toLowerCase();
    }

    if (this.profileImageUrl !== undefined) {
      result.profileImageUrl = this.profileImageUrl;
    }

    return result;
  }
}
