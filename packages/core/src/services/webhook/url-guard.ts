import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type TWebhookUrlPolicy = { allowPrivateNetworks: boolean };

export class WebhookUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookUrlError';
  }
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);
const BLOCKED_HOSTNAME_SUFFIXES = ['.localhost', '.local', '.internal'];

function parseIpv4(address: string): number[] | null {
  const parts = address.split('.').map(Number);

  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? parts : null;
}

function isPrivateIpv4(parts: number[]): boolean {
  const [first, second] = parts;

  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 100 && second >= 64 && second <= 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 192 && second === 0) return true;
  if (first === 198 && (second === 18 || second === 19)) return true;

  return first >= 224;
}

/**
 * True when the address is loopback, private, link-local, multicast, or otherwise not publicly routable.
 */
export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mappedIpv4) return isPrivateAddress(mappedIpv4[1]);

  if (isIP(normalized) === 4) {
    const parts = parseIpv4(normalized);

    return parts ? isPrivateIpv4(parts) : true;
  }

  if (isIP(normalized) === 6) {
    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb') ||
      normalized.startsWith('ff')
    );
  }

  return true;
}

/**
 * Validates the URL shape without resolving DNS. Use {@link resolveWebhookTarget} before connecting.
 * Throws {@link WebhookUrlError} with a user-presentable message.
 */
export function assertWebhookUrlShape(rawUrl: string, policy: TWebhookUrlPolicy): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new WebhookUrlError('Payload URL is not a valid URL');
  }

  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && policy.allowPrivateNetworks)) {
    throw new WebhookUrlError('Payload URL must use https');
  }

  if (parsed.username || parsed.password) {
    throw new WebhookUrlError('Payload URL must not contain credentials');
  }

  if (policy.allowPrivateNetworks) return parsed;

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new WebhookUrlError('Payload URL must not point to a local or internal host');
  }

  if (isIP(hostname) && isPrivateAddress(hostname)) {
    throw new WebhookUrlError('Payload URL must not point to a private network address');
  }

  return parsed;
}

/**
 * Resolves the hostname and rejects it when any answer is a private address, returning
 * a vetted address to connect to so a later DNS change cannot redirect the request.
 */
export async function resolveWebhookTarget(
  url: URL,
  policy: TWebhookUrlPolicy
): Promise<{ address: string; family: 4 | 6 }> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const literalFamily = isIP(hostname);

  if (literalFamily) {
    if (!policy.allowPrivateNetworks && isPrivateAddress(hostname)) {
      throw new WebhookUrlError('Payload URL must not point to a private network address');
    }

    return { address: hostname, family: literalFamily as 4 | 6 };
  }

  let answers: { address: string; family: number }[];

  try {
    answers = await lookup(hostname, { all: true });
  } catch {
    throw new WebhookUrlError('Payload URL host could not be resolved');
  }

  if (answers.length === 0) {
    throw new WebhookUrlError('Payload URL host could not be resolved');
  }

  if (!policy.allowPrivateNetworks && answers.some((answer) => isPrivateAddress(answer.address))) {
    throw new WebhookUrlError('Payload URL must not point to a private network address');
  }

  return { address: answers[0].address, family: answers[0].family as 4 | 6 };
}
