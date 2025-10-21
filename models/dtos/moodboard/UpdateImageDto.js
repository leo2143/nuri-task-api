/**
 * DTO para actualizar una imagen de un moodboard
 * @class UpdateImageDto
 * @description Define la estructura y validaciones para actualizar una imagen
 */
export class UpdateImageDto {
  /**
   * @param {Object} data - Datos de la imagen a actualizar
   * @param {string} [data.imageUrl] - Nueva URL de la imagen
   * @param {string} [data.imageAlt] - Nuevo texto alternativo
   * @param {number} [data.imagePositionNumber] - Nueva posición
   */
  constructor(data) {
    if (data.imageUrl !== undefined) this.imageUrl = data.imageUrl;
    if (data.imageAlt !== undefined) this.imageAlt = data.imageAlt;
    if (data.imagePositionNumber !== undefined) this.imagePositionNumber = data.imagePositionNumber;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar imageUrl si existe
    if (this.imageUrl !== undefined) {
      if (typeof this.imageUrl !== 'string' || this.imageUrl.trim() === '') {
        errors.push('La URL debe ser un string válido');
      }
    }

    // Validar imageAlt si existe
    if (this.imageAlt !== undefined) {
      if (typeof this.imageAlt !== 'string' || this.imageAlt.trim() === '') {
        errors.push('El texto alternativo debe ser un string válido');
      }
    }

    // Validar imagePositionNumber si existe
    if (this.imagePositionNumber !== undefined) {
      if (typeof this.imagePositionNumber !== 'number') {
        errors.push('La posición debe ser un número');
      } else if (this.imagePositionNumber < 0) {
        errors.push('La posición debe ser mayor o igual a 0');
      }
    }

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

    if (this.imageUrl !== undefined) result.imageUrl = this.imageUrl.trim();
    if (this.imageAlt !== undefined) result.imageAlt = this.imageAlt.trim();
    if (this.imagePositionNumber !== undefined) result.imagePositionNumber = this.imagePositionNumber;

    return result;
  }
}
