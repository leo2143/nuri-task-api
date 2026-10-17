import { ScheduledNotificationService } from '../../services/scheduledNotificationService.js';
import { NotificationService } from '../../services/notificationService.js';

/**
 * Allowlist de crons de Vercel. Un path = una responsabilidad.
 */
export const CRON_JOBS = {
  'streak-reset': () => ScheduledNotificationService.resetExpiredStreaks(),
  'due-tasks': () => ScheduledNotificationService.checkDueTasks(),
  'due-goals': () => ScheduledNotificationService.checkDueGoals(),
  'overdue-tasks': () => ScheduledNotificationService.checkOverdueTasks(),
  'overdue-goals': () => ScheduledNotificationService.checkOverdueGoals(),
  'empty-goals': () => ScheduledNotificationService.checkEmptyGoals(),
  'high-priority': () => ScheduledNotificationService.checkUpcomingHighPriorityTasks(),
  'high-priority-goals': () => ScheduledNotificationService.checkUpcomingHighPriorityGoals(),
  inactivity: () => ScheduledNotificationService.checkInactiveUsers(),
  'day-recap': () => ScheduledNotificationService.checkDayRecap(),
  'streak-risk': () => ScheduledNotificationService.checkStreaksAtRisk(),
  'stalled-goals': () => ScheduledNotificationService.checkStalledGoals(),
  'pause-too-long': () => ScheduledNotificationService.checkPausedTooLong(),
  'overdue-backlog': () => ScheduledNotificationService.checkOverdueBacklog(),
  'moodboard-nudge': () => ScheduledNotificationService.checkMoodboardNudge(),
  'premium-nag': () => ScheduledNotificationService.checkPremiumNag(),
  'expire-notifications': () => NotificationService.deleteExpired(),
};

/**
 * Jobs de notif en el orden horario de vercel.json (para run-all).
 */
export const DEMO_NOTIFY_JOBS = [
  'due-tasks',
  'due-goals',
  'overdue-tasks',
  'overdue-goals',
  'empty-goals',
  'stalled-goals',
  'high-priority',
  'high-priority-goals',
  'pause-too-long',
  'inactivity',
  'overdue-backlog',
  'moodboard-nudge',
  'premium-nag',
  'day-recap',
  'streak-risk',
];

/** Tipos cron que bloquean dedup, cooldown o skips cruzados. */
export const DEMO_CRON_TYPES = [
  'due_task',
  'due_goal',
  'overdue_task',
  'overdue_goal',
  'empty_goal',
  'high_priority_upcoming',
  'high_priority_upcoming_goal',
  'inactivity',
  'day_recap',
  'streak_risk',
  'stalled_goal',
  'pause_too_long',
  'overdue_backlog',
  'moodboard_nudge',
  'premium_nag',
];
