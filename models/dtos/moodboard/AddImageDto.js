import { z } from 'zod';
import { imageUrlField, queryNumberField, validateZod } from '../zodHelpers.js';

/**
 * DTO para agregar una imagen a un moodboard
 */
export class AddImageDto {
  static schema = z.object({
    imageUrl: imageUrlField(true, 'La URL de la imagen'),
    imageAlt: z
      .string({ required_error: 'El texto alternativo es requerido y debe ser un string válido' })
      .trim()
      .min(1, 'El texto alternativo es requerido y debe ser un string válido'),
    imagePositionNumber: queryNumberField.refine(value => value >= 0, 'La posición debe ser mayor o igual a 0'),
  });

  constructor(data) {
    this.imageUrl = data.imageUrl;
    this.imageAlt = data.imageAlt;
    this.imagePositionNumber = data.imagePositionNumber;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      imageUrl: this.imageUrl,
      imageAlt: this.imageAlt,
      imagePositionNumber: this.imagePositionNumber,
    });
  }

  toPlainObject() {
    return {
      imageUrl: this.imageUrl.trim(),
      imageAlt: this.imageAlt.trim(),
      imagePositionNumber: this.imagePositionNumber,
    };
  }
}
