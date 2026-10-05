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
  static schema = z.object({
    title: titleField,
    description: optionalDescriptionField,
    reason: z
      .string({ invalid_type_error: 'La razón de importancia debe ser un string válido' })
      .max(50, 'La razón de importancia no puede superar los 50 caracteres')
      .optional(),
    priority: priorityField.optional(),
    dueDate: dueDateNotPastField(),
    parentGoalId: z.string().nullable().optional(),
  });

  constructor(data) {
    super(data);
    this.description = data.description || '';
    this.reason = data.reason || '';
    this.status = 'active';
    this.priority = data.priority || 'medium';
    this.parentGoalId = data.parentGoalId || null;
  }

  validate() {
    return validateZod(this.constructor.schema, {
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
