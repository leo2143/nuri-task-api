import { CreateMetricDto } from './CreateMetricDto.js';

/**
 * DTO para actualizar métricas generales del usuario
 * @class UpdateMetricDto
 * @extends CreateMetricDto
 * @description Define la estructura y validaciones para actualizar Metrics
 * ⚠️ NOTA: Las métricas se actualizan automáticamente al completar tareas.
 * Este DTO se usa principalmente para ajustes manuales o correcciones.
 */
export class UpdateMetricDto extends CreateMetricDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {number} [data.currentStreak] - Nueva racha actual
   * @param {number} [data.bestStreak] - Nueva mejor racha
   * @param {number} [data.totalTasksCompleted] - Nuevo total de tareas completadas
   * @param {number} [data.totalGoalsCompleted] - Nuevo total de metas completadas
   * @param {Date|string} [data.lastActivityDate] - Nueva fecha de última actividad
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({ userId: '' });

    // Solo asignar los campos que se están actualizando
    if (data.currentStreak !== undefined) this.currentStreak = data.currentStreak;
    if (data.bestStreak !== undefined) this.bestStreak = data.bestStreak;
    if (data.totalTasksCompleted !== undefined) this.totalTasksCompleted = data.totalTasksCompleted;
    if (data.totalGoalsCompleted !== undefined) this.totalGoalsCompleted = data.totalGoalsCompleted;
    if (data.lastActivityDate !== undefined) this.lastActivityDate = data.lastActivityDate;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * Reutiliza los métodos de validación del padre (todos opcionales en update)
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Reutilizar métodos de validación del padre (todos opcionales en update)
    const streakError = this._validatePositiveNumber('currentStreak', this.currentStreak);
    if (streakError) errors.push(streakError);

    const bestStreakError = this._validatePositiveNumber('bestStreak', this.bestStreak);
    if (bestStreakError) errors.push(bestStreakError);

    const tasksError = this._validatePositiveNumber('totalTasksCompleted', this.totalTasksCompleted);
    if (tasksError) errors.push(tasksError);

    const goalsError = this._validatePositiveNumber('totalGoalsCompleted', this.totalGoalsCompleted);
    if (goalsError) errors.push(goalsError);

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

    if (this.currentStreak !== undefined) result.currentStreak = this.currentStreak;
    if (this.bestStreak !== undefined) result.bestStreak = this.bestStreak;
    if (this.totalTasksCompleted !== undefined) result.totalTasksCompleted = this.totalTasksCompleted;
    if (this.totalGoalsCompleted !== undefined) result.totalGoalsCompleted = this.totalGoalsCompleted;
    if (this.lastActivityDate !== undefined) result.lastActivityDate = this.lastActivityDate;

    return result;
  }
}
