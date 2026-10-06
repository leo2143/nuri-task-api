import { z } from 'zod';
import { validateZod } from '../zodHelpers.js';

const nonNegative = fieldName =>
  z
    .number({ invalid_type_error: `El campo ${fieldName} debe ser un número` })
    .min(0, `El campo ${fieldName} debe ser mayor o igual a 0`);

/**
 * DTO para crear métricas (interno al registrar)
 */
export class CreateMetricDto {
  static schema = z.object({
    userId: z
      .string({ required_error: 'El ID del usuario es requerido y debe ser un string válido' })
      .trim()
      .min(1, 'El ID del usuario es requerido y debe ser un string válido'),
    currentStreak: nonNegative('currentStreak').optional(),
    bestStreak: nonNegative('bestStreak').optional(),
    totalTasksCompleted: nonNegative('totalTasksCompleted').optional(),
    totalGoalsCompleted: nonNegative('totalGoalsCompleted').optional(),
    lastActivityDate: z.union([z.date(), z.string(), z.null()]).optional(),
    history: z
      .array(
        z.object({
          date: z.any().refine(value => value != null, 'Cada entrada del historial debe tener date y tasksCompleted'),
          tasksCompleted: z
            .number({ invalid_type_error: 'El campo tasksCompleted debe ser un número mayor o igual a 0' })
            .min(0, 'El campo tasksCompleted debe ser un número mayor o igual a 0'),
        })
      )
      .optional(),
  });

  constructor(data) {
    this.userId = data.userId;
    this.currentStreak = data.currentStreak !== undefined ? data.currentStreak : 0;
    this.bestStreak = data.bestStreak !== undefined ? data.bestStreak : 0;
    this.totalTasksCompleted = data.totalTasksCompleted !== undefined ? data.totalTasksCompleted : 0;
    this.totalGoalsCompleted = data.totalGoalsCompleted !== undefined ? data.totalGoalsCompleted : 0;
    this.lastActivityDate = data.lastActivityDate || null;
    this.history = data.history || [];
  }

  validate() {
    return validateZod(this.constructor.schema, {
      userId: this.userId,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalTasksCompleted: this.totalTasksCompleted,
      totalGoalsCompleted: this.totalGoalsCompleted,
      lastActivityDate: this.lastActivityDate,
      history: this.history,
    });
  }

  toPlainObject() {
    return {
      userId: this.userId.trim(),
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalTasksCompleted: this.totalTasksCompleted,
      totalGoalsCompleted: this.totalGoalsCompleted,
      lastActivityDate: this.lastActivityDate,
      history: this.history,
    };
  }
}
