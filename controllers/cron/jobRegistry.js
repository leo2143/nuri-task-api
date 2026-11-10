import { ScheduledNotificationService } from '../../services/scheduledNotificationService.js';
import { NotificationService } from '../../services/notificationService.js';

/**
 * Registro de jobs programados. Una sola fuente para el dispatcher, las corridas manuales y las demos.
 *
 * Cada job declara cuándo corre:
 * - `scope: 'timezone'`: corre una vez por zona y día local, cuando en esa zona son las `localHour` (0-23).
 *   `run` recibe el contexto `{ userIds, timezone, localDate, now }` (ver ScheduledNotificationService).
 * - `scope: 'global'`: no depende de una zona; corre cuando en UTC son las `utcHour`.
 *
 * `notificationType` es el tipo de notificación que produce el job: el runner lo usa para empujar los push
 * que hayan quedado pendientes, aunque el job termine sin crear nada nuevo.
 *
 * Las horas locales son las de los crons previos (que estaban fijos en UTC-3).
 */
export const JOB_REGISTRY = {
  'due-tasks': {
    scope: 'timezone',
    localHour: 0,
    notificationType: 'due_task',
    run: context => ScheduledNotificationService.checkDueTasks(context),
  },
  'due-goals': {
    scope: 'timezone',
    localHour: 1,
    notificationType: 'due_goal',
    run: context => ScheduledNotificationService.checkDueGoals(context),
  },
  'overdue-tasks': {
    scope: 'timezone',
    localHour: 3,
    notificationType: 'overdue_task',
    run: context => ScheduledNotificationService.checkOverdueTasks(context),
  },
  'overdue-goals': {
    scope: 'timezone',
    localHour: 6,
    notificationType: 'overdue_goal',
    run: context => ScheduledNotificationService.checkOverdueGoals(context),
  },
  'empty-goals': {
    scope: 'timezone',
    localHour: 7,
    notificationType: 'empty_goal',
    run: context => ScheduledNotificationService.checkEmptyGoals(context),
  },
  'stalled-goals': {
    scope: 'timezone',
    localHour: 8,
    notificationType: 'stalled_goal',
    run: context => ScheduledNotificationService.checkStalledGoals(context),
  },
  'high-priority': {
    scope: 'timezone',
    localHour: 9,
    notificationType: 'high_priority_upcoming',
    run: context => ScheduledNotificationService.checkUpcomingHighPriorityTasks(context),
  },
  'high-priority-goals': {
    scope: 'timezone',
    localHour: 10,
    notificationType: 'high_priority_upcoming_goal',
    run: context => ScheduledNotificationService.checkUpcomingHighPriorityGoals(context),
  },
  'pause-too-long': {
    scope: 'timezone',
    localHour: 11,
    notificationType: 'pause_too_long',
    run: context => ScheduledNotificationService.checkPausedTooLong(context),
  },
  inactivity: {
    scope: 'timezone',
    localHour: 12,
    notificationType: 'inactivity',
    run: context => ScheduledNotificationService.checkInactiveUsers(context),
  },
  'overdue-backlog': {
    scope: 'timezone',
    localHour: 13,
    notificationType: 'overdue_backlog',
    run: context => ScheduledNotificationService.checkOverdueBacklog(context),
  },
  'moodboard-nudge': {
    scope: 'timezone',
    localHour: 14,
    notificationType: 'moodboard_nudge',
    run: context => ScheduledNotificationService.checkMoodboardNudge(context),
  },
  'premium-nag': {
    scope: 'timezone',
    localHour: 15,
    notificationType: 'premium_nag',
    run: context => ScheduledNotificationService.checkPremiumNag(context),
  },
  'day-recap': {
    scope: 'timezone',
    localHour: 19,
    notificationType: 'day_recap',
    run: context => ScheduledNotificationService.checkDayRecap(context),
  },
  'streak-risk': {
    scope: 'timezone',
    localHour: 20,
    notificationType: 'streak_risk',
    run: context => ScheduledNotificationService.checkStreaksAtRisk(context),
  },
  'expire-notifications': {
    scope: 'global',
    utcHour: 2,
    run: () => NotificationService.deleteExpired(),
  },
};
