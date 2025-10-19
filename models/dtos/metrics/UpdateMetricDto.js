/**
 * DTO para actualizar una métrica existente
 * @class UpdateMetricDto
 * @description Define la estructura y validaciones para actualizar una métrica
 * Al actualizar, el estado actual se guarda en history
 */
export class UpdateMetricDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.currentWeek] - Nueva semana actual
   * @param {number} [data.currentProgress] - Nuevo progreso (0-100)
   * @param {string} [data.currentNotes] - Nuevas notas
   */
  constructor(data) {
    if (data.currentWeek !== undefined) this.currentWeek = data.currentWeek;
    if (data.currentProgress !== undefined) this.currentProgress = data.currentProgress;
    if (data.currentNotes !== undefined) this.currentNotes = data.currentNotes;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar currentWeek si existe
    if (this.currentWeek !== undefined) {
      if (typeof this.currentWeek !== 'string' || this.currentWeek.trim() === '') {
        errors.push('La semana debe ser un string válido');
      }
    }

    // Validar currentProgress si existe
    if (this.currentProgress !== undefined) {
      if (typeof this.currentProgress !== 'number') {
        errors.push('El progreso debe ser un número');
      } else if (this.currentProgress < 0 || this.currentProgress > 100) {
        errors.push('El progreso debe estar entre 0 y 100');
      }
    }

    // Validar currentNotes si existe
    if (this.currentNotes !== undefined) {
      if (typeof this.currentNotes !== 'string') {
        errors.push('Las notas deben ser un string');
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
    const result = {
      lastUpdated: new Date(),
    };

    if (this.currentWeek !== undefined) result.currentWeek = this.currentWeek.trim();
    if (this.currentProgress !== undefined) result.currentProgress = this.currentProgress;
    if (this.currentNotes !== undefined) result.currentNotes = this.currentNotes.trim();

    return result;
  }
}
