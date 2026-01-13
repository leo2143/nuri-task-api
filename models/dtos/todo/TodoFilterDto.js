import { PaginationDto } from '../paginationDto.js';

/**
 * DTO para filtrar tareas
 * @class TodoFilterDto
 * @description Define la estructura y validaciones para filtrar tareas
 */
export class TodoFilterDto extends PaginationDto {
  /**
   * @param {Object} data - Filtros de búsqueda
   * @param {string} [data.search] - Término de búsqueda para título
   * @param {boolean} [data.completed] - Filtrar por estado completado
   * @param {string} [data.priority] - Prioridad (low/medium/high)
   * @param {string} [data.GoalId] - Filtrar por meta específica
   * @param {Date|string} [data.dueDateFrom] - Fecha límite desde
   * @param {Date|string} [data.dueDateTo] - Fecha límite hasta
   * @param {string} [data.sortBy] - Campo por el cual ordenar
   * @param {string} [data.sortOrder] - Orden de clasificación (asc/desc)
   */
  constructor(data) {
    super(data);
    if (data.search !== undefined) this.search = data.search;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.GoalId !== undefined) this.GoalId = data.GoalId;
    if (data.dueDateFrom !== undefined) this.dueDateFrom = data.dueDateFrom;
    if (data.dueDateTo !== undefined) this.dueDateTo = data.dueDateTo;
    this.sortBy = data.sortBy || 'createdAt';
    this.sortOrder = data.sortOrder || 'desc';
  }

  /**
   * Valida que los filtros sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors]; // Incluye errores del padre
    // Validar completed si existe
    if (this.completed !== undefined) {
      // Puede venir como string desde query params
      if (typeof this.completed === 'string') {
        if (this.completed !== 'true' && this.completed !== 'false') {
          errors.push('El filtro completado debe ser "true" o "false"');
        }
      } else if (typeof this.completed !== 'boolean') {
        errors.push('El filtro completado debe ser un booleano o string "true"/"false"');
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
    const validSortBy = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'completed'];
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

    if (this.search !== undefined && this.search.trim() !== '') {
      query.title = { $regex: this.search.trim(), $options: 'i' };
    }

    if (this.completed !== undefined) {
      // Convertir a booleano si viene como string
      query.completed = this.completed === 'true' || this.completed === true;
    }

    if (this.priority !== undefined) {
      query.priority = this.priority;
    }

    if (this.GoalId !== undefined) {
      query.GoalId = this.GoalId;
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
    this.applyCursorToQuery(query);

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
