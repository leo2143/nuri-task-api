import { passwordField, validateZod } from '../zodHelpers.js';
import { UpdateUserDto } from './UpdateUserDto.js';
import { z } from 'zod';

/**
 * DTO para actualizar un usuario con control admin completo
 */
export class UpdateAdminUserDto extends UpdateUserDto {
  static schema = UpdateUserDto.schema.extend({
    password: passwordField.optional(),
    isSubscribed: z.boolean({ invalid_type_error: 'isSubscribed debe ser un valor booleano' }).optional(),
  });

  constructor(data) {
    super(data);
    this.password = data.password;
    this.isSubscribed = data.isSubscribed;
    this.profileImageUrl = data.profileImageUrl;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      name: this.name,
      email: this.email,
      profileImageUrl: this.profileImageUrl,
      password: this.password,
      isSubscribed: this.isSubscribed,
    });
  }

  toPlainObject() {
    const parentData = super.toPlainObject();

    if (this.password !== undefined) {
      parentData.password = this.password;
    }

    if (this.isSubscribed !== undefined) {
      parentData.isSubscribed = this.isSubscribed;
    }

    if (this.profileImageUrl !== undefined) {
      parentData.profileImageUrl = this.profileImageUrl;
    }

    return parentData;
  }
}
