/**
 * DTO para incrementar el progreso de un logro de usuario
 * @class IncrementProgressDto
 * @description Define la estructura y validaciones para incrementar el progreso de un logro
 */
export class IncrementProgressDto {
  /**
   * @param {Object} data - Datos del progreso
   * @param {number} [data.amount] - Cantidad a incrementar (por defecto: 1)
   */
  constructor(data = {}) {
    this.amount = data.amount !== undefined ? data.amount : 1;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar amount
    if (typeof this.amount !== 'number' || this.amount < 1) {
      errors.push('El monto debe ser un número mayor o igual a 1');
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
      amount: this.amount,
    };
  }
}
