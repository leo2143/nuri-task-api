import { z } from 'zod';
import { CreateUserDto } from './CreateUserDto.js';
import { validateZod } from '../zodHelpers.js';

/**
 * DTO para crear un usuario con control admin completo
 */
export class CreateAdminUserDto extends CreateUserDto {
  static schema = CreateUserDto.schema.extend({
    isAdmin: z.boolean({ invalid_type_error: 'isAdmin debe ser un valor booleano' }).optional(),
    isSubscribed: z.boolean({ invalid_type_error: 'isSubscribed debe ser un valor booleano' }).optional(),
    profileImageUrl: z.string().nullable().optional(),
  });

  constructor(data) {
    super(data);
    this.isAdmin = data.isAdmin || false;
    this.profileImageUrl = data.profileImageUrl || null;
    this.isSubscribed = data.isSubscribed || false;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      name: this.name,
      email: this.email,
      password: this.password,
      isAdmin: this.isAdmin,
      isSubscribed: this.isSubscribed,
      profileImageUrl: this.profileImageUrl,
    });
  }

  toPlainObject() {
    return {
      ...super.toPlainObject(),
      isAdmin: this.isAdmin,
      profileImageUrl: this.profileImageUrl,
      isSubscribed: this.isSubscribed,
    };
  }
}
