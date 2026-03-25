import chalk from 'chalk';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_API_BASE = 'https://api.mercadopago.com';

const SUBSCRIPTION_CONFIG = {
  reason: 'Nuri Task Premium',
  frequency: 1,
  frequencyType: 'months',
  transactionAmount: 1,
  currencyId: 'ARS',
};

async function mpFetch(path, options = {}) {
  const url = `${MP_API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(chalk.red(`MercadoPago API error [${response.status}]:`, JSON.stringify(data)));
    throw new Error(data.message || `MercadoPago API error: ${response.status}`);
  }

  return data;
}

export class MercadoPagoService {
  static async createSubscription({ payerEmail, externalReference, backUrl, notificationUrl }) {
    return mpFetch('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: SUBSCRIPTION_CONFIG.reason,
        external_reference: externalReference,
        payer_email: payerEmail,
        auto_recurring: {
          frequency: SUBSCRIPTION_CONFIG.frequency,
          frequency_type: SUBSCRIPTION_CONFIG.frequencyType,
          transaction_amount: SUBSCRIPTION_CONFIG.transactionAmount,
          currency_id: SUBSCRIPTION_CONFIG.currencyId,
        },
        back_url: backUrl,
        notification_url: notificationUrl,
      }),
    });
  }

  static async getSubscription(subscriptionId) {
    return mpFetch(`/preapproval/${subscriptionId}`);
  }

  static async cancelSubscription(subscriptionId) {
    return mpFetch(`/preapproval/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  }
}
