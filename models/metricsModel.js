import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Metric
 * @typedef {Object} MetricSchema
 * @property {mongoose.Types.ObjectId} GoalId - ID de la meta (requerido, único)
 * @property {string} currentWeek - Semana actual
 * @property {number} currentProgress - Progreso actual (0-100)
 * @property {string} currentNotes - Notas actuales
 * @property {number} totalCompletedTasks - Total de tareas completadas
 * @property {number} totalTasks - Total de tareas
 * @property {number} missingTasks - Tareas faltantes
 * @property {number} averageWeeklyProgress - Progreso promedio por semana
 * @property {string} progressTrend - Tendencia del progreso (improving/declining/stable/stagnant)
 * @property {number} taskCompletionRate - Tasa de completado de tareas por semana
 * @property {Array} milestones - Hitos de la meta
 * @property {number} currentStreak - Racha actual de semanas con progreso
 * @property {number} bestStreak - Mejor racha histórica
 * @property {number} estimatedTimeInvested - Tiempo estimado invertido (horas)
 * @property {number} efficiency - Eficiencia (progreso/tiempo)
 * @property {number} qualityScore - Puntuación de calidad (0-5)
 * @property {Date} projectedCompletionDate - Fecha estimada de completado
 * @property {number} expectedProgress - Progreso esperado según timeline
 * @property {number} progressDeviation - Desviación del plan
 * @property {Array} blockers - Obstáculos actuales
 * @property {Array} weeklyWins - Logros de la semana
 * @property {Object} taskBreakdown - Distribución de tareas por prioridad
 * @property {number} overdueTasks - Tareas vencidas
 * @property {number} onTimeCompletionRate - Porcentaje de tareas completadas a tiempo
 * @property {Array} alerts - Alertas y notificaciones
 * @property {string} healthStatus - Estado de salud general (excellent/good/at-risk/critical)
 * @property {Array} history - Historial de progreso semanal
 * @property {Date} lastUpdated - Fecha de última actualización
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de metrica para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de metrica
 * Cada meta tiene UNA métrica que se actualiza con el progreso
 * @constant {mongoose.Schema} metricsSchema
 */
const metricsSchema = new mongoose.Schema(
  {
    GoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
      unique: true, // Una métrica por meta
    },
    currentWeek: {
      type: String,
      required: true,
    },
    currentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentNotes: {
      type: String,
      trim: true,
      default: '',
    },
    totalCompletedTasks: {
      type: Number,
      default: 0,
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    missingTasks: {
      type: Number,
      default: 0,
    },

    // ========== MÉTRICAS DE VELOCIDAD Y TENDENCIAS ==========
    averageWeeklyProgress: {
      type: Number,
      min: 0,
      default: 0,
    },
    progressTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'stagnant'],
      default: 'stable',
    },
    taskCompletionRate: {
      type: Number,
      default: 0,
    },

    // ========== HITOS Y LOGROS ==========
    milestones: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        targetProgress: {
          type: Number,
          min: 0,
          max: 100,
        },
        achieved: {
          type: Boolean,
          default: false,
        },
        achievedDate: {
          type: Date,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    currentStreak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },

    // ========== MÉTRICAS DE CALIDAD Y EFICIENCIA ==========
    estimatedTimeInvested: {
      type: Number,
      default: 0,
    },
    efficiency: {
      type: Number,
      default: 0,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    // ========== PREDICCIONES Y PROYECCIONES ==========
    projectedCompletionDate: {
      type: Date,
    },
    expectedProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    progressDeviation: {
      type: Number,
      default: 0,
    },

    // ========== CONTEXTO Y NOTAS ENRIQUECIDAS ==========
    blockers: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          default: 'medium',
        },
        resolved: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        resolvedAt: {
          type: Date,
        },
      },
    ],
    weeklyWins: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        week: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ========== ANÁLISIS DE TAREAS ==========
    taskBreakdown: {
      highPriority: {
        type: Number,
        default: 0,
      },
      mediumPriority: {
        type: Number,
        default: 0,
      },
      lowPriority: {
        type: Number,
        default: 0,
      },
    },
    overdueTasks: {
      type: Number,
      default: 0,
    },
    onTimeCompletionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ========== ALERTAS Y NOTIFICACIONES ==========
    alerts: [
      {
        type: {
          type: String,
          enum: ['warning', 'danger', 'info', 'success'],
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    healthStatus: {
      type: String,
      enum: ['excellent', 'good', 'at-risk', 'critical'],
      default: 'good',
    },

    // ========== HISTORIAL MEJORADO ==========
    history: [
      {
        week: {
          type: String,
          required: true,
        },
        totalCompletedTasks: {
          type: Number,
          default: 0,
        },
        totalTasks: {
          type: Number,
          default: 0,
        },
        missingTasks: {
          type: Number,
          default: 0,
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        timeInvested: {
          type: Number,
          default: 0,
        },
        notes: {
          type: String,
          trim: true,
        },
        mood: {
          type: String,
          enum: ['motivated', 'neutral', 'challenged', 'frustrated'],
        },
        achievements: [String],
      },
    ],

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========== MÉTODOS DEL ESQUEMA ==========

/**
 * Calcula el progreso promedio semanal basado en el historial
 * @method calculateAverageWeeklyProgress
 * @returns {number} Progreso promedio por semana
 */
metricsSchema.methods.calculateAverageWeeklyProgress = function () {
  if (this.history.length === 0) return 0;
  const totalProgress = this.history.reduce((sum, entry) => sum + (entry.progress || 0), 0);
  return Math.round((totalProgress / this.history.length) * 100) / 100;
};

/**
 * Calcula la tendencia del progreso comparando las últimas semanas
 * @method calculateProgressTrend
 * @returns {string} 'improving', 'declining', 'stable', o 'stagnant'
 */
metricsSchema.methods.calculateProgressTrend = function () {
  if (this.history.length < 2) return 'stable';

  const recentHistory = this.history.slice(-4); // Últimas 4 semanas
  const differences = [];

  for (let i = 1; i < recentHistory.length; i++) {
    differences.push(recentHistory[i].progress - recentHistory[i - 1].progress);
  }

  const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;

  if (avgDifference > 5) return 'improving';
  if (avgDifference < -5) return 'declining';
  if (Math.abs(avgDifference) < 1) return 'stagnant';
  return 'stable';
};

/**
 * Calcula la tasa de completado de tareas por semana
 * @method calculateTaskCompletionRate
 * @returns {number} Tareas completadas por semana
 */
metricsSchema.methods.calculateTaskCompletionRate = function () {
  if (this.history.length === 0) return 0;
  const totalCompleted = this.history.reduce((sum, entry) => sum + (entry.totalCompletedTasks || 0), 0);
  return Math.round((totalCompleted / this.history.length) * 100) / 100;
};

/**
 * Calcula la eficiencia (progreso por hora invertida)
 * @method calculateEfficiency
 * @returns {number} Eficiencia del progreso
 */
metricsSchema.methods.calculateEfficiency = function () {
  if (this.estimatedTimeInvested === 0) return 0;
  return Math.round((this.currentProgress / this.estimatedTimeInvested) * 100) / 100;
};

/**
 * Calcula la fecha proyectada de completado basada en la velocidad actual
 * @method calculateProjectedCompletion
 * @param {Date} dueDate - Fecha límite de la meta
 * @returns {Date|null} Fecha estimada de completado
 */
metricsSchema.methods.calculateProjectedCompletion = function (dueDate) {
  if (this.averageWeeklyProgress === 0 || this.currentProgress === 100) return null;

  const remainingProgress = 100 - this.currentProgress;
  const weeksNeeded = remainingProgress / this.averageWeeklyProgress;
  const daysNeeded = weeksNeeded * 7;

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysNeeded);

  return projectedDate;
};

/**
 * Calcula el progreso esperado basado en el timeline de la meta
 * @method calculateExpectedProgress
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} dueDate - Fecha límite
 * @returns {number} Progreso esperado (0-100)
 */
metricsSchema.methods.calculateExpectedProgress = function (startDate, dueDate) {
  if (!startDate || !dueDate) return 0;

  const now = new Date();
  const totalTime = dueDate - startDate;
  const elapsedTime = now - startDate;

  if (elapsedTime <= 0) return 0;
  if (elapsedTime >= totalTime) return 100;

  return Math.round((elapsedTime / totalTime) * 100);
};

/**
 * Calcula la desviación del progreso respecto al plan
 * @method calculateProgressDeviation
 * @returns {number} Desviación (negativo = atrasado, positivo = adelantado)
 */
metricsSchema.methods.calculateProgressDeviation = function () {
  return this.currentProgress - this.expectedProgress;
};

/**
 * Calcula el estado de salud de la métrica
 * @method calculateHealthStatus
 * @returns {string} 'excellent', 'good', 'at-risk', o 'critical'
 */
metricsSchema.methods.calculateHealthStatus = function () {
  const deviation = this.progressDeviation;
  const activeBlockers = this.blockers.filter(b => !b.resolved).length;
  const criticalBlockers = this.blockers.filter(b => !b.resolved && b.severity === 'critical').length;

  // Criterios para determinar salud
  if (criticalBlockers > 0 || deviation < -30) return 'critical';
  if (activeBlockers > 2 || deviation < -15) return 'at-risk';
  if (deviation > 10 && activeBlockers === 0) return 'excellent';
  return 'good';
};

/**
 * Actualiza la racha actual de progreso
 * @method updateStreak
 */
metricsSchema.methods.updateStreak = function () {
  if (this.history.length === 0) {
    this.currentStreak = 0;
    return;
  }

  let streak = 0;
  for (let i = this.history.length - 1; i >= 0; i--) {
    if (this.history[i].progress > 0) {
      streak++;
    } else {
      break;
    }
  }

  this.currentStreak = streak;
  if (streak > this.bestStreak) {
    this.bestStreak = streak;
  }
};

/**
 * Verifica y actualiza hitos alcanzados
 * @method checkMilestones
 */
metricsSchema.methods.checkMilestones = function () {
  this.milestones.forEach(milestone => {
    if (!milestone.achieved && this.currentProgress >= milestone.targetProgress) {
      milestone.achieved = true;
      milestone.achievedDate = new Date();

      // Agregar alerta de éxito
      this.alerts.push({
        type: 'success',
        message: `¡Hito alcanzado: ${milestone.name}!`,
        acknowledged: false,
      });
    }
  });
};

/**
 * Agrega alertas automáticas basadas en el estado de la métrica
 * @method generateAutoAlerts
 */
metricsSchema.methods.generateAutoAlerts = function () {
  const activeBlockers = this.blockers.filter(b => !b.resolved);
  const criticalBlockers = activeBlockers.filter(b => b.severity === 'critical');

  // Alertas por bloqueadores críticos
  if (criticalBlockers.length > 0) {
    const existingAlert = this.alerts.find(a => a.message.includes('bloqueadores críticos') && !a.acknowledged);
    if (!existingAlert) {
      this.alerts.push({
        type: 'danger',
        message: `Hay ${criticalBlockers.length} bloqueadores críticos sin resolver`,
        acknowledged: false,
      });
    }
  }

  // Alertas por retraso
  if (this.progressDeviation < -20) {
    const existingAlert = this.alerts.find(a => a.message.includes('progreso esperado') && !a.acknowledged);
    if (!existingAlert) {
      this.alerts.push({
        type: 'warning',
        message: `El progreso está ${Math.abs(this.progressDeviation).toFixed(1)}% por debajo del esperado`,
        acknowledged: false,
      });
    }
  }

  // Alertas por estancamiento
  if (this.progressTrend === 'stagnant') {
    const existingAlert = this.alerts.find(a => a.message.includes('estancado') && !a.acknowledged);
    if (!existingAlert) {
      this.alerts.push({
        type: 'warning',
        message: 'El progreso se ha estancado en las últimas semanas',
        acknowledged: false,
      });
    }
  }

  // Limpiar alertas antiguas (más de 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  this.alerts = this.alerts.filter(alert => alert.createdAt > thirtyDaysAgo);
};

// ========== HOOKS PRE-SAVE ==========

/**
 * Hook pre-save para actualizar métricas calculadas automáticamente
 */
metricsSchema.pre('save', function (next) {
  // Actualizar métricas calculadas
  this.averageWeeklyProgress = this.calculateAverageWeeklyProgress();
  this.progressTrend = this.calculateProgressTrend();
  this.taskCompletionRate = this.calculateTaskCompletionRate();
  this.efficiency = this.calculateEfficiency();

  // Actualizar rachas
  this.updateStreak();

  // Verificar hitos
  this.checkMilestones();

  // Generar alertas automáticas
  this.generateAutoAlerts();

  // Actualizar estado de salud
  this.healthStatus = this.calculateHealthStatus();

  // Actualizar lastUpdated
  this.lastUpdated = new Date();

  next();
});

// ========== PROPIEDADES VIRTUALES ==========

/**
 * Obtiene el porcentaje de completado de tareas actual
 */
metricsSchema.virtual('currentCompletionPercentage').get(function () {
  if (this.totalTasks === 0) return 0;
  return Math.round((this.totalCompletedTasks / this.totalTasks) * 100);
});

/**
 * Obtiene el número de bloqueadores activos
 */
metricsSchema.virtual('activeBlockersCount').get(function () {
  return this.blockers.filter(b => !b.resolved).length;
});

/**
 * Obtiene el número de alertas no confirmadas
 */
metricsSchema.virtual('unacknowledgedAlertsCount').get(function () {
  return this.alerts.filter(a => !a.acknowledged).length;
});

/**
 * Obtiene si está en riesgo de no cumplir el deadline
 */
metricsSchema.virtual('isAtRisk').get(function () {
  return this.healthStatus === 'at-risk' || this.healthStatus === 'critical';
});

// Configurar para que los virtuals se incluyan en JSON y Object
metricsSchema.set('toJSON', { virtuals: true });
metricsSchema.set('toObject', { virtuals: true });

/**
 * Modelo de Métrica para MongoDB
 * @class Metric
 * @extends mongoose.Model
 * @description Modelo que representa una métrica única por meta en la base de datos
 * La métrica se actualiza con el progreso y mantiene un historial
 * @example
 * // Crear una nueva métrica para una meta
 * const metric = new Metrics({
 *   GoalId: '68d1e7f577ec3fe8073cef21',
 *   currentWeek: 'Semana 1',
 *   currentProgress: 15,
 *   currentNotes: 'Buen inicio',
 *   history: []
 * });
 *
 * // Los métodos calculan automáticamente en el hook pre-save
 * await metric.save();
 *
 * // O calcular manualmente
 * const avgProgress = metric.calculateAverageWeeklyProgress();
 * const trend = metric.calculateProgressTrend();
 * const health = metric.calculateHealthStatus();
 */
const Metrics = mongoose.model('Metrics', metricsSchema);
export default Metrics;
