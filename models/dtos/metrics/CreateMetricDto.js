/**
 * DTO para crear una nueva métrica
 * @class CreateMetricDto
 * @description Define la estructura y validaciones para crear una métrica
 */
export class CreateMetricDto {
  /**
   * @param {Object} data - Datos de la métrica
   * @param {string} data.GoalId - ID de la meta (requerido)
   * @param {string} data.currentWeek - Semana actual (requerido)
   * @param {number} [data.currentProgress=0] - Progreso actual (0-100)
   * @param {string} [data.currentNotes=''] - Notas actuales
   */
  constructor(data) {
    this.GoalId = data.GoalId;
    this.currentWeek = data.currentWeek;
    this.currentProgress = data.currentProgress !== undefined ? data.currentProgress : 0;
    this.currentNotes = data.currentNotes || '';
    this.history = [];
    this.lastUpdated = new Date();
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar GoalId
    if (!this.GoalId || typeof this.GoalId !== 'string' || this.GoalId.trim() === '') {
      errors.push('El ID de la meta es requerido y debe ser un string válido');
    }

    // Validar currentWeek
    if (!this.currentWeek || typeof this.currentWeek !== 'string' || this.currentWeek.trim() === '') {
      errors.push('La semana actual es requerida y debe ser un string válido');
    }

    // Validar currentProgress
    if (typeof this.currentProgress !== 'number') {
      errors.push('El progreso debe ser un número');
    } else if (this.currentProgress < 0 || this.currentProgress > 100) {
      errors.push('El progreso debe estar entre 0 y 100');
    }

    // Validar currentNotes si existe
    if (this.currentNotes && typeof this.currentNotes !== 'string') {
      errors.push('Las notas deben ser un string');
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
      GoalId: this.GoalId.trim(),
      currentWeek: this.currentWeek.trim(),
      currentProgress: this.currentProgress,
      currentNotes: this.currentNotes.trim(),
      history: this.history,
      lastUpdated: this.lastUpdated,
    };
  }
}
