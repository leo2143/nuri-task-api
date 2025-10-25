/**
 * DTO for incrementing user achievement progress
 * @class IncrementProgressDto
 * @description Defines the structure and validations for incrementing progress on an achievement
 */
export class IncrementProgressDto {
  /**
   * @param {Object} data - Progress data
   * @param {number} [data.amount] - Amount to increment (default: 1)
   */
  constructor(data = {}) {
    this.amount = data.amount !== undefined ? data.amount : 1;
  }

  /**
   * Validates that the DTO data is correct
   * @returns {Object} Object with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate amount
    if (typeof this.amount !== 'number' || this.amount < 1) {
      errors.push('El monto debe ser un número mayor o igual a 1');
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
      amount: this.amount,
    };
  }
}

