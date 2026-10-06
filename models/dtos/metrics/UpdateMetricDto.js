import { z } from 'zod';
import { CreateMetricDto } from './CreateMetricDto.js';
import { validateZod } from '../zodHelpers.js';

const optionalNonNegative = fieldName =>
  z
    .number({ invalid_type_error: `El campo ${fieldName} debe ser un número` })
    .min(0, `El campo ${fieldName} debe ser mayor o igual a 0`)
    .optional();

/**
 * DTO para actualizar métricas (no exportado; create interno usa CreateMetricDto)
 */
export class UpdateMetricDto extends CreateMetricDto {
  static schema = z.object({
    currentStreak: optionalNonNegative('currentStreak'),
    bestStreak: optionalNonNegative('bestStreak'),
    totalTasksCompleted: optionalNonNegative('totalTasksCompleted'),
    totalGoalsCompleted: optionalNonNegative('totalGoalsCompleted'),
    lastActivityDate: z.union([z.date(), z.string()]).optional(),
  });

  constructor(data) {
    super({ userId: '' });
    if (data.currentStreak !== undefined) this.currentStreak = data.currentStreak;
    if (data.bestStreak !== undefined) this.bestStreak = data.bestStreak;
    if (data.totalTasksCompleted !== undefined) this.totalTasksCompleted = data.totalTasksCompleted;
    if (data.totalGoalsCompleted !== undefined) this.totalGoalsCompleted = data.totalGoalsCompleted;
    if (data.lastActivityDate !== undefined) this.lastActivityDate = data.lastActivityDate;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalTasksCompleted: this.totalTasksCompleted,
      totalGoalsCompleted: this.totalGoalsCompleted,
      lastActivityDate: this.lastActivityDate,
    });
  }

  toPlainObject() {
    const result = {};

    if (this.currentStreak !== undefined) result.currentStreak = this.currentStreak;
    if (this.bestStreak !== undefined) result.bestStreak = this.bestStreak;
    if (this.totalTasksCompleted !== undefined) result.totalTasksCompleted = this.totalTasksCompleted;
    if (this.totalGoalsCompleted !== undefined) result.totalGoalsCompleted = this.totalGoalsCompleted;
    if (this.lastActivityDate !== undefined) result.lastActivityDate = this.lastActivityDate;

    return result;
  }
}
