import crypto from 'crypto';
import { SubscriptionService } from '../../services/subscriptionService.js';
import chalk from 'chalk';

const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

function validateHmacSignature(req) {
  if (!MP_WEBHOOK_SECRET) return true;

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  if (!xSignature) return false;

  const parts = xSignature.split(',');
  let ts = null;
  let hash = null;

  for (const part of parts) {
    const [key, value] = part.split('=', 2);
    if (!key || !value) continue;
    const trimmedKey = key.trim();
    if (trimmedKey === 'ts') ts = value.trim();
    else if (trimmedKey === 'v1') hash = value.trim();
  }

  if (!ts || !hash) return false;

  const dataId = req.query['data.id'] || '';
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex');

  return expected === hash;
}

export class WebhookController {
  static async mercadoPago(req, res) {
    if (!validateHmacSignature(req)) {
      console.warn(chalk.yellow('Webhook rechazado: firma HMAC inválida'));
      return res.status(401).json({ error: 'Invalid signature' });
    }

    res.status(200).json({ received: true });

    const { type, data } = req.body;
    if (!type || !data?.id) {
      console.warn(chalk.yellow('Webhook sin type o data.id:', JSON.stringify(req.body)));
      return;
    }

    console.log(chalk.blue(`Webhook MP recibido: type=${type}, data.id=${data.id}`));

    try {
      await SubscriptionService.processWebhook(type, data.id);
    } catch (error) {
      console.error(chalk.red('Error procesando webhook MP:', error.message));
    }
  }
}
