import { z } from 'zod';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';
import { ACHIEVEMENT_TRIGGER_EVENTS, ACHIEVEMENT_TYPES } from '../../achievementCatalog.js';
import { imageUrlField, optionalTitleField, queryBooleanField, queryNumberField, validateZod } from '../zodHelpers.js';
import { achievementConditionsSchema, refineConditionsForTrigger } from './achievementConditionsSchema.js';
import { rewardField } from './CreateAchievementDto.js';

const TIER_IMMUTABLE_MESSAGE = 'El tier de un logro no se puede cambiar. Desactivalo y creá uno nuevo.';

/**
 * DTO para actualizar una plantilla de logro (admin).
 * Solo lleva los campos que llegaron: no hereda los valores por defecto de la creación, que pisarían `tier` e `isActive`.
 * El tier es inmutable: cualquier valor de `tier` se rechaza.
 */
export class UpdateAchievementDto {
  static schema = refineConditionsForTrigger(
    z.object({
      title: optionalTitleField,
      description: z.string().trim().min(1, 'La descripción debe ser un string válido').optional(),
      targetCount: queryNumberField
        .refine(value => value >= 1, 'El targetCount debe ser un número mayor a 0')
        .optional(),
      type: z.enum(ACHIEVEMENT_TYPES).optional(),
      triggerEvent: z.enum(ACHIEVEMENT_TRIGGER_EVENTS).optional(),
      conditions: achievementConditionsSchema.optional(),
      reward: rewardField.optional(),
      tier: z.undefined({ errorMap: () => ({ message: TIER_IMMUTABLE_MESSAGE }) }),
      isActive: queryBooleanField.optional(),
      imageUrl: imageUrlField(false, 'La URL de la imagen').optional(),
    })
  );

  constructor(data) {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.targetCount !== undefined) this.targetCount = ValidationHelpers.parseNumber(data.targetCount);
    if (data.type !== undefined) this.type = data.type;
    if (data.triggerEvent !== undefined) this.triggerEvent = data.triggerEvent;
    if (data.conditions !== undefined) this.conditions = data.conditions;
    if (data.reward !== undefined) this.reward = data.reward;
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
      conditions: this.conditions,
      reward: this.reward,
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
    if (this.conditions !== undefined) result.conditions = this.conditions;
    if (this.reward !== undefined) result.reward = this.reward.trim();
    if (this.isActive !== undefined) result.isActive = this.isActive;
    if (this.imageUrl !== undefined) result.imageUrl = this.imageUrl;

    return result;
  }
}
