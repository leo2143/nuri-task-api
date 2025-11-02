/**
 * DTO para crear una nueva plantilla de logro (Solo administradores)
 * @class CreateAchievementDto
 * @description Define la estructura y validaciones para crear una plantilla de logro global
 */
export class CreateAchievementDto {
  /**
   * @param {Object} data - Datos del logro
   * @param {string} data.title - Título del logro (requerido)
   * @param {string} data.description - Descripción del logro (requerido)
   * @param {number} data.targetCount - Cantidad objetivo para completar (requerido)
   * @param {string} data.type - Tipo de logro: task/goal/metric/streak/comment (requerido)
   * @param {string} [data.reward] - Recompensa del logro
   * @param {boolean} [data.isActive] - Si el logro está activo (por defecto: true)
   */
  constructor(data) {
    this.title = data.title;
    this.description = data.description;
    this.targetCount = data.targetCount;
    this.type = data.type;
    this.reward = data.reward || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
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
   * Valida la descripción
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateDescription(required = true) {
    if (this.description === undefined) return null;

    if (required && (!this.description || typeof this.description !== 'string' || this.description.trim() === '')) {
      return 'La descripción es requerida y debe ser un string válido';
    }

    if (!required && this.description !== undefined) {
      if (typeof this.description !== 'string' || this.description.trim() === '') {
        return 'La descripción debe ser un string válido';
      }
    }

    return null;
    }

  /**
   * Valida el targetCount
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateTargetCount(required = true) {
    if (this.targetCount === undefined) return null;

    if (required && (!this.targetCount || typeof this.targetCount !== 'number' || this.targetCount < 1)) {
      return 'El targetCount es requerido y debe ser un número mayor a 0';
    }

    if (!required && this.targetCount !== undefined) {
      if (typeof this.targetCount !== 'number' || this.targetCount < 1) {
        return 'El targetCount debe ser un número mayor a 0';
      }
    }

    return null;
    }

  /**
   * Valida el tipo
   * @param {boolean} required - Si el campo es requerido
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateType(required = true) {
    if (this.type === undefined) return null;

    const validTypes = ['task', 'goal', 'metric', 'streak', 'comment'];

    if (required && (!this.type || !validTypes.includes(this.type))) {
      return `El tipo debe ser uno de: ${validTypes.join(', ')}`;
    }

    if (!required && this.type !== undefined) {
      if (!validTypes.includes(this.type)) {
        return `El tipo debe ser uno de: ${validTypes.join(', ')}`;
      }
    }

    return null;
    }

  /**
   * Valida isActive
   * @returns {string|null} Mensaje de error o null si es válido
   */
  _validateIsActive() {
    if (this.isActive === undefined) return null;

    if (typeof this.isActive !== 'boolean') {
      return 'isActive debe ser un valor booleano';
    }

    return null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar campos requeridos
    const titleError = this._validateTitle(true);
    if (titleError) errors.push(titleError);

    const descriptionError = this._validateDescription(true);
    if (descriptionError) errors.push(descriptionError);

    const targetCountError = this._validateTargetCount(true);
    if (targetCountError) errors.push(targetCountError);

    const typeError = this._validateType(true);
    if (typeError) errors.push(typeError);

    // Validar campos opcionales
    const isActiveError = this._validateIsActive();
    if (isActiveError) errors.push(isActiveError);

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
      targetCount: this.targetCount,
      type: this.type,
      reward: this.reward.trim(),
      isActive: this.isActive,
    };
  }
}
