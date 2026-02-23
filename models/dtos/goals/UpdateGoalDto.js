import { CreateGoalDto } from './CreateGoalDto.js';

/**
 * DTO para actualizar una meta existente
 * @class UpdateGoalDto
 * @extends CreateGoalDto
 * @description Define la estructura y validaciones para actualizar una meta
 * Requiere title, los demás campos son opcionales
 */
export class UpdateGoalDto extends CreateGoalDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} data.title - Título de la meta (requerido, máximo 50 caracteres)
   * @param {string} [data.description] - Descripción de la meta (opcional, máximo 100 caracteres)
   * @param {string} [data.reason] - Razón de importancia de la meta (opcional, máximo 50 caracteres)
   * @param {string} [data.status] - Estado de la meta (active/paused/completed)
   * @param {string} [data.priority] - Prioridad de la meta (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite de la meta
   * @param {string} [data.parentGoalId] - ID de la meta padre (para submetas)
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({});

    // Campos requeridos
    this.title = data.title;

    // Campos opcionales - solo incluir si están presentes en data
    if (data.description !== undefined) this.description = data.description;
    if (data.reason !== undefined) this.reason = data.reason;
    if (data.status !== undefined) this.status = data.status;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.parentGoalId !== undefined) this.parentGoalId = data.parentGoalId;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * Reutiliza los métodos de validación del padre
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Campos requeridos
    const titleError = this._validateTitle(true); // REQUERIDO
    if (titleError) errors.push(titleError);

    // Campos opcionales
    const descriptionError = this._validateDescription(false);
    if (descriptionError) errors.push(descriptionError);

    const reasonError = this._validateReason();
    if (reasonError) errors.push(reasonError);

    const statusError = this._validateStatus();
    if (statusError) errors.push(statusError);

    const priorityError = this._validatePriority();
    if (priorityError) errors.push(priorityError);

    const dueDateError = this._validateDueDate();
    if (dueDateError) errors.push(dueDateError);

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
    if (this.reason !== undefined) result.reason = this.reason.trim();
    if (this.status !== undefined) result.status = this.status;
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.parentGoalId !== undefined) result.parentGoalId = this.parentGoalId;

    return result;
  }
}
