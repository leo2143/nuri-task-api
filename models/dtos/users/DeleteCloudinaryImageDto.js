import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';

/**
 * DTO para eliminar una imagen de Cloudinary directamente
 * @class DeleteCloudinaryImageDto
 * @description Define la estructura y validaciones para eliminar una imagen de Cloudinary
 */
export class DeleteCloudinaryImageDto {
  /**
   * @param {Object} data - Datos de la imagen a eliminar
   * @param {string} data.imageUrl - URL de la imagen en Cloudinary (requerido)
   */
  constructor(data) {
    this.imageUrl = data.imageUrl;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    const imageUrlError = ValidationHelpers.validateImageUrl(this.imageUrl, true, 'La URL de la imagen');
    if (imageUrlError) errors.push(imageUrlError);

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
      imageUrl: this.imageUrl.trim(),
    };
  }
}

