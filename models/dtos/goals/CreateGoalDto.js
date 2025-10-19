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
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar título
    if (!this.title || typeof this.title !== 'string' || this.title.trim() === '') {
      errors.push('El título es requerido y debe ser un string válido');
    }

    // Validar status
    const validStatuses = ['active', 'paused', 'completed'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push(`El estado debe ser uno de: ${validStatuses.join(', ')}`);
    }

    // Validar priority
    const validPriorities = ['low', 'medium', 'high'];
    if (this.priority && !validPriorities.includes(this.priority)) {
      errors.push(`La prioridad debe ser una de: ${validPriorities.join(', ')}`);
    }

    // Validar dueDate si existe
    if (this.dueDate) {
      const date = new Date(this.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('La fecha límite debe ser una fecha válida');
      }
    }

    // Validar smart (requerido)
    if (!this.smart || typeof this.smart !== 'object') {
      errors.push('Los criterios SMART son requeridos');
    } else {
      // Validar cada campo de SMART
      const smartFields = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'];
      smartFields.forEach(field => {
        if (!this.smart[field] || typeof this.smart[field] !== 'string' || this.smart[field].trim() === '') {
          errors.push(`El criterio SMART '${field}' es requerido y debe ser un string válido`);
        }
      });
    }

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
    };
  }
}
