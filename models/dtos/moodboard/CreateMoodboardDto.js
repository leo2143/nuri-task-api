import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';

/**
 * DTO para crear un nuevo moodboard (uso interno)
 * Se utiliza automaticamente al registrar un usuario
 * @class CreateMoodboardDto
 */
export class CreateMoodboardDto {
  /**
   * @param {Object} data - Datos del moodboard
   * @param {Array} [data.images=[]] - Array de imágenes
   */
  constructor(data = {}) {
    this.images = data.images || [];
  }

  /**
   * Valida las imágenes
   * @returns {string[]} Array de mensajes de error
   */
  _validateImages() {
    const errors = [];

    if (this.images === undefined) return errors;

    if (!Array.isArray(this.images)) {
      errors.push('Las imágenes deben ser un array');
      return errors;
    }

    // Validar cada imagen
    this.images.forEach((image, index) => {
      const imageUrlError = ValidationHelpers.validateImageUrl(
        image.imageUrl,
        true,
        `Imagen ${index + 1}: La URL`
      );
      if (imageUrlError) errors.push(imageUrlError);
      if (!image.imageAlt || typeof image.imageAlt !== 'string' || image.imageAlt.trim() === '') {
        errors.push(`Imagen ${index + 1}: El texto alternativo es requerido`);
      }
      if (image.imagePositionNumber === undefined || typeof image.imagePositionNumber !== 'number') {
        errors.push(`Imagen ${index + 1}: La posición es requerida y debe ser un número`);
      }
      if (image.imagePositionNumber < 0) {
        errors.push(`Imagen ${index + 1}: La posición debe ser mayor o igual a 0`);
      }
    });

    return errors;
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
   * @returns {Object} Objeto plano con los datos
   */
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
