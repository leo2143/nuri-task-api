/**
 * DTO para crear una nueva métrica
 * @class CreateMetricDto
 * @description Define la estructura y validaciones para crear una métrica
 */
export class CreateMetricDto {
  /**
   * @param {Object} data - Datos de la métrica
   * @param {string} data.GoalId - ID de la meta (requerido)
   * @param {string} data.currentWeek - Semana actual (requerido)
   * @param {number} [data.currentProgress=0] - Progreso actual (0-100)
   * @param {string} [data.currentNotes=''] - Notas actuales
   * @param {number} [data.totalCompletedTasks=0] - Total de tareas completadas
   * @param {number} [data.totalTasks=0] - Total de tareas
   * @param {number} [data.missingTasks=0] - Tareas faltantes
   * @param {Array} [data.milestones=[]] - Hitos de la meta
   * @param {number} [data.estimatedTimeInvested=0] - Tiempo estimado invertido (horas)
   * @param {number} [data.qualityScore=0] - Puntuación de calidad (0-5)
   * @param {number} [data.expectedProgress=0] - Progreso esperado según timeline
   * @param {Array} [data.blockers=[]] - Obstáculos actuales
   * @param {Array} [data.weeklyWins=[]] - Logros de la semana
   * @param {Object} [data.taskBreakdown] - Distribución de tareas por prioridad
   * @param {number} [data.overdueTasks=0] - Tareas vencidas
   * @param {number} [data.onTimeCompletionRate=0] - Porcentaje de tareas completadas a tiempo
   */
  constructor(data) {
    // Campos requeridos
    this.GoalId = data.GoalId;
    this.currentWeek = data.currentWeek;

    // Campos básicos
    this.currentProgress = data.currentProgress !== undefined ? data.currentProgress : 0;
    this.currentNotes = data.currentNotes || '';
    this.totalCompletedTasks = data.totalCompletedTasks !== undefined ? data.totalCompletedTasks : 0;
    this.totalTasks = data.totalTasks !== undefined ? data.totalTasks : 0;
    this.missingTasks = data.missingTasks !== undefined ? data.missingTasks : 0;

    // Hitos y logros
    this.milestones = data.milestones || [];
    this.currentStreak = 0;
    this.bestStreak = 0;

    // Métricas de calidad
    this.estimatedTimeInvested = data.estimatedTimeInvested !== undefined ? data.estimatedTimeInvested : 0;
    this.qualityScore = data.qualityScore !== undefined ? data.qualityScore : 0;

    // Predicciones
    this.expectedProgress = data.expectedProgress !== undefined ? data.expectedProgress : 0;

    // Contexto enriquecido
    this.blockers = data.blockers || [];
    this.weeklyWins = data.weeklyWins || [];

    // Análisis de tareas
    this.taskBreakdown = data.taskBreakdown || {
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    };
    this.overdueTasks = data.overdueTasks !== undefined ? data.overdueTasks : 0;
    this.onTimeCompletionRate = data.onTimeCompletionRate !== undefined ? data.onTimeCompletionRate : 0;

    // Alertas y estado
    this.alerts = [];
    this.healthStatus = 'good';

    // Historial y fechas
    this.history = [];
    this.lastUpdated = new Date();
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar GoalId
    if (!this.GoalId || typeof this.GoalId !== 'string' || this.GoalId.trim() === '') {
      errors.push('El ID de la meta es requerido y debe ser un string válido');
    }

    // Validar currentWeek
    if (!this.currentWeek || typeof this.currentWeek !== 'string' || this.currentWeek.trim() === '') {
      errors.push('La semana actual es requerida y debe ser un string válido');
    }

    // Validar currentProgress
    if (typeof this.currentProgress !== 'number') {
      errors.push('El progreso debe ser un número');
    } else if (this.currentProgress < 0 || this.currentProgress > 100) {
      errors.push('El progreso debe estar entre 0 y 100');
    }

    // Validar currentNotes si existe
    if (this.currentNotes && typeof this.currentNotes !== 'string') {
      errors.push('Las notas deben ser un string');
    }

    // Validar totalCompletedTasks
    if (typeof this.totalCompletedTasks !== 'number' || this.totalCompletedTasks < 0) {
      errors.push('El total de tareas completadas debe ser un número no negativo');
    }

    // Validar totalTasks
    if (typeof this.totalTasks !== 'number' || this.totalTasks < 0) {
      errors.push('El total de tareas debe ser un número no negativo');
    }

    // Validar estimatedTimeInvested
    if (typeof this.estimatedTimeInvested !== 'number' || this.estimatedTimeInvested < 0) {
      errors.push('El tiempo invertido debe ser un número no negativo');
    }

    // Validar qualityScore
    if (typeof this.qualityScore !== 'number' || this.qualityScore < 0 || this.qualityScore > 5) {
      errors.push('La puntuación de calidad debe estar entre 0 y 5');
    }

    // Validar expectedProgress
    if (typeof this.expectedProgress !== 'number' || this.expectedProgress < 0 || this.expectedProgress > 100) {
      errors.push('El progreso esperado debe estar entre 0 y 100');
    }

    // Validar milestones
    if (!Array.isArray(this.milestones)) {
      errors.push('Los hitos deben ser un array');
    } else {
      this.milestones.forEach((milestone, index) => {
        if (!milestone.name || typeof milestone.name !== 'string') {
          errors.push(`El hito ${index + 1} debe tener un nombre válido`);
        }
        if (milestone.targetProgress !== undefined) {
          if (
            typeof milestone.targetProgress !== 'number' ||
            milestone.targetProgress < 0 ||
            milestone.targetProgress > 100
          ) {
            errors.push(`El progreso objetivo del hito ${index + 1} debe estar entre 0 y 100`);
          }
        }
      });
    }

    // Validar blockers
    if (!Array.isArray(this.blockers)) {
      errors.push('Los bloqueadores deben ser un array');
    } else {
      this.blockers.forEach((blocker, index) => {
        if (!blocker.description || typeof blocker.description !== 'string') {
          errors.push(`El bloqueador ${index + 1} debe tener una descripción válida`);
        }
        if (blocker.severity && !['low', 'medium', 'high', 'critical'].includes(blocker.severity)) {
          errors.push(`El bloqueador ${index + 1} tiene una severidad inválida`);
        }
      });
    }

    // Validar weeklyWins
    if (!Array.isArray(this.weeklyWins)) {
      errors.push('Los logros semanales deben ser un array');
    } else {
      this.weeklyWins.forEach((win, index) => {
        if (!win.description || typeof win.description !== 'string') {
          errors.push(`El logro ${index + 1} debe tener una descripción válida`);
        }
        if (!win.week || typeof win.week !== 'string') {
          errors.push(`El logro ${index + 1} debe tener una semana válida`);
        }
      });
    }

    // Validar taskBreakdown
    if (typeof this.taskBreakdown !== 'object' || this.taskBreakdown === null) {
      errors.push('El desglose de tareas debe ser un objeto');
    } else {
      const { highPriority, mediumPriority, lowPriority } = this.taskBreakdown;
      if (typeof highPriority !== 'number' || highPriority < 0) {
        errors.push('Las tareas de alta prioridad deben ser un número no negativo');
      }
      if (typeof mediumPriority !== 'number' || mediumPriority < 0) {
        errors.push('Las tareas de prioridad media deben ser un número no negativo');
      }
      if (typeof lowPriority !== 'number' || lowPriority < 0) {
        errors.push('Las tareas de baja prioridad deben ser un número no negativo');
      }
    }

    // Validar overdueTasks
    if (typeof this.overdueTasks !== 'number' || this.overdueTasks < 0) {
      errors.push('Las tareas vencidas deben ser un número no negativo');
    }

    // Validar onTimeCompletionRate
    if (
      typeof this.onTimeCompletionRate !== 'number' ||
      this.onTimeCompletionRate < 0 ||
      this.onTimeCompletionRate > 100
    ) {
      errors.push('La tasa de completado a tiempo debe estar entre 0 y 100');
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
      GoalId: this.GoalId.trim(),
      currentWeek: this.currentWeek.trim(),
      currentProgress: this.currentProgress,
      currentNotes: this.currentNotes.trim(),
      totalCompletedTasks: this.totalCompletedTasks,
      totalTasks: this.totalTasks,
      missingTasks: this.missingTasks,
      milestones: this.milestones,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      estimatedTimeInvested: this.estimatedTimeInvested,
      qualityScore: this.qualityScore,
      expectedProgress: this.expectedProgress,
      blockers: this.blockers,
      weeklyWins: this.weeklyWins,
      taskBreakdown: this.taskBreakdown,
      overdueTasks: this.overdueTasks,
      onTimeCompletionRate: this.onTimeCompletionRate,
      alerts: this.alerts,
      healthStatus: this.healthStatus,
      history: this.history,
      lastUpdated: this.lastUpdated,
    };
  }
}
