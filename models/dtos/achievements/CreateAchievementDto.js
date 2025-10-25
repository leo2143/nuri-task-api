/**
 * DTO for creating a new achievement template (Admin only)
 * @class CreateAchievementDto
 * @description Defines the structure and validations for creating a global achievement template
 */
export class CreateAchievementDto {
  /**
   * @param {Object} data - Achievement data
   * @param {string} data.title - Achievement title (required)
   * @param {string} data.description - Achievement description (required)
   * @param {number} data.targetCount - Target count to complete (required)
   * @param {string} data.type - Achievement type: task/goal/metric/streak/comment (required)
   * @param {string} [data.reward] - Achievement reward
   * @param {boolean} [data.isActive] - Whether achievement is active (default: true)
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
   * Validates that the DTO data is correct
   * @returns {Object} Object with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate title
    if (!this.title || typeof this.title !== 'string' || this.title.trim() === '') {
      errors.push('El título es requerido y debe ser un string válido');
    }

    // Validate description
    if (!this.description || typeof this.description !== 'string' || this.description.trim() === '') {
      errors.push('La descripción es requerida y debe ser un string válido');
    }

    // Validate targetCount
    if (!this.targetCount || typeof this.targetCount !== 'number' || this.targetCount < 1) {
      errors.push('El targetCount es requerido y debe ser un número mayor a 0');
    }

    // Validate type
    const validTypes = ['task', 'goal', 'metric', 'streak', 'comment'];
    if (!this.type || !validTypes.includes(this.type)) {
      errors.push(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
    }

    // Validate isActive
    if (this.isActive !== undefined && typeof this.isActive !== 'boolean') {
      errors.push('isActive debe ser un valor booleano');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converts the DTO to a plain object
   * @returns {Object} Plain object with the data
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

