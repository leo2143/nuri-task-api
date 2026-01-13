import { PaginationDto } from '../paginationDto.js';

/**
 * DTO para filtrar usuarios
 * @class UserFilterDto
 * @extends PaginationDto
 * @description Define la estructura y validaciones para filtrar usuarios
 */
export class UserFilterDto extends PaginationDto {
  /**
   * @param {Object} data - Filtros de búsqueda
   * @param {string} [data.search] - Término de búsqueda para nombre o email
   * @param {boolean} [data.isAdmin] - Filtrar por administradores
   * @param {boolean} [data.isSubscribed] - Filtrar por usuarios con suscripción activa
   * @param {Date|string} [data.createdFrom] - Usuario creado desde
   * @param {Date|string} [data.createdTo] - Usuario creado hasta
   * @param {string} [data.sortBy] - Campo por el cual ordenar
   * @param {string} [data.sortOrder] - Orden de clasificación (asc/desc)
   * @param {string} [data.cursor] - Cursor para paginación
   * @param {number} [data.limit] - Límite de resultados por página
   */
  constructor(data) {
    super(data);
    if (data.search !== undefined) this.search = data.search;
    if (data.isAdmin !== undefined) this.isAdmin = data.isAdmin;
    if (data.isSubscribed !== undefined) this.isSubscribed = data.isSubscribed;
    if (data.createdFrom !== undefined) this.createdFrom = data.createdFrom;
    if (data.createdTo !== undefined) this.createdTo = data.createdTo;
    this.sortBy = data.sortBy || 'createdAt';
    this.sortOrder = data.sortOrder || 'desc';
  }

  /**
   * Valida que los filtros sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    if (this.isAdmin !== undefined) {
      if (typeof this.isAdmin === 'string') {
        if (this.isAdmin !== 'true' && this.isAdmin !== 'false') {
          errors.push('El filtro isAdmin debe ser "true" o "false"');
        }
      } else if (typeof this.isAdmin !== 'boolean') {
        errors.push('El filtro isAdmin debe ser un booleano o string "true"/"false"');
      }
    }

    if (this.isSubscribed !== undefined) {
      if (typeof this.isSubscribed === 'string') {
        if (this.isSubscribed !== 'true' && this.isSubscribed !== 'false') {
          errors.push('El filtro isSubscribed debe ser "true" o "false"');
        }
      } else if (typeof this.isSubscribed !== 'boolean') {
        errors.push('El filtro isSubscribed debe ser un booleano o string "true"/"false"');
      }
    }

    if (this.createdFrom !== undefined) {
      const date = new Date(this.createdFrom);
      if (isNaN(date.getTime())) {
        errors.push('La fecha desde debe ser una fecha válida');
      }
    }

    if (this.createdTo !== undefined) {
      const date = new Date(this.createdTo);
      if (isNaN(date.getTime())) {
        errors.push('La fecha hasta debe ser una fecha válida');
      }
    }

    const validSortBy = ['createdAt', 'updatedAt', 'name', 'email'];
    if (this.sortBy && !validSortBy.includes(this.sortBy)) {
      errors.push(`El campo de ordenamiento debe ser uno de: ${validSortBy.join(', ')}`);
    }

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
      query.$or = [
        { name: { $regex: this.search.trim(), $options: 'i' } },
        { email: { $regex: this.search.trim(), $options: 'i' } },
      ];
    }

    if (this.isAdmin !== undefined) {
      query.isAdmin = this.isAdmin === 'true' || this.isAdmin === true;
    }

    if (this.isSubscribed !== undefined) {
      const isSubscribed = this.isSubscribed === 'true' || this.isSubscribed === true;
      query['subscription.isActive'] = isSubscribed;
    }

    if (this.createdFrom !== undefined || this.createdTo !== undefined) {
      query.createdAt = {};
      if (this.createdFrom !== undefined) {
        query.createdAt.$gte = new Date(this.createdFrom);
      }
      if (this.createdTo !== undefined) {
        query.createdAt.$lte = new Date(this.createdTo);
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
