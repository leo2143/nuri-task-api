import { CreateGoalDto } from './CreateGoalDto.js';

/**
 * DTO para actualizar una meta existente
 * @class UpdateGoalDto
 * @extends CreateGoalDto
 * @description Define la estructura y validaciones para actualizar una meta
 * Hereda las validaciones de CreateGoalDto pero todos los campos son opcionales
 */
export class UpdateGoalDto extends CreateGoalDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.title] - Título de la meta
   * @param {string} [data.description] - Descripción de la meta
   * @param {string} [data.status] - Estado de la meta (active/paused/completed)
   * @param {string} [data.priority] - Prioridad de la meta (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite de la meta
   * @param {Object} [data.smart] - Criterios SMART
   * @param {string} [data.smart.specific] - Criterio específico
   * @param {string} [data.smart.measurable] - Criterio medible
   * @param {string} [data.smart.achievable] - Criterio alcanzable
   * @param {string} [data.smart.relevant] - Criterio relevante
   * @param {string} [data.smart.timeBound] - Criterio con tiempo límite
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({});
    
    // Solo incluir campos que estén presentes en data
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.status !== undefined) this.status = data.status;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.smart !== undefined) this.smart = data.smart;
    if (data.parentGoalId !== undefined) this.parentGoalId = data.parentGoalId;
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

    const statusError = this._validateStatus();
    if (statusError) errors.push(statusError);

    const priorityError = this._validatePriority();
    if (priorityError) errors.push(priorityError);

    const dueDateError = this._validateDueDate();
    if (dueDateError) errors.push(dueDateError);

    // Validar smart si existe (no requerido en update)
    const smartErrors = this._validateSmart(false);
    errors.push(...smartErrors);

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
    if (this.status !== undefined) result.status = this.status;
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.parentGoalId !== undefined) result.parentGoalId = this.parentGoalId;
    if (this.smart !== undefined) {
      result.smart = {};
      if (this.smart.specific !== undefined) result.smart.specific = this.smart.specific.trim();
      if (this.smart.measurable !== undefined) result.smart.measurable = this.smart.measurable.trim();
      if (this.smart.achievable !== undefined) result.smart.achievable = this.smart.achievable.trim();
      if (this.smart.relevant !== undefined) result.smart.relevant = this.smart.relevant.trim();
      if (this.smart.timeBound !== undefined) result.smart.timeBound = this.smart.timeBound.trim();
    }

    return result;
  }
}
