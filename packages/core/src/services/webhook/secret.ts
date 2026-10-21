import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { env } from '../../config/env';

const SECRET_PURPOSE = 'webhook-secret';
const VERSION = 'v1';

function deriveKey(): Buffer {
  const serverKey = env.PRIVATE_SERVER_KEY;

  if (!serverKey) {
    throw new Error('PRIVATE_SERVER_KEY is required to store webhook secrets');
  }

  return createHash('sha256').update(`${SECRET_PURPOSE}:${serverKey}`).digest();
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('base64')}`;
}

/**
 * Encrypts a signing secret with AES-256-GCM keyed from PRIVATE_SERVER_KEY.
 * Throws when PRIVATE_SERVER_KEY is not configured.
 */
export function encryptWebhookSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

/**
 * Reverses {@link encryptWebhookSecret}. Throws on a malformed or tampered value.
 */
export function decryptWebhookSecret(encoded: string): string {
  const [version, iv, tag, ciphertext] = encoded.split('.');

  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Unsupported webhook secret format');
  }

  const decipher = createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));

  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}
