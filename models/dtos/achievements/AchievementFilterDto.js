import { PaginationDto } from '../paginationDto.js';

/**
 * DTO para filtrar plantillas de logros
 * @class AchievementFilterDto
 * @extends PaginationDto
 * @description Define la estructura y validaciones para filtrar plantillas de logros globales
 */
export class AchievementFilterDto extends PaginationDto {
  /**
   * @param {Object} filters - Parámetros de filtro
   * @param {string} [filters.type] - Filtrar por tipo (task/goal/metric/streak)
   * @param {boolean} [filters.isActive] - Filtrar por estado activo
   * @param {string} [filters.search] - Buscar en título o descripción
   * @param {string} [filters.sortOrder] - Orden de clasificación (asc/desc)
   * @param {string} [filters.cursor] - Cursor para paginación
   * @param {number} [filters.limit] - Límite de resultados por página
   */
  constructor(filters = {}) {
    super(filters);
    this.type = filters.type;
    this.isActive = filters.isActive;
    this.search = filters.search;
    this.sortOrder = filters.sortOrder || 'desc';
  }

  /**
   * Valida que los datos del filtro sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    // Validar type si existe
    if (this.type) {
      const validTypes = ['task', 'goal', 'metric', 'streak'];
      if (!validTypes.includes(this.type)) {
        errors.push(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
      }
    }

    // Validar isActive si existe
    if (this.isActive !== undefined && typeof this.isActive !== 'boolean') {
      errors.push('isActive debe ser un valor booleano');
    }

    // Validar sortOrder
    const validSortOrders = ['asc', 'desc'];
    if (this.sortOrder && !validSortOrders.includes(this.sortOrder)) {
      errors.push(`sortOrder debe ser uno de: ${validSortOrders.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto de consulta de MongoDB
   * @returns {Object} Objeto de consulta de MongoDB
   */
  toMongoQuery() {
    const query = {};

    // Filtrar por tipo
    if (this.type) {
      query.type = this.type;
    }

    // Filtrar por estado activo
    if (this.isActive !== undefined) {
      query.isActive = this.isActive;
    }

    // Buscar en título o descripción
    if (this.search) {
      query.$or = [
        { title: { $regex: this.search, $options: 'i' } },
        { description: { $regex: this.search, $options: 'i' } },
      ];
    }

    this.applyCursorToQuery(query, this.sortOrder);

    return query;
  }

  /**
   * Convierte el DTO a un objeto de ordenamiento de MongoDB
   * Siempre ordena por createdAt con el sortOrder especificado
   * @returns {Object} Objeto de ordenamiento de MongoDB
   */
  toMongoSort() {
    const sortOrder = this.sortOrder === 'asc' ? 1 : -1;
    return { createdAt: sortOrder };
  }
}
