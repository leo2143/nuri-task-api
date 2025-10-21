/**
 * DTO para agregar un bloqueador a una métrica
 * @class AddBlockerDto
 * @description Define la estructura y validaciones para agregar un bloqueador
 */
export class AddBlockerDto {
  /**
   * @param {Object} data - Datos del bloqueador
   * @param {string} data.description - Descripción del bloqueador (requerido)
   * @param {string} [data.severity='medium'] - Severidad (low/medium/high/critical)
   */
  constructor(data) {
    this.description = data.description;
    this.severity = data.severity || 'medium';
    this.resolved = false;
    this.createdAt = new Date();
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar description
    if (!this.description || typeof this.description !== 'string' || this.description.trim() === '') {
      errors.push('La descripción del bloqueador es requerida y debe ser un string válido');
    }

    // Validar severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(this.severity)) {
      errors.push(`La severidad debe ser una de: ${validSeverities.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos del bloqueador
   */
  toPlainObject() {
    return {
      description: this.description.trim(),
      severity: this.severity,
      resolved: this.resolved,
      createdAt: this.createdAt,
    };
  }
}
