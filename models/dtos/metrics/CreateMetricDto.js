/**
 * DTO para crear una nueva métrica (simplificado - enfoque motivacional)
 * @class CreateMetricDto
 * @description Define la estructura y validaciones para crear una métrica
 */
export class CreateMetricDto {
  /**
   * @param {Object} data - Datos de la métrica
   * @param {string} data.GoalId - ID de la meta (requerido)
   * @param {number} [data.currentProgress=0] - Progreso actual (0-100)
   * @param {string} [data.notes=''] - Notas opcionales del usuario
   */
  constructor(data) {
    // Campos requeridos
    this.GoalId = data.GoalId;

    // Campos opcionales
    this.currentProgress = data.currentProgress !== undefined ? data.currentProgress : 0;
    this.notes = data.notes || '';

    // Campos iniciales
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.history = [];
    this.lastUpdated = new Date();
  }

  /**
   * Valida GoalId
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateGoalId(required = true) {
    if (this.GoalId === undefined) return null;

    if (required && (!this.GoalId || typeof this.GoalId !== 'string' || this.GoalId.trim() === '')) {
      return 'El ID de la meta es requerido y debe ser un string válido';
    }

    return null;
  }

  /**
   * Valida currentProgress
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateCurrentProgress() {
    if (this.currentProgress === undefined) return null;

    if (typeof this.currentProgress !== 'number') {
      return 'El progreso debe ser un número';
    }
    if (this.currentProgress < 0 || this.currentProgress > 100) {
      return 'El progreso debe estar entre 0 y 100';
    }

    return null;
  }

  /**
   * Valida notes
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateNotes() {
    if (this.notes === undefined) return null;

    if (this.notes && typeof this.notes !== 'string') {
      return 'Las notas deben ser un string';
    }

    return null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar campos requeridos
    const goalIdError = this._validateGoalId(true);
    if (goalIdError) errors.push(goalIdError);

    // Validar campos opcionales
    const progressError = this._validateCurrentProgress();
    if (progressError) errors.push(progressError);

    const notesError = this._validateNotes();
    if (notesError) errors.push(notesError);

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
      currentProgress: this.currentProgress,
      notes: this.notes.trim(),
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      history: this.history,
      lastUpdated: this.lastUpdated,
    };
  }
}
