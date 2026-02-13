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
   * @param {string} data.title - Título de la meta (requerido)
   * @param {string} [data.description] - Descripción de la meta
   * @param {string} [data.status] - Estado de la meta (active/paused/completed)
   * @param {string} [data.priority] - Prioridad de la meta (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite de la meta
   * @param {Object} data.smart - Criterios SMART (requerido)
   * @param {string} data.smart.specific - Criterio específico (requerido)
   * @param {string} data.smart.measurable - Criterio medible (requerido)
   * @param {string} data.smart.achievable - Criterio alcanzable (requerido)
   * @param {string} data.smart.relevant - Criterio relevante (requerido)
   * @param {string} data.smart.timeBound - Criterio con tiempo límite (requerido)
   * @param {Array} [data.comments] - Comentarios iniciales
   */
  constructor(data) {
    super(data);
    this.description = data.description || '';
    this.status = data.status || 'active';
    this.priority = data.priority || 'medium';
    this.smart = data.smart;
    this.comments = data.comments || [];
    this.parentGoalId = data.parentGoalId || null;
  }

  /**
   * Valida los criterios SMART
   * @param {boolean} required - Si el campo es requerido
   * @returns {string[]} Array de mensajes de error
   */
  _validateSmart(required = true) {
    const errors = [];

    if (!this.smart) {
      if (required) {
        errors.push('Los criterios SMART son requeridos');
      }
      return errors;
    }

    if (typeof this.smart !== 'object') {
      errors.push('Los criterios SMART son requeridos');
      return errors;
    }

    const smartFields = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'];
    smartFields.forEach(field => {
      if (this.smart[field] !== undefined) {
        if (typeof this.smart[field] !== 'string' || this.smart[field].trim() === '') {
          errors.push(`El criterio SMART '${field}' debe ser un string válido`);
        }
      } else if (required) {
        errors.push(`El criterio SMART '${field}' es requerido y debe ser un string válido`);
      }
    });

    return errors;
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

    // Validar smart (requerido)
    const smartErrors = this._validateSmart(true);
    errors.push(...smartErrors);

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
      smart: {
        specific: this.smart.specific.trim(),
        measurable: this.smart.measurable.trim(),
        achievable: this.smart.achievable.trim(),
        relevant: this.smart.relevant.trim(),
        timeBound: this.smart.timeBound.trim(),
      },
      comments: this.comments,
      parentGoalId: this.parentGoalId,
    };
  }
}
