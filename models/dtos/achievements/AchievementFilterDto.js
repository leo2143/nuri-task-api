import { z } from 'zod';
import { PaginationDto } from '../paginationDto.js';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';
import { mergeValidations, queryBooleanField, sortOrderField, validateZod } from '../zodHelpers.js';

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
    this.isActive = ValidationHelpers.parseBoolean(filters.isActive);
    this.search = filters.search;
    this.sortOrder = filters.sortOrder || 'desc';
  }

  /**
   * Valida que los datos del filtro sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  static schema = z.object({
    type: z.enum(['task', 'goal', 'metric', 'streak'], { errorMap: () => ({ message: 'El tipo debe ser uno de: task, goal, metric, streak' }) }).optional(),
    isActive: queryBooleanField.optional(),
    search: z.string().optional(),
    sortOrder: sortOrderField.optional(),
  });

  validate() {
    return mergeValidations(
      super.validate(),
      validateZod(AchievementFilterDto.schema, {
        type: this.type || undefined,
        isActive: this.isActive === null ? 'invalid' : this.isActive,
        search: this.search,
        sortOrder: this.sortOrder,
      })
    );
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
    if (this.isActive !== undefined && this.isActive !== null) {
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
   * Ordena por `_id` (alineado al cursor). Default desc = más recientes primero.
   * @returns {{ _id: 1 | -1 }}
   */
  toMongoSort() {
    return super.toMongoSort(this.sortOrder);
  }
}
