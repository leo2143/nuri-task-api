/**
 * DTO para actualizar una tarea existente
 * @class UpdateTodoDto
 * @description Define la estructura y validaciones para actualizar una tarea
 */
export class UpdateTodoDto {
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
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.GoalId !== undefined) this.GoalId = data.GoalId;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar título si existe
    if (this.title !== undefined) {
      if (typeof this.title !== 'string' || this.title.trim() === '') {
        errors.push('El título debe ser un string válido');
      }
    }

    // Validar priority si existe
    if (this.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(this.priority)) {
        errors.push(`La prioridad debe ser una de: ${validPriorities.join(', ')}`);
      }
    }

    // Validar dueDate si existe
    if (this.dueDate !== undefined && this.dueDate !== null) {
      const date = new Date(this.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('La fecha límite debe ser una fecha válida');
      }
    }

    // Validar completed si existe
    if (this.completed !== undefined) {
      if (typeof this.completed !== 'boolean') {
        errors.push('El estado completado debe ser un booleano');
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
