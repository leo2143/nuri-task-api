import { z } from 'zod';
import { cloudinaryImageUrlField, validateZod } from '../zodHelpers.js';

/**
 * DTO para eliminar una imagen de Cloudinary directamente
 */
export class DeleteCloudinaryImageDto {
  static schema = z.object({
    imageUrl: cloudinaryImageUrlField('La URL de la imagen'),
  });

  constructor(data) {
    this.imageUrl = data.imageUrl;
  }

  validate() {
    return validateZod(this.constructor.schema, { imageUrl: this.imageUrl });
  }

  toPlainObject() {
    return {
      imageUrl: this.imageUrl.trim(),
    };
  }
}
