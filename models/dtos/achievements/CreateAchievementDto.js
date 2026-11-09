import { z } from 'zod';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';
import { ACHIEVEMENT_TRIGGER_EVENTS, ACHIEVEMENT_TYPES } from '../../achievementCatalog.js';
import { imageUrlField, queryBooleanField, queryNumberField, titleField, validateZod } from '../zodHelpers.js';
import { achievementConditionsSchema, refineConditionsForTrigger } from './achievementConditionsSchema.js';

export const rewardField = z
  .string({ invalid_type_error: 'La recompensa debe ser un string válido' })
  .trim()
  .max(200, 'La recompensa no puede superar los 200 caracteres');

/**
 * DTO para crear una plantilla de logro (admin)
 */
export class CreateAchievementDto {
  static schema = refineConditionsForTrigger(
    z.object({
      title: titleField,
      description: z
        .string({ required_error: 'La descripción es requerida y debe ser un string válido' })
        .trim()
        .min(1, 'La descripción es requerida y debe ser un string válido'),
      targetCount: queryNumberField.refine(
        value => value >= 1,
        'El targetCount es requerido y debe ser un número mayor a 0'
      ),
      type: z.enum(ACHIEVEMENT_TYPES, {
        errorMap: () => ({ message: `El tipo debe ser uno de: ${ACHIEVEMENT_TYPES.join(', ')}` }),
      }),
      triggerEvent: z.enum(ACHIEVEMENT_TRIGGER_EVENTS, {
        errorMap: () => ({ message: `El triggerEvent debe ser uno de: ${ACHIEVEMENT_TRIGGER_EVENTS.join(', ')}` }),
      }),
      conditions: achievementConditionsSchema.optional(),
      reward: rewardField.optional(),
      imageUrl: imageUrlField(true, 'La URL de la imagen'),
      tier: z
        .enum(['basic', 'premium'], { errorMap: () => ({ message: 'El tier debe ser uno de: basic, premium' }) })
        .optional(),
      isActive: queryBooleanField.optional(),
    })
  );

  constructor(data) {
    this.title = data.title;
    this.description = data.description;
    this.targetCount = ValidationHelpers.parseNumber(data.targetCount);
    this.type = data.type;
    this.triggerEvent = data.triggerEvent;
    this.conditions = data.conditions;
    this.reward = data.reward;
    this.tier = data.tier || 'basic';
    this.imageUrl = data.imageUrl;
    this.isActive = data.isActive === undefined ? true : ValidationHelpers.parseBoolean(data.isActive);
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
      imageUrl: this.imageUrl,
      tier: this.tier,
      isActive: this.isActive === null ? 'invalid' : this.isActive,
    });
  }

  toPlainObject() {
    return {
      title: this.title.trim(),
      description: this.description.trim(),
      targetCount: this.targetCount,
      type: this.type,
      triggerEvent: this.triggerEvent,
      conditions: this.conditions ?? {},
      reward: this.reward?.trim() ?? '',
      tier: this.tier,
      isActive: this.isActive,
      imageUrl: this.imageUrl,
    };
  }
}
