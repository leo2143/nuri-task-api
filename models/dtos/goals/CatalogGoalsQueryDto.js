import { z } from 'zod';
import { objectIdField, queryBooleanField, toQueryBoolean, validateZod } from '../zodHelpers.js';

/**
 * Query params de GET /api/goals/catalogs.
 * @class CatalogGoalsQueryDto
 */
export class CatalogGoalsQueryDto {
  static schema = z.object({
    excludeCompleted: queryBooleanField.optional(),
    excludeRelatedTo: objectIdField.optional(),
  });

  /**
   * @param {Object} [data={}] - Query string
   * @param {string} [data.excludeCompleted] - 'true' | 'false'; con 'true' se omiten las metas completadas
   * @param {string} [data.excludeRelatedTo] - ID de una meta; se omiten ella, sus ancestros y sus descendientes
   */
  constructor(data = {}) {
    this.excludeCompleted = data.excludeCompleted;
    this.excludeRelatedTo = data.excludeRelatedTo;
  }

  validate() {
    return validateZod(CatalogGoalsQueryDto.schema, {
      excludeCompleted: this.excludeCompleted,
      excludeRelatedTo: this.excludeRelatedTo,
    });
  }

  toPlainObject() {
    return {
      excludeCompleted: toQueryBoolean(this.excludeCompleted),
      excludeRelatedTo: this.excludeRelatedTo ?? null,
    };
  }
}
