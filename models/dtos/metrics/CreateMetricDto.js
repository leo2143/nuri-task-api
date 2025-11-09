/**
 * DTO para crear métricas generales del usuario
 * @class CreateMetricDto
 * @description Define la estructura y validaciones para crear Metrics
 * ⚠️ NOTA: Las métricas se crean automáticamente al registrar un usuario.
 * Este DTO se usa principalmente para testing o migración de datos.
 */
export class CreateMetricDto {
  /**
   * @param {Object} data - Datos de las métricas del usuario
   * @param {string} data.userId - ID del usuario (requerido)
   * @param {number} [data.currentStreak=0] - Racha actual de días consecutivos
   * @param {number} [data.bestStreak=0] - Mejor racha histórica
   * @param {number} [data.totalTasksCompleted=0] - Total de tareas completadas
   * @param {number} [data.totalGoalsCompleted=0] - Total de metas completadas
   * @param {Date|string|null} [data.lastActivityDate=null] - Fecha de última actividad
   * @param {Array} [data.history=[]] - Historial de actividad diaria
   */
  constructor(data) {
    // Campo requerido
    this.userId = data.userId;

    // Campos opcionales con valores por defecto
    this.currentStreak = data.currentStreak !== undefined ? data.currentStreak : 0;
    this.bestStreak = data.bestStreak !== undefined ? data.bestStreak : 0;
    this.totalTasksCompleted = data.totalTasksCompleted !== undefined ? data.totalTasksCompleted : 0;
    this.totalGoalsCompleted = data.totalGoalsCompleted !== undefined ? data.totalGoalsCompleted : 0;
    this.lastActivityDate = data.lastActivityDate || null;
    this.history = data.history || [];
  }

  /**
   * Valida userId
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateUserId(required = true) {
    if (this.userId === undefined) return null;

    if (required && (!this.userId || typeof this.userId !== 'string' || this.userId.trim() === '')) {
      return 'El ID del usuario es requerido y debe ser un string válido';
    }

    return null;
  }

  /**
   * Valida un campo numérico positivo
   * @param {string} fieldName - Nombre del campo
   * @param {number} value - Valor a validar
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validatePositiveNumber(fieldName, value) {
    if (value === undefined) return null;

    if (typeof value !== 'number') {
      return `El campo ${fieldName} debe ser un número`;
    }
    if (value < 0) {
      return `El campo ${fieldName} debe ser mayor o igual a 0`;
    }

    return null;
  }

  /**
   * Valida el historial
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateHistory() {
    if (!this.history || !Array.isArray(this.history)) {
      return 'El historial debe ser un array';
    }

    for (const entry of this.history) {
      if (!entry.date || !entry.tasksCompleted) {
        return 'Cada entrada del historial debe tener date y tasksCompleted';
      }
      if (typeof entry.tasksCompleted !== 'number' || entry.tasksCompleted < 0) {
        return 'El campo tasksCompleted debe ser un número positivo';
      }
    }

    return null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar userId (requerido)
    const userIdError = this._validateUserId(true);
    if (userIdError) errors.push(userIdError);

    // Validar campos numéricos
    const streakError = this._validatePositiveNumber('currentStreak', this.currentStreak);
    if (streakError) errors.push(streakError);

    const bestStreakError = this._validatePositiveNumber('bestStreak', this.bestStreak);
    if (bestStreakError) errors.push(bestStreakError);

    const tasksError = this._validatePositiveNumber('totalTasksCompleted', this.totalTasksCompleted);
    if (tasksError) errors.push(tasksError);

    const goalsError = this._validatePositiveNumber('totalGoalsCompleted', this.totalGoalsCompleted);
    if (goalsError) errors.push(goalsError);

    // Validar historial
    const historyError = this._validateHistory();
    if (historyError) errors.push(historyError);

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
      userId: this.userId.trim(),
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalTasksCompleted: this.totalTasksCompleted,
      totalGoalsCompleted: this.totalGoalsCompleted,
      lastActivityDate: this.lastActivityDate,
      history: this.history,
    };
  }
}
