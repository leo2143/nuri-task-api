import { z } from 'zod';
import { objectIdField, validateZod } from '../zodHelpers.js';

/**
 * Body de POST /api/admin/demo/seed-clock.
 */
export class DemoSeedClockDto {
  static schema = z.object({
    userId: objectIdField,
  });

  constructor(data = {}) {
    this.userId = data.userId;
  }

  validate() {
    return validateZod(this.constructor.schema, { userId: this.userId });
  }

  toPlainObject() {
    return { userId: this.userId };
  }
}
