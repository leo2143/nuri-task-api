/**
 * DTO para resolver un bloqueador
 * @class ResolveBlockerDto
 * @description Define la estructura y validaciones para resolver un bloqueador
 */
export class ResolveBlockerDto {
  /**
   * @param {Object} data - Datos para resolver el bloqueador
   * @param {string} data.blockerId - ID del bloqueador (requerido)
   * @param {boolean} [data.resolved=true] - Estado de resolución
   */
  constructor(data) {
    this.blockerId = data.blockerId;
    this.resolved = data.resolved !== undefined ? data.resolved : true;
    this.resolvedAt = this.resolved ? new Date() : null;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar blockerId
    if (!this.blockerId || typeof this.blockerId !== 'string' || this.blockerId.trim() === '') {
      errors.push('El ID del bloqueador es requerido y debe ser un string válido');
    }

    // Validar resolved
    if (typeof this.resolved !== 'boolean') {
      errors.push('El estado de resolución debe ser un booleano');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos
   */
  toPlainObject() {
    return {
      blockerId: this.blockerId.trim(),
      resolved: this.resolved,
      resolvedAt: this.resolvedAt,
    };
  }
}
