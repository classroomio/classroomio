import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signs `<timestamp>.<body>` with HMAC-SHA256 and returns the `sha256=<hex>` header value.
 */
export function signWebhookPayload(secret: string, timestamp: number, body: string): string {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  return `sha256=${digest}`;
}

export function verifyWebhookSignature(secret: string, timestamp: number, body: string, signature: string): boolean {
  const expected = Buffer.from(signWebhookPayload(secret, timestamp, body));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
