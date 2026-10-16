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

function parseIpv6Groups(address: string): number[] | null {
  let text = address;
  const dottedTail = text.match(/(\d+\.\d+\.\d+\.\d+)$/);

  if (dottedTail) {
    const octets = parseIpv4(dottedTail[1]);

    if (!octets) return null;

    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    text = `${text.slice(0, -dottedTail[1].length)}${high}:${low}`;
  }

  const halves = text.split('::');

  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;

  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;

  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail].map((group) =>
    Number.parseInt(group, 16)
  );

  return groups.length === 8 && groups.every((group) => Number.isInteger(group) && group >= 0 && group <= 0xffff)
    ? groups
    : null;
}

function embeddedIpv4(groups: number[]): number[] | null {
  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups;
  const leadingZero = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0;
  const isMapped = leadingZero && g5 === 0xffff;
  const isCompatible = leadingZero && g5 === 0 && (g6 !== 0 || g7 > 1);
  const isNat64 = g0 === 0x64 && g1 === 0xff9b && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0;

  if (isMapped || isCompatible || isNat64) return [g6 >> 8, g6 & 0xff, g7 >> 8, g7 & 0xff];

  if (g0 === 0x2002) return [g1 >> 8, g1 & 0xff, g2 >> 8, g2 & 0xff];

  return null;
}

/**
 * True when the address is loopback, private, link-local, multicast, or otherwise not publicly routable.
 * IPv6 forms that embed an IPv4 address (mapped, compatible, NAT64, 6to4) are judged by the embedded address.
 */
export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();

  if (isIP(normalized) === 4) {
    const parts = parseIpv4(normalized);

    return parts ? isPrivateIpv4(parts) : true;
  }

  if (isIP(normalized) === 6) {
    const groups = parseIpv6Groups(normalized);

    if (!groups) return true;

    const embedded = embeddedIpv4(groups);

    if (embedded) return isPrivateIpv4(embedded);

    return (
      groups.every((group) => group === 0) ||
      (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) ||
      (groups[0] & 0xfe00) === 0xfc00 ||
      (groups[0] & 0xffc0) === 0xfe80 ||
      (groups[0] & 0xff00) === 0xff00
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
