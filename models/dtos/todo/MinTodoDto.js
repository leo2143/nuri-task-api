/**
 * DTO Mínimo para respuestas de lista de Todos
 * @class MinTodoDto
 * @description DTO para devolver información resumida de tareas en listados
 * Solo incluye los campos esenciales para mostrar en listas
 */
export class MinTodoDto {
  /**
   * @param {Object} todo - Documento de Todo de Mongoose
   */
  constructor(todo) {
    this._id = todo._id;
    this.title = todo.title;
    this.completed = todo.completed;
    this.priority = todo.priority;
    this.dueDate = todo.dueDate;
    this.createdAt = todo.createdAt;
    this.updatedAt = todo.updatedAt;
  }

  /**
   * Convierte un array de Todos a MinTodoDto
   * @static
   * @param {Array} todos - Array de documentos de Todo
   * @returns {Array<MinTodoDto>} Array de MinTodoDto
   */
  static fromArray(todos) {
    return todos.map(todo => new MinTodoDto(todo));
  }

  /**
   * Convierte el DTO a objeto plano
   * @returns {Object} Objeto plano con los datos del DTO
   */
  toPlainObject() {
    return {
      _id: this._id,
      title: this.title,
      completed: this.completed,
      priority: this.priority,
      dueDate: this.dueDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
