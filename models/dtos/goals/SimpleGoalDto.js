/**
 * DTO Catalog solo ID y título
 * @class CatalogGoalDto
 * @description DTO para selects
 */
export class CatalogGoalDto {
  /**
   * @param {Object} goal
   */
  constructor(goal) {
    this.id = goal._id;
    this.title = goal.title;
  }

  /**
   * Convierte un array de Goals a CatalogGoalDto
   * @static
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
    };
  }
}
