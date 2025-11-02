/**
 * DTO para crear una nueva meta
 * @class CreateGoalDto
 * @description Define la estructura y validaciones para crear una meta
 */
export class CreateGoalDto {
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
    this.title = data.title;
    this.description = data.description || '';
    this.status = data.status || 'active';
    this.priority = data.priority || 'medium';
    this.dueDate = data.dueDate || null;
    this.smart = data.smart;
    this.comments = data.comments || [];
    this.parentGoalId = data.parentGoalId || null;
  }

  /**
   * Valida el título
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateTitle(required = true) {
    if (this.title === undefined) return null;

    if (required && (!this.title || typeof this.title !== 'string' || this.title.trim() === '')) {
      return 'El título es requerido y debe ser un string válido';
    }

    if (!required && this.title !== undefined) {
      if (typeof this.title !== 'string' || this.title.trim() === '') {
        return 'El título debe ser un string válido';
      }
    }

    return null;
  }

  /**
   * Valida el status
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateStatus() {
    if (this.status === undefined) return null;

    const validStatuses = ['active', 'paused', 'completed'];
    if (!validStatuses.includes(this.status)) {
      return `El estado debe ser uno de: ${validStatuses.join(', ')}`;
    }

    return null;
  }

  /**
   * Valida la prioridad
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validatePriority() {
    if (this.priority === undefined) return null;

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(this.priority)) {
      return `La prioridad debe ser una de: ${validPriorities.join(', ')}`;
    }

    return null;
  }

  /**
   * Valida la fecha límite
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateDueDate() {
    if (this.dueDate === undefined || this.dueDate === null) return null;

    const date = new Date(this.dueDate);
    if (isNaN(date.getTime())) {
      return 'La fecha límite debe ser una fecha válida';
    }

    return null;
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
    const errors = [];

    // Validar título (requerido)
    const titleError = this._validateTitle(true);
    if (titleError) errors.push(titleError);

    // Validar status
    const statusError = this._validateStatus();
    if (statusError) errors.push(statusError);

    // Validar priority
    const priorityError = this._validatePriority();
    if (priorityError) errors.push(priorityError);

    // Validar dueDate
    const dueDateError = this._validateDueDate();
    if (dueDateError) errors.push(dueDateError);

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
    return {
      title: this.title.trim(),
      description: this.description.trim(),
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
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
