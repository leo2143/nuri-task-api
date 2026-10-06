import { z } from 'zod';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';
import { imageUrlField, queryBooleanField, queryNumberField, titleField, validateZod } from '../zodHelpers.js';

/**
 * DTO para crear una plantilla de logro (admin)
 */
export class CreateAchievementDto {
  static schema = z.object({
    title: titleField,
    description: z
      .string({ required_error: 'La descripción es requerida y debe ser un string válido' })
      .trim()
      .min(1, 'La descripción es requerida y debe ser un string válido'),
    targetCount: queryNumberField.refine(value => value >= 1, 'El targetCount es requerido y debe ser un número mayor a 0'),
    type: z.enum(['task', 'goal', 'metric', 'streak'], {
      errorMap: () => ({ message: 'El tipo debe ser uno de: task, goal, metric, streak' }),
    }),
    triggerEvent: z.enum(['task:completed', 'goal:completed', 'streak:updated'], {
      errorMap: () => ({ message: 'El triggerEvent debe ser uno de: task:completed, goal:completed, streak:updated' }),
    }),
    imageUrl: imageUrlField(true, 'La URL de la imagen'),
    tier: z.enum(['basic', 'premium'], { errorMap: () => ({ message: 'El tier debe ser uno de: basic, premium' }) }).optional(),
    isActive: queryBooleanField.optional(),
  });

  constructor(data) {
    this.title = data.title;
    this.description = data.description;
    this.targetCount = ValidationHelpers.parseNumber(data.targetCount);
    this.type = data.type;
    this.triggerEvent = data.triggerEvent;
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
      tier: this.tier,
      isActive: this.isActive,
      imageUrl: this.imageUrl,
    };
  }
}
