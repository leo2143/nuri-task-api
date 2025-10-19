/**
 * DTO para agregar una imagen a un moodboard
 * @class AddImageDto
 * @description Define la estructura y validaciones para agregar una imagen
 */
export class AddImageDto {
  /**
   * @param {Object} data - Datos de la imagen
   * @param {string} data.imageUrl - URL de la imagen (requerido)
   * @param {string} data.imageAlt - Texto alternativo (requerido)
   * @param {number} data.imagePositionNumber - Posición de la imagen (requerido)
   */
  constructor(data) {
    this.imageUrl = data.imageUrl;
    this.imageAlt = data.imageAlt;
    this.imagePositionNumber = data.imagePositionNumber;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar imageUrl
    if (!this.imageUrl || typeof this.imageUrl !== 'string' || this.imageUrl.trim() === '') {
      errors.push('La URL de la imagen es requerida y debe ser un string válido');
    }

    // Validar imageAlt
    if (!this.imageAlt || typeof this.imageAlt !== 'string' || this.imageAlt.trim() === '') {
      errors.push('El texto alternativo es requerido y debe ser un string válido');
    }

    // Validar imagePositionNumber
    if (this.imagePositionNumber === undefined || this.imagePositionNumber === null) {
      errors.push('La posición de la imagen es requerida');
    } else if (typeof this.imagePositionNumber !== 'number') {
      errors.push('La posición debe ser un número');
    } else if (this.imagePositionNumber < 0) {
      errors.push('La posición debe ser mayor o igual a 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos de la imagen
   */
  toPlainObject() {
    return {
      imageUrl: this.imageUrl.trim(),
      imageAlt: this.imageAlt.trim(),
      imagePositionNumber: this.imagePositionNumber,
    };
  }
}
