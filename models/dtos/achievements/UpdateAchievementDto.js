import { z } from 'zod';
import { CreateAchievementDto } from './CreateAchievementDto.js';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';
import { imageUrlField, optionalTitleField, queryBooleanField, queryNumberField, validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar una plantilla de logro (admin)
 */
export class UpdateAchievementDto extends CreateAchievementDto {
  static schema = z.object({
    title: optionalTitleField,
    description: z.string().trim().min(1, 'La descripción debe ser un string válido').optional(),
    targetCount: queryNumberField.refine(value => value >= 1, 'El targetCount debe ser un número mayor a 0').optional(),
    type: z.enum(['task', 'goal', 'metric', 'streak']).optional(),
    triggerEvent: z.enum(['task:completed', 'goal:completed', 'streak:updated']).optional(),
    tier: z.enum(['basic', 'premium']).optional(),
    isActive: queryBooleanField.optional(),
    imageUrl: imageUrlField(false, 'La URL de la imagen').optional(),
  });

  constructor(data) {
    super({});
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.targetCount !== undefined) this.targetCount = ValidationHelpers.parseNumber(data.targetCount);
    if (data.type !== undefined) this.type = data.type;
    if (data.triggerEvent !== undefined) this.triggerEvent = data.triggerEvent;
    if (data.tier !== undefined) this.tier = data.tier;
    if (data.isActive !== undefined) this.isActive = ValidationHelpers.parseBoolean(data.isActive);
    if (data.imageUrl !== undefined) this.imageUrl = data.imageUrl;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      title: this.title,
      description: this.description,
      targetCount: this.targetCount,
      type: this.type,
      triggerEvent: this.triggerEvent,
      tier: this.tier,
      isActive: this.isActive === null ? 'invalid' : this.isActive,
      imageUrl: this.imageUrl,
    });
  }

  toPlainObject() {
    const result = {};

    if (this.title !== undefined) result.title = this.title.trim();
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.targetCount !== undefined) result.targetCount = this.targetCount;
    if (this.type !== undefined) result.type = this.type;
    if (this.triggerEvent !== undefined) result.triggerEvent = this.triggerEvent;
    if (this.tier !== undefined) result.tier = this.tier;
    if (this.isActive !== undefined) result.isActive = this.isActive;
    if (this.imageUrl !== undefined) result.imageUrl = this.imageUrl;

    return result;
  }
}
