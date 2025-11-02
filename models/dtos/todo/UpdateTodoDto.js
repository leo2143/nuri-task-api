import { CreateTodoDto } from './CreateTodoDto.js';

/**
 * DTO para actualizar una tarea existente
 * @class UpdateTodoDto
 * @extends CreateTodoDto
 * @description Define la estructura y validaciones para actualizar una tarea
 * Hereda las validaciones de CreateTodoDto pero todos los campos son opcionales
 */
export class UpdateTodoDto extends CreateTodoDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.title] - Título de la tarea
   * @param {string} [data.description] - Descripción de la tarea
   * @param {string} [data.priority] - Prioridad (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite
   * @param {boolean} [data.completed] - Estado de completado
   * @param {string} [data.GoalId] - ID de la meta asociada
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({});

    // Solo asignamos propiedades que están presentes
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.GoalId !== undefined) this.GoalId = data.GoalId;
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

    const priorityError = this._validatePriority();
    if (priorityError) errors.push(priorityError);

    const dueDateError = this._validateDueDate();
    if (dueDateError) errors.push(dueDateError);

    const completedError = this._validateCompleted();
    if (completedError) errors.push(completedError);

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
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.completed !== undefined) result.completed = this.completed;
    if (this.GoalId !== undefined) result.GoalId = this.GoalId;

    return result;
  }
}
