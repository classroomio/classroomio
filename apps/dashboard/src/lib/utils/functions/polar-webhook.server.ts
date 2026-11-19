import { Webhook, WebhookVerificationError } from 'standardwebhooks';
import type { PolarWebhookPayload } from '$lib/utils/types/polar';

/**
 * Verifies a Polar webhook signature and returns the raw event JSON.
 * The Polar SDK's `validateEvent` also schema-validates the body and rejects events
 * whose price shapes it does not know, so the payload is only signature-checked here.
 */
export function verifyPolarWebhook(
  body: string,
  headers: Record<string, string>,
  secret: string
): PolarWebhookPayload | null {
  try {
    const webhook = new Webhook(Buffer.from(secret, 'utf-8').toString('base64'));

    return webhook.verify(body, headers) as PolarWebhookPayload;
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return null;
    }

    throw error;
  }
}
