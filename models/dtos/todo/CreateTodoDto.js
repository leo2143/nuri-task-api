/**
 * DTO para crear una nueva tarea
 * @class CreateTodoDto
 * @description Define la estructura y validaciones para crear una tarea
 */
export class CreateTodoDto {
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
    this.title = data.title;
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.dueDate = data.dueDate || null;
    this.completed = data.completed !== undefined ? data.completed : false;
    this.GoalId = data.GoalId || null;
  }

  /**
   * Valida el título
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateTitle(required = true) {
    if (this.title === undefined) return null;

    if (required && (!this.title || typeof this.title !== 'string' || this.title.trim() === '')) {
      return 'El título es requerido y debe ser un string válido';
    }

    if (!required && this.title !== undefined) {
      if (typeof this.title !== 'string' || this.title.trim() === '') {
        return 'El título debe ser un string válido';
      }
    }

    return null;
  }

  /**
   * Valida la prioridad
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validatePriority() {
    if (this.priority === undefined) return null;

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(this.priority)) {
      return `La prioridad debe ser una de: ${validPriorities.join(', ')}`;
    }

    return null;
  }

  /**
   * Valida la fecha límite
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateDueDate() {
    if (this.dueDate === undefined || this.dueDate === null) return null;

    const date = new Date(this.dueDate);
    if (isNaN(date.getTime())) {
      return 'La fecha límite debe ser una fecha válida';
    }

    return null;
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
    const errors = [];

    // Usar métodos reutilizables
    const titleError = this._validateTitle(true);
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
   * @returns {Object} Objeto plano con los datos
   */
  toPlainObject() {
    const result = {
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      dueDate: this.dueDate,
      completed: this.completed,
    };

    if (this.GoalId) {
      result.GoalId = this.GoalId;
    }

    return result;
  }
}
