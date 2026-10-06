import { z } from 'zod';
import { BaseValidationDto } from '../BaseValidationDto.js';
import { goalStatusField, validateZod } from '../zodHelpers.js';

/**
 * Body de PATCH /api/goals/:id/status. Reusa el enum de goalStatusField.
 */
export class UpdateGoalStatusDto extends BaseValidationDto {
  static schema = z.object({
    status: goalStatusField,
  });

  constructor(data = {}) {
    super({ status: data.status });
  }

  validate() {
    return validateZod(this.constructor.schema, { status: this.status });
  }

  toPlainObject() {
    return {
      status: this.status,
    };
  }
}
