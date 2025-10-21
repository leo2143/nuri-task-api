/**
 * DTO para confirmar una alerta
 * @class AcknowledgeAlertDto
 * @description Define la estructura y validaciones para confirmar una alerta
 */
export class AcknowledgeAlertDto {
  /**
   * @param {Object} data - Datos para confirmar la alerta
   * @param {string} data.alertId - ID de la alerta (requerido)
   * @param {boolean} [data.acknowledged=true] - Estado de confirmación
   */
  constructor(data) {
    this.alertId = data.alertId;
    this.acknowledged = data.acknowledged !== undefined ? data.acknowledged : true;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar alertId
    if (!this.alertId || typeof this.alertId !== 'string' || this.alertId.trim() === '') {
      errors.push('El ID de la alerta es requerido y debe ser un string válido');
    }

    // Validar acknowledged
    if (typeof this.acknowledged !== 'boolean') {
      errors.push('El estado de confirmación debe ser un booleano');
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
      alertId: this.alertId.trim(),
      acknowledged: this.acknowledged,
    };
  }
}
