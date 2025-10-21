/**
 * DTO para agregar un hito a una métrica
 * @class AddMilestoneDto
 * @description Define la estructura y validaciones para agregar un hito
 */
export class AddMilestoneDto {
  /**
   * @param {Object} data - Datos del hito
   * @param {string} data.name - Nombre del hito (requerido)
   * @param {number} [data.targetProgress] - Progreso objetivo (0-100)
   * @param {string} [data.description] - Descripción del hito
   */
  constructor(data) {
    this.name = data.name;
    this.targetProgress = data.targetProgress;
    this.description = data.description || '';
    this.achieved = false;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar name
    if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
      errors.push('El nombre del hito es requerido y debe ser un string válido');
    }

    // Validar targetProgress si existe
    if (this.targetProgress !== undefined) {
      if (typeof this.targetProgress !== 'number') {
        errors.push('El progreso objetivo debe ser un número');
      } else if (this.targetProgress < 0 || this.targetProgress > 100) {
        errors.push('El progreso objetivo debe estar entre 0 y 100');
      }
    }

    // Validar description si existe
    if (this.description && typeof this.description !== 'string') {
      errors.push('La descripción debe ser un string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos del hito
   */
  toPlainObject() {
    const result = {
      name: this.name.trim(),
      achieved: this.achieved,
    };

    if (this.targetProgress !== undefined) result.targetProgress = this.targetProgress;
    if (this.description) result.description = this.description.trim();

    return result;
  }
}
