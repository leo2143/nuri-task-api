import { z } from 'zod';
import { imageUrlField, validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar solo la foto de perfil del usuario
 */
export class UpdateProfileImageDto {
  static schema = z.object({
    profileImageUrl: imageUrlField(true, 'La URL de la imagen de perfil'),
  });

  constructor(data) {
    this.profileImageUrl = data.profileImageUrl;
  }

  validate() {
    return validateZod(this.constructor.schema, { profileImageUrl: this.profileImageUrl });
  }

  toPlainObject() {
    return {
      profileImageUrl: this.profileImageUrl.trim(),
    };
  }
}
