/**
 * DTO para actualizar una métrica existente
 * @class UpdateMetricDto
 * @description Define la estructura y validaciones para actualizar una métrica
 * Al actualizar, el estado actual se guarda en history si cambia la semana
 */
export class UpdateMetricDto {
  /**
   * @param {Object} data - Datos a actualizar
   * @param {string} [data.currentWeek] - Nueva semana actual
   * @param {number} [data.currentProgress] - Nuevo progreso (0-100)
   * @param {string} [data.currentNotes] - Nuevas notas
   * @param {number} [data.totalCompletedTasks] - Total de tareas completadas
   * @param {number} [data.totalTasks] - Total de tareas
   * @param {number} [data.missingTasks] - Tareas faltantes
   * @param {number} [data.estimatedTimeInvested] - Tiempo estimado invertido (horas)
   * @param {number} [data.qualityScore] - Puntuación de calidad (0-5)
   * @param {number} [data.expectedProgress] - Progreso esperado según timeline
   * @param {number} [data.overdueTasks] - Tareas vencidas
   * @param {number} [data.onTimeCompletionRate] - Porcentaje de tareas completadas a tiempo
   * @param {Object} [data.taskBreakdown] - Distribución de tareas por prioridad
   * @param {Date} [data.projectedCompletionDate] - Fecha proyectada de completado
   */
  constructor(data) {
    // Campos básicos
    if (data.currentWeek !== undefined) this.currentWeek = data.currentWeek;
    if (data.currentProgress !== undefined) this.currentProgress = data.currentProgress;
    if (data.currentNotes !== undefined) this.currentNotes = data.currentNotes;
    if (data.totalCompletedTasks !== undefined) this.totalCompletedTasks = data.totalCompletedTasks;
    if (data.totalTasks !== undefined) this.totalTasks = data.totalTasks;
    if (data.missingTasks !== undefined) this.missingTasks = data.missingTasks;

    // Métricas de calidad
    if (data.estimatedTimeInvested !== undefined) this.estimatedTimeInvested = data.estimatedTimeInvested;
    if (data.qualityScore !== undefined) this.qualityScore = data.qualityScore;

    // Predicciones
    if (data.expectedProgress !== undefined) this.expectedProgress = data.expectedProgress;
    if (data.projectedCompletionDate !== undefined) this.projectedCompletionDate = data.projectedCompletionDate;

    // Análisis de tareas
    if (data.taskBreakdown !== undefined) this.taskBreakdown = data.taskBreakdown;
    if (data.overdueTasks !== undefined) this.overdueTasks = data.overdueTasks;
    if (data.onTimeCompletionRate !== undefined) this.onTimeCompletionRate = data.onTimeCompletionRate;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar currentWeek si existe
    if (this.currentWeek !== undefined) {
      if (typeof this.currentWeek !== 'string' || this.currentWeek.trim() === '') {
        errors.push('La semana debe ser un string válido');
      }
    }

    // Validar currentProgress si existe
    if (this.currentProgress !== undefined) {
      if (typeof this.currentProgress !== 'number') {
        errors.push('El progreso debe ser un número');
      } else if (this.currentProgress < 0 || this.currentProgress > 100) {
        errors.push('El progreso debe estar entre 0 y 100');
      }
    }

    // Validar currentNotes si existe
    if (this.currentNotes !== undefined) {
      if (typeof this.currentNotes !== 'string') {
        errors.push('Las notas deben ser un string');
      }
    }

    // Validar totalCompletedTasks si existe
    if (this.totalCompletedTasks !== undefined) {
      if (typeof this.totalCompletedTasks !== 'number' || this.totalCompletedTasks < 0) {
        errors.push('El total de tareas completadas debe ser un número no negativo');
      }
    }

    // Validar totalTasks si existe
    if (this.totalTasks !== undefined) {
      if (typeof this.totalTasks !== 'number' || this.totalTasks < 0) {
        errors.push('El total de tareas debe ser un número no negativo');
      }
    }

    // Validar estimatedTimeInvested si existe
    if (this.estimatedTimeInvested !== undefined) {
      if (typeof this.estimatedTimeInvested !== 'number' || this.estimatedTimeInvested < 0) {
        errors.push('El tiempo invertido debe ser un número no negativo');
      }
    }

    // Validar qualityScore si existe
    if (this.qualityScore !== undefined) {
      if (typeof this.qualityScore !== 'number' || this.qualityScore < 0 || this.qualityScore > 5) {
        errors.push('La puntuación de calidad debe estar entre 0 y 5');
      }
    }

    // Validar expectedProgress si existe
    if (this.expectedProgress !== undefined) {
      if (typeof this.expectedProgress !== 'number' || this.expectedProgress < 0 || this.expectedProgress > 100) {
        errors.push('El progreso esperado debe estar entre 0 y 100');
      }
    }

    // Validar overdueTasks si existe
    if (this.overdueTasks !== undefined) {
      if (typeof this.overdueTasks !== 'number' || this.overdueTasks < 0) {
        errors.push('Las tareas vencidas deben ser un número no negativo');
      }
    }

    // Validar onTimeCompletionRate si existe
    if (this.onTimeCompletionRate !== undefined) {
      if (
        typeof this.onTimeCompletionRate !== 'number' ||
        this.onTimeCompletionRate < 0 ||
        this.onTimeCompletionRate > 100
      ) {
        errors.push('La tasa de completado a tiempo debe estar entre 0 y 100');
      }
    }

    // Validar taskBreakdown si existe
    if (this.taskBreakdown !== undefined) {
      if (typeof this.taskBreakdown !== 'object' || this.taskBreakdown === null) {
        errors.push('El desglose de tareas debe ser un objeto');
      } else {
        const { highPriority, mediumPriority, lowPriority } = this.taskBreakdown;
        if (highPriority !== undefined && (typeof highPriority !== 'number' || highPriority < 0)) {
          errors.push('Las tareas de alta prioridad deben ser un número no negativo');
        }
        if (mediumPriority !== undefined && (typeof mediumPriority !== 'number' || mediumPriority < 0)) {
          errors.push('Las tareas de prioridad media deben ser un número no negativo');
        }
        if (lowPriority !== undefined && (typeof lowPriority !== 'number' || lowPriority < 0)) {
          errors.push('Las tareas de baja prioridad deben ser un número no negativo');
        }
      }
    }

    // Validar projectedCompletionDate si existe
    if (this.projectedCompletionDate !== undefined) {
      if (!(this.projectedCompletionDate instanceof Date) && typeof this.projectedCompletionDate !== 'string') {
        errors.push('La fecha proyectada de completado debe ser una fecha válida');
      }
    }

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

    if (this.currentWeek !== undefined) result.currentWeek = this.currentWeek.trim();
    if (this.currentProgress !== undefined) result.currentProgress = this.currentProgress;
    if (this.currentNotes !== undefined) result.currentNotes = this.currentNotes.trim();
    if (this.totalCompletedTasks !== undefined) result.totalCompletedTasks = this.totalCompletedTasks;
    if (this.totalTasks !== undefined) result.totalTasks = this.totalTasks;
    if (this.missingTasks !== undefined) result.missingTasks = this.missingTasks;
    if (this.estimatedTimeInvested !== undefined) result.estimatedTimeInvested = this.estimatedTimeInvested;
    if (this.qualityScore !== undefined) result.qualityScore = this.qualityScore;
    if (this.expectedProgress !== undefined) result.expectedProgress = this.expectedProgress;
    if (this.projectedCompletionDate !== undefined) result.projectedCompletionDate = this.projectedCompletionDate;
    if (this.taskBreakdown !== undefined) result.taskBreakdown = this.taskBreakdown;
    if (this.overdueTasks !== undefined) result.overdueTasks = this.overdueTasks;
    if (this.onTimeCompletionRate !== undefined) result.onTimeCompletionRate = this.onTimeCompletionRate;

    return result;
  }
}
