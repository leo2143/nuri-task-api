import { z } from 'zod';
import { imageUrlField, queryNumberField, validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar una imagen de un moodboard
 */
export class UpdateImageDto {
  static schema = z
    .object({
      imageUrl: imageUrlField(false, 'La URL').optional(),
      imageAlt: z.string().trim().min(1, 'El texto alternativo debe ser un string válido').optional(),
      imagePositionNumber: queryNumberField.refine(value => value >= 0, 'La posición debe ser mayor o igual a 0').optional(),
    })
    .refine(data => data.imageUrl !== undefined || data.imageAlt !== undefined || data.imagePositionNumber !== undefined, {
      message: 'Debe enviar al menos un campo para actualizar',
    });

  constructor(data) {
    if (data.imageUrl !== undefined) this.imageUrl = data.imageUrl;
    if (data.imageAlt !== undefined) this.imageAlt = data.imageAlt;
    if (data.imagePositionNumber !== undefined) this.imagePositionNumber = data.imagePositionNumber;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      imageUrl: this.imageUrl,
      imageAlt: this.imageAlt,
      imagePositionNumber: this.imagePositionNumber,
    });
  }

  toPlainObject() {
    const result = {};

    if (this.imageUrl !== undefined) result.imageUrl = this.imageUrl.trim();
    if (this.imageAlt !== undefined) result.imageAlt = this.imageAlt.trim();
    if (this.imagePositionNumber !== undefined) result.imagePositionNumber = this.imagePositionNumber;

    return result;
  }
}
