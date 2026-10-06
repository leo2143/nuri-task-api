import Todo from '../../models/todoModel.js';
import Goal from '../../models/goalsModel.js';
import Moodboard from '../../models/moodboardModel.js';
import Notification from '../../models/notificationModel.js';
import Metrics from '../../models/metricsModel.js';
import PushSubscription from '../../models/pushSubscriptionModel.js';
import UserAchievement from '../../models/userAchievementModel.js';
import PendingCloudinaryImage from '../../models/pendingCloudinaryImageModel.js';
import Streak from '../../models/streaksModel.js';

/**
 * Borra documentos hijos del usuario. Idempotente: se puede reintentar.
 * El User (padre) se borra aparte, al final.
 */
export async function deleteUserOwnedDocuments(userId) {
  await Promise.all([
    Todo.deleteMany({ userId }),
    Goal.deleteMany({ userId }),
    Moodboard.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    Metrics.deleteMany({ userId }),
    PushSubscription.deleteMany({ userId }),
    UserAchievement.deleteMany({ user: userId }),
    PendingCloudinaryImage.deleteMany({ userId }),
    Streak.deleteMany({ userId }),
  ]);
}
