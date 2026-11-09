/**
 * DTO para el dashboard de métricas del usuario
 */
export class MetricsDashboardDto {
  /**
   * @param {Object} metrics - Documento de métricas con el usuario populado
   * @param {string} timeZone - Zona del usuario, para calcular la racha efectiva
   */
  constructor(metrics, timeZone) {
    this.user = {
      name: metrics.userId.name,
      email: metrics.userId.email,
    };
    this.activity = {
      totalTasksCompleted: metrics.totalTasksCompleted,
      totalGoalsCompleted: metrics.totalGoalsCompleted,
      lastActivityDate: metrics.lastActivityDate,
    };
    this.streaks = {
      current: metrics.getEffectiveStreak(timeZone),
      best: metrics.bestStreak,
    };
    this.history = metrics.history.slice(-30);
  }

  static fromMetrics(metrics, timeZone) {
    return new MetricsDashboardDto(metrics, timeZone);
  }
}
