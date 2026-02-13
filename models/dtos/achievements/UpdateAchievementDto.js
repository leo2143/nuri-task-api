import { CreateAchievementDto } from './CreateAchievementDto.js';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';

/**
 * DTO para actualizar una plantilla de logro existente (Solo administradores)
 * @class UpdateAchievementDto
 * @extends CreateAchievementDto
 * @description Define la estructura y validaciones para actualizar una plantilla de logro global
 * Hereda las validaciones de CreateAchievementDto pero todos los campos son opcionales
 */
export class UpdateAchievementDto extends CreateAchievementDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.title] - Título del logro
   * @param {string} [data.description] - Descripción del logro
   * @param {number} [data.targetCount] - Cantidad objetivo para completar
   * @param {string} [data.type] - Tipo de logro: task/goal/metric/streak
   * @param {string} [data.reward] - Recompensa del logro
   * @param {boolean} [data.isActive] - Si el logro está activo
   * @param {string} [data.imageUrl] - URL de la imagen del logro
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({});

    // Solo incluir campos que estén presentes en data
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.targetCount !== undefined) this.targetCount = data.targetCount;
    if (data.type !== undefined) this.type = data.type;
    if (data.reward !== undefined) this.reward = data.reward;
    if (data.isActive !== undefined) this.isActive = data.isActive;
    if (data.imageUrl !== undefined) this.imageUrl = data.imageUrl;
  }

  /**
   * Valida imageUrl (opcional en update)
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateImageUrl() {
    if (this.imageUrl === undefined) return null;
    return ValidationHelpers.validateImageUrl(this.imageUrl, false, 'La URL de la imagen');
  }

  /**
   * Valida que los datos del DTO sean correctos
   * Reutiliza los métodos de validación del padre
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Reutilizar métodos de validación del padre (sin requerir campos)
    const titleError = this._validateTitle(false);
    if (titleError) errors.push(titleError);

    const descriptionError = this._validateDescription(false);
    if (descriptionError) errors.push(descriptionError);

    const targetCountError = this._validateTargetCount(false);
    if (targetCountError) errors.push(targetCountError);

    const typeError = this._validateType(false);
    if (typeError) errors.push(typeError);

    const isActiveError = this._validateIsActive();
    if (isActiveError) errors.push(isActiveError);

    const imageUrlError = this._validateImageUrl();
    if (imageUrlError) errors.push(imageUrlError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos a actualizar
   */
  toPlainObject() {
    const result = {};

    if (this.title !== undefined) result.title = this.title.trim();
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.targetCount !== undefined) result.targetCount = this.targetCount;
    if (this.type !== undefined) result.type = this.type;
    if (this.reward !== undefined) result.reward = this.reward.trim();
    if (this.isActive !== undefined) result.isActive = this.isActive;
    if (this.imageUrl !== undefined) result.imageUrl = this.imageUrl;

    return result;
  }
}
