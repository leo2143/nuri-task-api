/**
 * DTO para crear un nuevo moodboard
 * @class CreateMoodboardDto
 * @description Define la estructura y validaciones para crear un moodboard
 */
export class CreateMoodboardDto {
  /**
   * @param {Object} data - Datos del moodboard
   * @param {string} data.title - Título del moodboard (requerido)
   * @param {Array} [data.images=[]] - Array de imágenes
   * @param {Array} [data.phrases=[]] - Array de frases inspiradoras
   */
  constructor(data) {
    this.title = data.title;
    this.images = data.images || [];
    this.phrases = data.phrases || [];
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar título
    if (!this.title || typeof this.title !== 'string' || this.title.trim() === '') {
      errors.push('El título es requerido y debe ser un string válido');
    }

    // Validar images si existe
    if (this.images) {
      if (!Array.isArray(this.images)) {
        errors.push('Las imágenes deben ser un array');
      } else {
        // Validar cada imagen
        this.images.forEach((image, index) => {
          if (!image.imageUrl || typeof image.imageUrl !== 'string' || image.imageUrl.trim() === '') {
            errors.push(`Imagen ${index + 1}: La URL es requerida`);
          }
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

        // Validar máximo 6 imágenes
        if (this.images.length > 6) {
          errors.push('No se pueden agregar más de 6 imágenes');
        }
      }
    }

    // Validar phrases si existe
    if (this.phrases) {
      if (!Array.isArray(this.phrases)) {
        errors.push('Las frases deben ser un array');
      } else {
        this.phrases.forEach((phraseObj, index) => {
          if (!phraseObj.phrase || typeof phraseObj.phrase !== 'string' || phraseObj.phrase.trim() === '') {
            errors.push(`Frase ${index + 1}: El texto es requerido`);
          }
        });
      }
    }

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
      title: this.title.trim(),
      images: this.images.map(img => ({
        imageUrl: img.imageUrl.trim(),
        imageAlt: img.imageAlt.trim(),
        imagePositionNumber: img.imagePositionNumber,
      })),
      phrases: this.phrases.map(p => ({
        phrase: p.phrase.trim(),
      })),
    };
  }
}
