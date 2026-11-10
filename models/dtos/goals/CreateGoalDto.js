import { z } from 'zod';
import { BaseValidationDto } from '../BaseValidationDto.js';
import {
  dueDateNotPastField,
  optionalDescriptionField,
  priorityField,
  titleField,
  validateZod,
} from '../zodHelpers.js';

/**
 * DTO para crear una nueva meta
 */
export class CreateGoalDto extends BaseValidationDto {
  /**
   * @param {string} [todayYmd] - Hoy (YYYY-MM-DD) del usuario para validar que la fecha límite no sea pasada
   */
  static buildSchema(todayYmd) {
    return z.object({
      title: titleField,
      description: optionalDescriptionField,
      reason: z
        .string({ invalid_type_error: 'La razón de importancia debe ser un string válido' })
        .max(50, 'La razón de importancia no puede superar los 50 caracteres')
        .optional(),
      priority: priorityField.optional(),
      dueDate: dueDateNotPastField({ todayYmd }),
      parentGoalId: z.string().nullable().optional(),
    });
  }

  static schema = CreateGoalDto.buildSchema();

  /**
   * @param {Object} data - Datos de la meta
   * @param {Object} [options]
   * @param {string} [options.todayYmd] - Hoy (YYYY-MM-DD) del usuario; por defecto, hoy en la zona de producto
   */
  constructor(data, { todayYmd } = {}) {
    super(data);
    this.todayYmd = todayYmd;
    this.description = data.description || '';
    this.reason = data.reason || '';
    this.status = 'active';
    this.priority = data.priority || 'medium';
    this.parentGoalId = data.parentGoalId || null;
  }

  validate() {
    return validateZod(CreateGoalDto.buildSchema(this.todayYmd), {
      title: this.title,
      description: this.description,
      reason: this.reason,
      priority: this.priority,
      dueDate: this.dueDate,
      parentGoalId: this.parentGoalId,
    });
  }

  toPlainObject() {
    const baseData = super.toPlainObject();
    return {
      ...baseData,
      description: this.description.trim(),
      reason: this.reason.trim(),
      status: this.status,
      parentGoalId: this.parentGoalId,
    };
  }
}
