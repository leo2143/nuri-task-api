/**
 * DTO base con validaciones comunes reutilizables
 * @class BaseValidationDto
 * @description Define validaciones comunes que se repiten en múltiples DTOs:
 * - title (título)
 * - priority (prioridad)
 * - dueDate (fecha de vencimiento)
 * - status (estado)
 */
export class BaseValidationDto {
  /**
   * @param {Object} data - Datos comunes
   * @param {string} [data.title] - Título
   * @param {string} [data.priority] - Prioridad (low/medium/high)
   * @param {Date|string} [data.dueDate] - Fecha límite
   * @param {string} [data.status] - Estado (active/paused/completed)
   */
  constructor(data = {}) {
    this.title = data.title;
    this.priority = data.priority;
    this.dueDate = data.dueDate || null;
    this.status = data.status;
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

    const trimmedTitle = this.title?.trim();
    if (trimmedTitle && trimmedTitle.length < 3) {
      return 'El título debe tener al menos 3 caracteres';
    }

    if (trimmedTitle && trimmedTitle.length > 50) {
      return 'El título no puede superar los 50 caracteres';
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

    // Validar que no sea anterior al día actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateOnly = new Date(date);
    dueDateOnly.setHours(0, 0, 0, 0);

    if (dueDateOnly < today) {
      return 'La fecha límite no puede ser anterior al día actual';
    }

    return null;
  }

  /**
   * Valida el estado
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
   * Valida la descripción
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateDescription(required = false) {
    if (this.description === undefined) return null;

    if (required && (!this.description || typeof this.description !== 'string' || this.description.trim() === '')) {
      return 'La descripción es requerida y debe ser un string válido';
    }

    if (!required && this.description !== undefined) {
      if (typeof this.description !== 'string') {
        return 'La descripción debe ser un string válido';
      }
    }

    const trimmedDescription = this.description?.trim();
    if (trimmedDescription && trimmedDescription.length > 100) {
      return 'La descripción no puede superar los 100 caracteres';
    }

    return null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validaciones comunes (opcionales - solo si el campo existe)
    const titleError = this._validateTitle(false);
    if (titleError) errors.push(titleError);

    const priorityError = this._validatePriority();
    if (priorityError) errors.push(priorityError);

    const dueDateError = this._validateDueDate();
    if (dueDateError) errors.push(dueDateError);

    const statusError = this._validateStatus();
    if (statusError) errors.push(statusError);

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos comunes
   */
  toPlainObject() {
    const result = {};
    if (this.title !== undefined) result.title = this.title?.trim();
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.status !== undefined) result.status = this.status;
    return result;
  }
}

