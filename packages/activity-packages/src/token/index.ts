import { PackageError } from '../errors.js';

export type LaunchMode = 'normal' | 'review' | 'preview';

export interface ActivityLaunchClaims {
  org: string;
  act: string;
  att?: string;
  sub: string;
  unit: string;
  fmt: string;
  mode: LaunchMode;
  anc: string[];
  exp: number;
  typ?: string;
}

export interface ContentTokenClaims {
  org: string;
  p: string;
  anc: string[];
  wk: number;
}

export const LAUNCH_TOKEN_TTL_SECONDS = 12 * 60 * 60;

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new PackageError('invalid_token', { reason: 'webcrypto_unavailable' });
  }

  return subtle;
}

async function importSecret(secret: string): Promise<CryptoKey> {
  return getSubtle().importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify'
  ]);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(segment: string): Uint8Array {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}

/**
 * Signs a JSON payload as `base64url(body).base64url(hmac)`. Deterministic:
 * the same payload and secret always produce the same token.
 */
export async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await importSecret(secret);
  const signature = new Uint8Array(await getSubtle().sign('HMAC', key, new TextEncoder().encode(body)));

  return `${body}.${bytesToBase64Url(signature)}`;
}

/**
 * Verifies a token signature and returns its payload. Throws
 * `invalid_token` on any mismatch or malformed input.
 */
export async function verifyToken<T = Record<string, unknown>>(token: string, secret: string): Promise<T> {
  const [body, signature] = token.split('.');

  if (!body || !signature) {
    throw new PackageError('invalid_token', { reason: 'bad_shape' });
  }

  let payloadBytes: Uint8Array;
  let signatureBytes: Uint8Array;

  try {
    payloadBytes = base64UrlToBytes(body);
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    throw new PackageError('invalid_token', { reason: 'bad_encoding' });
  }

  const key = await importSecret(secret);
  const expected = new Uint8Array(await getSubtle().sign('HMAC', key, new TextEncoder().encode(body)));

  if (!timingSafeEqual(signatureBytes, expected)) {
    throw new PackageError('invalid_token', { reason: 'bad_signature' });
  }

  try {
    return JSON.parse(new TextDecoder().decode(payloadBytes)) as T;
  } catch {
    throw new PackageError('invalid_token', { reason: 'bad_payload' });
  }
}

export interface MintLaunchTokenInput {
  org: string;
  act: string;
  att?: string;
  sub: string;
  unit: string;
  fmt: string;
  mode: LaunchMode;
  anc: string[];
}

/**
 * Mints a per-launch token for the player page and run-time routes. Valid
 * for 12 hours from minting.
 */
export async function mintLaunchToken(
  input: MintLaunchTokenInput,
  secret: string,
  nowMs: number = Date.now()
): Promise<string> {
  const claims: ActivityLaunchClaims = {
    org: input.org,
    act: input.act,
    ...(input.att ? { att: input.att } : {}),
    sub: input.sub,
    unit: input.unit,
    fmt: input.fmt,
    mode: input.mode,
    anc: [...input.anc].sort(),
    exp: Math.floor(nowMs / 1000) + LAUNCH_TOKEN_TTL_SECONDS,
    typ: 'launch'
  };

  return signToken(claims as unknown as Record<string, unknown>, secret);
}

/**
 * Verifies a launch token and returns its claims. Throws `expired_token`
 * past expiry, `invalid_token` otherwise — including a present-but-foreign
 * `typ`, so launch tokens can never pass as another token kind. Tokens
 * minted before the type claim existed carry no `typ` and stay valid until
 * they expire naturally.
 */
export async function verifyLaunchToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): Promise<ActivityLaunchClaims> {
  const claims = await verifyToken<ActivityLaunchClaims>(token, secret);

  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= nowMs) {
    throw new PackageError('expired_token');
  }

  if (claims.typ !== undefined && claims.typ !== 'launch') {
    throw new PackageError('invalid_token', { reason: 'wrong_type' });
  }

  return claims;
}

/**
 * Monday-anchored ISO week index. Consecutive weeks differ by exactly one,
 * including across year boundaries.
 */
export function isoWeekIndex(date: Date): number {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (day.getUTCDay() + 6) % 7;

  day.setUTCDate(day.getUTCDate() - weekday + 3);

  return Math.floor(day.getTime() / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Mints the shared per-version content token. Deterministic for its week so
 * every learner and launch reuses the same file URLs until it rolls over.
 */
export async function mintContentToken(
  input: { org: string; prefix: string; anc: string[] },
  secret: string,
  nowMs: number = Date.now()
): Promise<string> {
  const claims: ContentTokenClaims = {
    org: input.org,
    p: input.prefix,
    anc: [...input.anc].sort(),
    wk: isoWeekIndex(new Date(nowMs))
  };

  return signToken(claims as unknown as Record<string, unknown>, secret);
}

export interface ExpectedContentToken {
  org: string;
  prefix: string;
}

/**
 * Verifies a content token against its organization and storage prefix. A
 * token is accepted in its mint week and the week after.
 */
export async function verifyContentToken(
  token: string,
  secret: string,
  expected: ExpectedContentToken,
  nowMs: number = Date.now()
): Promise<ContentTokenClaims> {
  const claims = await verifyToken<ContentTokenClaims>(token, secret);

  if (claims.org !== expected.org || claims.p !== expected.prefix) {
    throw new PackageError('invalid_token', { reason: 'wrong_scope' });
  }

  const age = isoWeekIndex(new Date(nowMs)) - claims.wk;

  if (!Number.isInteger(claims.wk) || age < 0 || age > 1) {
    throw new PackageError('expired_token');
  }

  return claims;
}
