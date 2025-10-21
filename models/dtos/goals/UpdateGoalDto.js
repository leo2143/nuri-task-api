/**
 * DTO para actualizar una meta existente
 * @class UpdateGoalDto
 * @description Define la estructura y validaciones para actualizar una meta
 */
export class UpdateGoalDto {
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
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar título si existe
    if (this.title !== undefined) {
      if (typeof this.title !== 'string' || this.title.trim() === '') {
        errors.push('El título debe ser un string válido');
      }
    }

    // Validar status si existe
    if (this.status !== undefined) {
      const validStatuses = ['active', 'paused', 'completed'];
      if (!validStatuses.includes(this.status)) {
        errors.push(`El estado debe ser uno de: ${validStatuses.join(', ')}`);
      }
    }

    // Validar priority si existe
    if (this.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(this.priority)) {
        errors.push(`La prioridad debe ser una de: ${validPriorities.join(', ')}`);
      }
    }

    // Validar dueDate si existe
    if (this.dueDate !== undefined && this.dueDate !== null) {
      const date = new Date(this.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('La fecha límite debe ser una fecha válida');
      }
    }

    // Validar smart si existe
    if (this.smart !== undefined) {
      if (typeof this.smart !== 'object' || this.smart === null) {
        errors.push('Los criterios SMART deben ser un objeto válido');
      } else {
        // Validar campos individuales de SMART si están presentes
        const smartFields = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'];
        smartFields.forEach(field => {
          if (this.smart[field] !== undefined) {
            if (typeof this.smart[field] !== 'string' || this.smart[field].trim() === '') {
              errors.push(`El criterio SMART '${field}' debe ser un string válido`);
            }
          }
        });
      }
    }

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
