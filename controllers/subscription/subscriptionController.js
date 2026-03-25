import { SubscriptionService } from '../../services/subscriptionService.js';

export class SubscriptionController {
  static async activate(req, res) {
    const result = await SubscriptionService.activateSubscription(req.userId);
    res.status(result.status).json(result);
  }

  static async cancel(req, res) {
    const result = await SubscriptionService.deactivateSubscription(req.userId);
    res.status(result.status).json(result);
  }

  static async getStatus(req, res) {
    const result = await SubscriptionService.getSubscriptionStatus(req.userId);
    res.status(result.status).json(result);
  }
}
