import { CreateMoodboardDto } from './CreateMoodboardDto.js';
import { validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar un moodboard existente
 */
export class UpdateMoodboardDto extends CreateMoodboardDto {
  static schema = CreateMoodboardDto.schema;

  constructor(data = {}) {
    super({});
    if (data.images !== undefined) this.images = data.images;
  }

  validate() {
    return validateZod(this.constructor.schema, { images: this.images });
  }

  toPlainObject() {
    const result = {};

    if (this.images !== undefined) {
      result.images = this.images.map(img => ({
        imageUrl: img.imageUrl.trim(),
        imageAlt: img.imageAlt.trim(),
        imagePositionNumber: img.imagePositionNumber,
      }));
    }

    return result;
  }
}
