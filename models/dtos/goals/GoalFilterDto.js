/**
 * DTO para filtrar metas
 * @class GoalFilterDto
 * @description Define la estructura y validaciones para filtrar metas
 */
export class GoalFilterDto {
  /**
   * @param {Object} data - Filtros de búsqueda
   * @param {string} [data.status] - Estado de la meta (active/paused/completed)
   * @param {string} [data.priority] - Prioridad de la meta (low/medium/high)
   * @param {string} [data.search] - Término de búsqueda para título o descripción
   * @param {Date|string} [data.dueDateFrom] - Fecha límite desde
   * @param {Date|string} [data.dueDateTo] - Fecha límite hasta
   * @param {string} [data.sortBy] - Campo por el cual ordenar (createdAt, dueDate, priority)
   * @param {string} [data.sortOrder] - Orden de clasificación (asc/desc)
   */
  constructor(data) {
    if (data.status !== undefined) this.status = data.status;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.search !== undefined) this.search = data.search;
    if (data.dueDateFrom !== undefined) this.dueDateFrom = data.dueDateFrom;
    if (data.dueDateTo !== undefined) this.dueDateTo = data.dueDateTo;
    this.sortBy = data.sortBy || 'createdAt';
    this.sortOrder = data.sortOrder || 'desc';
    if (data.parentGoalId !== undefined) this.parentGoalId = data.parentGoalId;
  }

  /**
   * Valida que los filtros sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar status si existe
    if (this.status !== undefined) {
      const validStatuses = ['active', 'paused', 'completed'];
      if (!validStatuses.includes(this.status)) {
        errors.push(`El estado debe ser uno de: ${validStatuses.join(', ')}`);
      }
    }

    // Validar priority si existe
    if (this.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(this.priority)) {
        errors.push(`La prioridad debe ser una de: ${validPriorities.join(', ')}`);
      }
    }

    // Validar dueDateFrom si existe
    if (this.dueDateFrom !== undefined) {
      const date = new Date(this.dueDateFrom);
      if (isNaN(date.getTime())) {
        errors.push('La fecha desde debe ser una fecha válida');
      }
    }

    // Validar dueDateTo si existe
    if (this.dueDateTo !== undefined) {
      const date = new Date(this.dueDateTo);
      if (isNaN(date.getTime())) {
        errors.push('La fecha hasta debe ser una fecha válida');
      }
    }

    // Validar sortBy
    const validSortBy = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
    if (this.sortBy && !validSortBy.includes(this.sortBy)) {
      errors.push(`El campo de ordenamiento debe ser uno de: ${validSortBy.join(', ')}`);
    }

    // Validar sortOrder
    const validSortOrder = ['asc', 'desc'];
    if (this.sortOrder && !validSortOrder.includes(this.sortOrder)) {
      errors.push(`El orden debe ser uno de: ${validSortOrder.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Construye el query object para MongoDB
   * @returns {Object} Query object para MongoDB
   */
  toMongoQuery() {
    const query = {};

    if (this.status !== undefined) {
      query.status = this.status;
    }

    if (this.priority !== undefined) {
      query.priority = this.priority;
    }

    if (this.search !== undefined && this.search.trim() !== '') {
      query.$or = [
        { title: { $regex: this.search.trim(), $options: 'i' } },
        { description: { $regex: this.search.trim(), $options: 'i' } },
      ];
    }

    if (this.dueDateFrom !== undefined || this.dueDateTo !== undefined) {
      query.dueDate = {};
      if (this.dueDateFrom !== undefined) {
        query.dueDate.$gte = new Date(this.dueDateFrom);
      }
      if (this.dueDateTo !== undefined) {
        query.dueDate.$lte = new Date(this.dueDateTo);
      }
    }

    if (this.parentGoalId !== undefined) {
      query.parentGoalId = this.parentGoalId;
    }

    return query;
  }

  /**
   * Obtiene el objeto de ordenamiento para MongoDB
   * @returns {Object} Sort object para MongoDB
   */
  toMongoSort() {
    const sortOrder = this.sortOrder === 'asc' ? 1 : -1;
    return { [this.sortBy]: sortOrder };
  }
}
