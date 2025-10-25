/**
 * DTO for updating an existing achievement template (Admin only)
 * @class UpdateAchievementDto
 * @description Defines the structure and validations for updating a global achievement template
 */
export class UpdateAchievementDto {
  /**
   * @param {Object} data - Data to update
   * @param {string} [data.title] - Achievement title
   * @param {string} [data.description] - Achievement description
   * @param {number} [data.targetCount] - Target count to complete
   * @param {string} [data.type] - Achievement type: task/goal/metric/streak/comment
   * @param {string} [data.reward] - Achievement reward
   * @param {boolean} [data.isActive] - Whether achievement is active
   */
  constructor(data) {
    // Only include fields that are present in data
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.targetCount !== undefined) this.targetCount = data.targetCount;
    if (data.type !== undefined) this.type = data.type;
    if (data.reward !== undefined) this.reward = data.reward;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  /**
   * Validates that the DTO data is correct
   * @returns {Object} Object with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate title if exists
    if (this.title !== undefined) {
      if (typeof this.title !== 'string' || this.title.trim() === '') {
        errors.push('El título debe ser un string válido');
      }
    }

    // Validate description if exists
    if (this.description !== undefined) {
      if (typeof this.description !== 'string' || this.description.trim() === '') {
        errors.push('La descripción debe ser un string válido');
      }
    }

    // Validate targetCount if exists
    if (this.targetCount !== undefined) {
      if (typeof this.targetCount !== 'number' || this.targetCount < 1) {
        errors.push('El targetCount debe ser un número mayor a 0');
      }
    }

    // Validate type if exists
    if (this.type !== undefined) {
      const validTypes = ['task', 'goal', 'metric', 'streak', 'comment'];
      if (!validTypes.includes(this.type)) {
        errors.push(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
      }
    }

    // Validate isActive if exists
    if (this.isActive !== undefined) {
      if (typeof this.isActive !== 'boolean') {
        errors.push('isActive debe ser un valor booleano');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converts the DTO to a plain object
   * @returns {Object} Plain object with the data to update
   */
  toPlainObject() {
    const result = {};

    if (this.title !== undefined) result.title = this.title.trim();
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.targetCount !== undefined) result.targetCount = this.targetCount;
    if (this.type !== undefined) result.type = this.type;
    if (this.reward !== undefined) result.reward = this.reward.trim();
    if (this.isActive !== undefined) result.isActive = this.isActive;

    return result;
  }
}

