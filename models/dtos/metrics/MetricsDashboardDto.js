/**
 * DTO para el dashboard de métricas del usuario
 */
export class MetricsDashboardDto {
  constructor(metrics) {
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
      current: metrics.currentStreak,
      best: metrics.bestStreak,
    };
    this.history = metrics.history.slice(-30);
  }

  static fromMetrics(metrics) {
    return new MetricsDashboardDto(metrics);
  }
}
