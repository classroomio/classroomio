import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signs `<timestamp>.<body>` with HMAC-SHA256 and returns the `sha256=<hex>` header value.
 */
export function signWebhookPayload(secret: string, timestamp: number, body: string): string {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  return `sha256=${digest}`;
}

const SECRET_PREFIX = 'whsec_';
const BASE64_PATTERN = /^[A-Za-z0-9+/_-]+={0,2}$/;

function deriveStandardWebhooksKey(secret: string): Buffer {
  const encodedKey = secret.startsWith(SECRET_PREFIX) ? secret.slice(SECRET_PREFIX.length) : '';

  return BASE64_PATTERN.test(encodedKey) ? Buffer.from(encodedKey, 'base64') : Buffer.from(secret, 'utf8');
}

/**
 * Signs `<messageId>.<timestamp>.<body>` the way the Standard Webhooks spec describes and returns the
 * `v1,<base64>` header value. The key is the base64 part of a `whsec_` secret; any other secret is used as is.
 */
export function signStandardWebhookPayload(secret: string, messageId: string, timestamp: number, body: string): string {
  const digest = createHmac('sha256', deriveStandardWebhooksKey(secret))
    .update(`${messageId}.${timestamp}.${body}`)
    .digest('base64');

  return `v1,${digest}`;
}

export function verifyWebhookSignature(secret: string, timestamp: number, body: string, signature: string): boolean {
  const expected = Buffer.from(signWebhookPayload(secret, timestamp, body));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
