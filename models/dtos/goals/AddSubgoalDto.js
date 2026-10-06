import { z } from 'zod';
import { objectIdField, validateZod } from '../zodHelpers.js';

/**
 * Body de PATCH /api/goals/:id/subgoals.
 */
export class AddSubgoalDto {
  static schema = z.object({
    subgoalId: objectIdField,
  });

  constructor(data = {}) {
    this.subgoalId = data.subgoalId;
  }

  validate() {
    return validateZod(this.constructor.schema, { subgoalId: this.subgoalId });
  }

  toPlainObject() {
    return {
      subgoalId: String(this.subgoalId).trim(),
    };
  }
}
