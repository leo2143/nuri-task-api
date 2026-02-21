import { BaseValidationDto } from '../BaseValidationDto.js';

/**
 * DTO para crear una nueva meta
 * @class CreateGoalDto
 * @extends BaseValidationDto
 * @description Define la estructura y validaciones para crear una meta
 */
export class CreateGoalDto extends BaseValidationDto {
  /**
   * @param {Object} data - Datos de la meta
   * @param {string} data.title - Título de la meta (requerido, máximo 50 caracteres)
   * @param {string} [data.description] - Descripción de la meta (opcional, máximo 100 caracteres)
   * @param {string} [data.reason] - Razón de importancia de la meta (opcional, máximo 50 caracteres)
   * @param {string} [data.priority] - Prioridad de la meta (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite de la meta
   * @param {string} [data.parentGoalId] - ID de la meta padre (para submetas)
   */
  constructor(data) {
    super(data);
    this.description = data.description || '';
    this.reason = data.reason || '';
    this.status = 'active';
    this.priority = data.priority || 'medium';
    this.parentGoalId = data.parentGoalId || null;
  }

  /**
   * Valida la razón de importancia
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateReason() {
    if (this.reason === undefined || this.reason === null) return null;

    if (typeof this.reason !== 'string') {
      return 'La razón de importancia debe ser un string válido';
    }

    const trimmedReason = this.reason.trim();
    if (trimmedReason && trimmedReason.length > 50) {
      return 'La razón de importancia no puede superar los 50 caracteres';
    }

    return null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    // Validar título (requerido en este DTO)
    const titleError = this._validateTitle(true);
    if (titleError) errors.push(titleError);

    // Validar descripción
    const descriptionError = this._validateDescription(false);
    if (descriptionError) errors.push(descriptionError);

    // Validar razón de importancia
    const reasonError = this._validateReason();
    if (reasonError) errors.push(reasonError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos
   */
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
