import { BaseValidationDto } from '../BaseValidationDto.js';

/**
 * DTO para crear una nueva tarea
 * @class CreateTodoDto
 * @extends BaseValidationDto
 * @description Define la estructura y validaciones para crear una tarea
 */
export class CreateTodoDto extends BaseValidationDto {
  /**
   * @param {Object} data - Datos de la tarea
   * @param {string} data.title - Título de la tarea (requerido)
   * @param {string} [data.description] - Descripción de la tarea
   * @param {string} [data.priority] - Prioridad (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite
   * @param {boolean} [data.completed=false] - Estado de completado
   * @param {string} [data.GoalId] - ID de la meta asociada
   */
  constructor(data) {
    super(data);
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.completed = data.completed !== undefined ? data.completed : false;
    this.GoalId = data.GoalId || null;
  }

  /**
   * Valida el estado completado
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateCompleted() {
    if (this.completed === undefined) return null;

    if (typeof this.completed !== 'boolean') {
      return 'El estado completado debe ser un booleano';
    }

    return null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    // Validar título (requerido en este DTO)
    const titleError = this._validateTitle(true);
    if (titleError) errors.push(titleError);

    const completedError = this._validateCompleted();
    if (completedError) errors.push(completedError);

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
    const baseData = super.toPlainObject();
    const result = {
      ...baseData,
      description: this.description.trim(),
      completed: this.completed,
    };

    if (this.GoalId) {
      result.GoalId = this.GoalId;
    }

    return result;
  }
}
