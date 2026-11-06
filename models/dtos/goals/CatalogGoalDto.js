/**
 * DTO Catalog con ID, título y estado
 * @class CatalogGoalDto
   * DTO para selects
 */
export class CatalogGoalDto {
  /**
   * @param {Object} goal
   */
  constructor(goal) {
    this.id = goal._id;
    this.title = goal.title;
    this.status = goal.status;
  }

  /**
   * Convierte un array de Goals a CatalogGoalDto
   * @param {Array} goals - Array de documentos de Goal
   * @returns {Array<CatalogGoalDto>} Array de CatalogGoalDto
   */
  static fromArray(goals) {
    return goals.map(goal => new CatalogGoalDto(goal));
  }

  /**
   * Convierte el DTO a objeto plano
   * @returns {Object} Objeto plano con los datos del DTO
   */
  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      status: this.status,
    };
  }
}
