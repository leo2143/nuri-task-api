import { CreateMoodboardDto } from './CreateMoodboardDto.js';

/**
 * DTO para actualizar un moodboard existente
 * Solo permite actualizar imagenes en batch
 * @class UpdateMoodboardDto
 * @extends CreateMoodboardDto
 */
export class UpdateMoodboardDto extends CreateMoodboardDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {Array} [data.images] - Array de imágenes
   */
  constructor(data = {}) {
    super({});

    if (data.images !== undefined) this.images = data.images;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar imágenes
    const imageErrors = this._validateImages();
    errors.push(...imageErrors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos a actualizar
   */
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
