import { CreateMoodboardDto } from './CreateMoodboardDto.js';

/**
 * DTO para actualizar un moodboard existente
 * @class UpdateMoodboardDto
 * @extends CreateMoodboardDto
 * @description Define la estructura y validaciones para actualizar un moodboard
 * Hereda las validaciones de CreateMoodboardDto pero todos los campos son opcionales
 */
export class UpdateMoodboardDto extends CreateMoodboardDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.title] - Título del moodboard
   * @param {Array} [data.images] - Array de imágenes
   * @param {Array} [data.phrases] - Array de frases
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({});
    
    if (data.title !== undefined) this.title = data.title;
    if (data.images !== undefined) this.images = data.images;
    if (data.phrases !== undefined) this.phrases = data.phrases;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * Reutiliza los métodos de validación del padre
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Reutilizar métodos de validación del padre (sin requerir campos)
    const titleError = this._validateTitle(false);
    if (titleError) errors.push(titleError);

    // Validar imágenes
    const imageErrors = this._validateImages();
    errors.push(...imageErrors);

    // Validar frases
    const phraseErrors = this._validatePhrases();
    errors.push(...phraseErrors);

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

    if (this.title !== undefined) result.title = this.title.trim();

    if (this.images !== undefined) {
      result.images = this.images.map(img => ({
        imageUrl: img.imageUrl.trim(),
        imageAlt: img.imageAlt.trim(),
        imagePositionNumber: img.imagePositionNumber,
      }));
    }

    if (this.phrases !== undefined) {
      result.phrases = this.phrases.map(p => ({
        phrase: p.phrase.trim(),
      }));
    }

    return result;
  }
}
