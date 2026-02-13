/**
 * Helpers de validación comunes reutilizables
 * @class ValidationHelpers
 * @description Contiene métodos de validación comunes que se repiten en múltiples DTOs
 */
export class ValidationHelpers {
  /**
   * Valida una URL de imagen
   * @param {string} imageUrl - URL de la imagen a validar
   * @param {boolean} required - Si el campo es requerido (default: true)
   * @param {string} fieldName - Nombre del campo para el mensaje de error (default: 'La URL de la imagen')
   * @returns {string|null} Mensaje de error o null si es válido
   * @example
   * // Validación requerida
   * const error = ValidationHelpers.validateImageUrl(this.imageUrl, true, 'La URL de la imagen');
   * if (error) errors.push(error);
   * @example
   * // Validación opcional
   * const error = ValidationHelpers.validateImageUrl(this.imageUrl, false);
   * if (error) errors.push(error);
   */
  static validateImageUrl(imageUrl, required = true, fieldName = 'La URL de la imagen') {
    if (imageUrl === undefined || imageUrl === null) {
      if (required) {
        return `${fieldName} es requerida y debe ser un string válido`;
      }
      return null;
    }

    if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      if (required) {
        return `${fieldName} es requerida y debe ser un string válido`;
      }
      return `${fieldName} debe ser un string válido`;
    }

    return null;
  }
}

