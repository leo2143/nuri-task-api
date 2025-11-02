import { CreateMetricDto } from './CreateMetricDto.js';

/**
 * DTO para actualizar una métrica existente (simplificado - enfoque motivacional)
 * @class UpdateMetricDto
 * @extends CreateMetricDto
 * @description Define la estructura y validaciones para actualizar una métrica
 * Hereda las validaciones de CreateMetricDto pero todos los campos son opcionales
 */
export class UpdateMetricDto extends CreateMetricDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {number} [data.currentProgress] - Nuevo progreso (0-100)
   * @param {string} [data.notes] - Nuevas notas opcionales
   */
  constructor(data) {
    // Llamamos super con objeto vacío para inicializar la clase padre
    super({});

    // Solo asignar los campos que se están actualizando
    if (data.currentProgress !== undefined) this.currentProgress = data.currentProgress;
    if (data.notes !== undefined) this.notes = data.notes;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * Reutiliza los métodos de validación del padre
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Reutilizar métodos de validación del padre (todos opcionales en update)
    const progressError = this._validateCurrentProgress();
    if (progressError) errors.push(progressError);

    const notesError = this._validateNotes();
    if (notesError) errors.push(notesError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos a actualizar
   */
  toPlainObject() {
    const result = {
      lastUpdated: new Date(),
    };

    if (this.currentProgress !== undefined) result.currentProgress = this.currentProgress;
    if (this.notes !== undefined) result.notes = this.notes.trim();

    return result;
  }
}
