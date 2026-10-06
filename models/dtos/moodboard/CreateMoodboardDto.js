import { z } from 'zod';
import { AddImageDto } from './AddImageDto.js';
import { validateZod } from '../zodHelpers.js';

/**
 * DTO para crear un moodboard (uso interno al registrar)
 */
export class CreateMoodboardDto {
  static schema = z.object({
    images: z.array(AddImageDto.schema, { invalid_type_error: 'Las imágenes deben ser un array' }).optional(),
  });

  constructor(data = {}) {
    this.images = data.images || [];
  }

  validate() {
    return validateZod(this.constructor.schema, { images: this.images });
  }

  toPlainObject() {
    return {
      images: this.images.map(img => ({
        imageUrl: img.imageUrl.trim(),
        imageAlt: img.imageAlt.trim(),
        imagePositionNumber: img.imagePositionNumber,
      })),
    };
  }
}
