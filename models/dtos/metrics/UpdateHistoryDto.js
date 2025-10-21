/**
 * DTO para agregar una entrada al historial de métricas
 * @class UpdateHistoryDto
 * @description Define la estructura y validaciones para agregar una entrada al historial
 */
export class UpdateHistoryDto {
  /**
   * @param {Object} data - Datos de la entrada del historial
   * @param {string} data.week - Semana (requerido)
   * @param {number} [data.totalCompletedTasks=0] - Total de tareas completadas
   * @param {number} [data.totalTasks=0] - Total de tareas
   * @param {number} [data.missingTasks=0] - Tareas faltantes
   * @param {number} [data.progress=0] - Progreso (0-100)
   * @param {number} [data.timeInvested=0] - Tiempo invertido (horas)
   * @param {string} [data.notes=''] - Notas de la semana
   * @param {string} [data.mood] - Estado de ánimo (motivated/neutral/challenged/frustrated)
   * @param {Array} [data.achievements=[]] - Logros de la semana
   */
  constructor(data) {
    this.week = data.week;
    this.totalCompletedTasks = data.totalCompletedTasks !== undefined ? data.totalCompletedTasks : 0;
    this.totalTasks = data.totalTasks !== undefined ? data.totalTasks : 0;
    this.missingTasks = data.missingTasks !== undefined ? data.missingTasks : 0;
    this.progress = data.progress !== undefined ? data.progress : 0;
    this.date = new Date();
    this.timeInvested = data.timeInvested !== undefined ? data.timeInvested : 0;
    this.notes = data.notes || '';
    this.mood = data.mood;
    this.achievements = data.achievements || [];
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar week
    if (!this.week || typeof this.week !== 'string' || this.week.trim() === '') {
      errors.push('La semana es requerida y debe ser un string válido');
    }

    // Validar progress
    if (typeof this.progress !== 'number' || this.progress < 0 || this.progress > 100) {
      errors.push('El progreso debe estar entre 0 y 100');
    }

    // Validar totalCompletedTasks
    if (typeof this.totalCompletedTasks !== 'number' || this.totalCompletedTasks < 0) {
      errors.push('El total de tareas completadas debe ser un número no negativo');
    }

    // Validar totalTasks
    if (typeof this.totalTasks !== 'number' || this.totalTasks < 0) {
      errors.push('El total de tareas debe ser un número no negativo');
    }

    // Validar timeInvested
    if (typeof this.timeInvested !== 'number' || this.timeInvested < 0) {
      errors.push('El tiempo invertido debe ser un número no negativo');
    }

    // Validar mood si existe
    if (this.mood) {
      const validMoods = ['motivated', 'neutral', 'challenged', 'frustrated'];
      if (!validMoods.includes(this.mood)) {
        errors.push(`El estado de ánimo debe ser uno de: ${validMoods.join(', ')}`);
      }
    }

    // Validar notes si existe
    if (this.notes && typeof this.notes !== 'string') {
      errors.push('Las notas deben ser un string');
    }

    // Validar achievements
    if (!Array.isArray(this.achievements)) {
      errors.push('Los logros deben ser un array');
    } else {
      this.achievements.forEach((achievement, index) => {
        if (typeof achievement !== 'string') {
          errors.push(`El logro ${index + 1} debe ser un string`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos de la entrada del historial
   */
  toPlainObject() {
    const result = {
      week: this.week.trim(),
      totalCompletedTasks: this.totalCompletedTasks,
      totalTasks: this.totalTasks,
      missingTasks: this.missingTasks,
      progress: this.progress,
      date: this.date,
      timeInvested: this.timeInvested,
      achievements: this.achievements,
    };

    if (this.notes) result.notes = this.notes.trim();
    if (this.mood) result.mood = this.mood;

    return result;
  }
}
