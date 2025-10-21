/**
 * DTO para agregar un comentario a una tarea
 * @class AddCommentDto
 * @description Define la estructura y validaciones para agregar un comentario a un todo
 */
export class AddCommentDto {
  /**
   * @param {Object} data - Datos del comentario
   * @param {string} data.text - Texto del comentario (requerido)
   * @param {string} data.author - Autor del comentario (requerido)
   * @param {Date|string} [data.date] - Fecha del comentario (opcional, por defecto la actual)
   */
  constructor(data) {
    this.text = data.text;
    this.author = data.author;
    this.date = data.date || new Date();
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar texto del comentario
    if (!this.text || typeof this.text !== 'string' || this.text.trim() === '') {
      errors.push('El texto del comentario es requerido y debe ser un string válido');
    }

    if (this.text && this.text.trim().length < 3) {
      errors.push('El texto del comentario debe tener al menos 3 caracteres');
    }

    if (this.text && this.text.trim().length > 500) {
      errors.push('El texto del comentario no puede superar los 500 caracteres');
    }

    // Validar autor del comentario
    if (!this.author || typeof this.author !== 'string' || this.author.trim() === '') {
      errors.push('El autor del comentario es requerido y debe ser un string válido');
    }

    if (this.author && this.author.trim().length < 2) {
      errors.push('El nombre del autor debe tener al menos 2 caracteres');
    }

    // Validar fecha si existe
    if (this.date) {
      const date = new Date(this.date);
      if (isNaN(date.getTime())) {
        errors.push('La fecha del comentario debe ser una fecha válida');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos del comentario
   */
  toPlainObject() {
    return {
      text: this.text.trim(),
      author: this.author.trim(),
      date: this.date,
    };
  }
}
