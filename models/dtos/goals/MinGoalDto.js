/**
 * DTO Mínimo para respuestas de lista de Goals
 * @class MinGoalDto
 * @description DTO para devolver información resumida de metas en listados
 * Solo incluye los campos esenciales para mostrar en listas
 */
export class MinGoalDto {
  /**
   * @param {Object} goal - Documento de Goal de Mongoose
   */
  constructor(goal) {
    this._id = goal._id;
    this.title = goal.title;
    this.status = goal.status;
    this.priority = goal.priority;
    this.dueDate = goal.dueDate;
    this.parentGoalId = goal.parentGoalId || null;
    this.progress = goal.progress || 0;
    this.createdAt = goal.createdAt;
    this.updatedAt = goal.updatedAt;
  }

  /**
   * Convierte un array de Goals a MinGoalDto
   * @static
   * @param {Array} goals - Array de documentos de Goal
   * @returns {Array<MinGoalDto>} Array de MinGoalDto
   */
  static fromArray(goals) {
    return goals.map(goal => new MinGoalDto(goal));
  }

  /**
   * Convierte el DTO a objeto plano
   * @returns {Object} Objeto plano con los datos del DTO
   */
  toPlainObject() {
    return {
      _id: this._id,
      title: this.title,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      parentGoalId: this.parentGoalId,
      progress: this.progress,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
