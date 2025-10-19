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
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar título
    if (!this.title || typeof this.title !== 'string' || this.title.trim() === '') {
      errors.push('El título es requerido y debe ser un string válido');
    }

    // Validar priority
    const validPriorities = ['low', 'medium', 'high'];
    if (this.priority && !validPriorities.includes(this.priority)) {
      errors.push(`La prioridad debe ser una de: ${validPriorities.join(', ')}`);
    }

    // Validar dueDate si existe
    if (this.dueDate) {
      const date = new Date(this.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('La fecha límite debe ser una fecha válida');
      }
    }

    // Validar completed
    if (typeof this.completed !== 'boolean') {
      errors.push('El estado completado debe ser un booleano');
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
