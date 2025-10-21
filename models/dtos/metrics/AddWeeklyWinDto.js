/**
 * DTO para agregar un logro semanal a una métrica
 * @class AddWeeklyWinDto
 * @description Define la estructura y validaciones para agregar un logro semanal
 */
export class AddWeeklyWinDto {
  /**
   * @param {Object} data - Datos del logro
   * @param {string} data.description - Descripción del logro (requerido)
   * @param {string} data.week - Semana del logro (requerido)
   */
  constructor(data) {
    this.description = data.description;
    this.week = data.week;
    this.date = new Date();
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar description
    if (!this.description || typeof this.description !== 'string' || this.description.trim() === '') {
      errors.push('La descripción del logro es requerida y debe ser un string válido');
    }

    // Validar week
    if (!this.week || typeof this.week !== 'string' || this.week.trim() === '') {
      errors.push('La semana del logro es requerida y debe ser un string válido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos del logro
   */
  toPlainObject() {
    return {
      description: this.description.trim(),
      week: this.week.trim(),
      date: this.date,
    };
  }
}
