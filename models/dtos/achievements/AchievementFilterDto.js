/**
 * DTO for filtering achievement templates
 * @class AchievementFilterDto
 * @description Defines the structure and validations for filtering global achievement templates
 */
export class AchievementFilterDto {
  /**
   * @param {Object} filters - Filter parameters
   * @param {string} [filters.type] - Filter by type (task/goal/metric/streak/comment)
   * @param {boolean} [filters.isActive] - Filter by active status
   * @param {string} [filters.search] - Search in title or description
   * @param {string} [filters.sortBy] - Field to sort by (title, type, targetCount, createdAt)
   * @param {string} [filters.sortOrder] - Sort order (asc/desc)
   */
  constructor(filters = {}) {
    this.type = filters.type;
    this.isActive = filters.isActive;
    this.search = filters.search;
    this.sortBy = filters.sortBy || 'createdAt';
    this.sortOrder = filters.sortOrder || 'desc';
  }

  /**
   * Validates that the filter data is correct
   * @returns {Object} Object with isValid and errors
   */
  validate() {
    const errors = [];

    // Validate type if exists
    if (this.type) {
      const validTypes = ['task', 'goal', 'metric', 'streak', 'comment'];
      if (!validTypes.includes(this.type)) {
        errors.push(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
      }
    }

    // Validate isActive if exists
    if (this.isActive !== undefined && typeof this.isActive !== 'boolean') {
      errors.push('isActive debe ser un valor booleano');
    }

    // Validate sortBy
    const validSortFields = ['title', 'type', 'targetCount', 'createdAt', 'updatedAt'];
    if (this.sortBy && !validSortFields.includes(this.sortBy)) {
      errors.push(`sortBy debe ser uno de: ${validSortFields.join(', ')}`);
    }

    // Validate sortOrder
    const validSortOrders = ['asc', 'desc'];
    if (this.sortOrder && !validSortOrders.includes(this.sortOrder)) {
      errors.push(`sortOrder debe ser uno de: ${validSortOrders.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converts the DTO to a MongoDB query object
   * @returns {Object} MongoDB query object
   */
  toMongoQuery() {
    const query = {};

    // Filter by type
    if (this.type) {
      query.type = this.type;
    }

    // Filter by active status
    if (this.isActive !== undefined) {
      query.isActive = this.isActive;
    }

    // Search in title or description
    if (this.search) {
      query.$or = [
        { title: { $regex: this.search, $options: 'i' } },
        { description: { $regex: this.search, $options: 'i' } },
      ];
    }

    return query;
  }

  /**
   * Converts the DTO to a MongoDB sort object
   * @returns {Object} MongoDB sort object
   */
  toMongoSort() {
    const sortOrder = this.sortOrder === 'asc' ? 1 : -1;
    return { [this.sortBy]: sortOrder };
  }
}

