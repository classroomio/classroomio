import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET_PREFIX = 'whsec_';
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

function readHeader(headers: Record<string, string>, name: string): string | undefined {
  const wanted = [name, `http-${name}`];
  const entry = Object.entries(headers).find(([key]) => wanted.includes(key.toLowerCase()));

  return entry?.[1];
}

function toSigningKey(secret: string): Buffer {
  return secret.startsWith(SECRET_PREFIX)
    ? Buffer.from(secret.slice(SECRET_PREFIX.length), 'base64')
    : Buffer.from(secret, 'utf8');
}

/**
 * True when one `webhook-signature` entry is a valid v1 HMAC of the raw body and the timestamp is fresh.
 */
export function isValidWebhookSignature(
  secret: string,
  headers: Record<string, string>,
  body: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean {
  const id = readHeader(headers, 'webhook-id');
  const timestamp = readHeader(headers, 'webhook-timestamp');
  const signatures = readHeader(headers, 'webhook-signature');

  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_TIMESTAMP_SKEW_SECONDS) return false;

  const expected = createHmac('sha256', toSigningKey(secret)).update(`${id}.${timestamp}.${body}`).digest();

  return signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',');

    if (version !== 'v1' || !value) return false;

    const candidate = Buffer.from(value, 'base64');

    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}
