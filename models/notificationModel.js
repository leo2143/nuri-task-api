import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      default: '/',
    },
    type: {
      type: String,
      required: true,
      enum: ['due_task', 'streak_risk', 'inactivity', 'streak_increase', 'achievement_completed', 'high_priority_upcoming', 'overdue_task', 'overdue_goal', 'goal_completed', 'empty_goal', 'day_recap', 'due_goal', 'high_priority_upcoming_goal', 'stalled_goal', 'pause_too_long', 'overdue_backlog', 'moodboard_nudge', 'premium_nag', 'achievements_premium_summary'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Solo los jobs programados lo escriben, con null explícito mientras el push está pendiente.
    // Sin default a propósito: las demás notificaciones no llevan el campo y quedan fuera del índice parcial.
    pushSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 });
// Push pendiente de los jobs programados ({ pushSentAt: { $type: 'null' } }, no `pushSentAt: null`, que también matchea ausentes)
notificationSchema.index(
  { type: 1, userId: 1, createdAt: 1 },
  { partialFilterExpression: { pushSentAt: { $type: 'null' } } }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
