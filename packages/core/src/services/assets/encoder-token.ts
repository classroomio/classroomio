import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Per-job credential for the HLS encoder.
 *
 * The encoder runs attacker-supplied media through ffmpeg, so it is treated as
 * the least trusted process we operate: it holds no database URL, no Redis URL
 * and no long-lived storage keys. Everything it needs comes from this token,
 * which is HMAC-signed, expires, and names exactly one asset — so compromising
 * the encoder yields one asset, not the estate.
 *
 * Mirrors the `cio_hls` token in `assets.ts`, which solves the same problem for
 * playback.
 */
const TOKEN_TTL_SECONDS = 6 * 60 * 60;

export interface EncoderJobTokenPayload {
  /** Asset the job may read and finalize. */
  assetId: string;
  /** Organization the asset belongs to, so the API needn't trust a query param. */
  organizationId: string;
  expSeconds: number;
}

function getSecret(): string | null {
  return process.env.HLS_SIGNING_SECRET ?? null;
}

function base64UrlEncode(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(secret: string, message: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(message).digest());
}

export function mintEncoderJobToken(input: {
  assetId: string;
  organizationId: string;
}): { token: string; expiresAt: string } | null {
  const secret = getSecret();
  if (!secret) return null;

  const expSeconds = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = base64UrlEncode(
    Buffer.from(JSON.stringify({ aid: input.assetId, oid: input.organizationId, exp: expSeconds }))
  );

  return {
    token: `${payload}.${sign(secret, payload)}`,
    expiresAt: new Date(expSeconds * 1000).toISOString()
  };
}

export function verifyEncoderJobToken(token: string): EncoderJobTokenPayload | null {
  const secret = getSecret();
  if (!secret) return null;

  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(secret, payload);

  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      aid?: unknown;
      oid?: unknown;
      exp?: unknown;
    };

    if (typeof decoded.aid !== 'string' || typeof decoded.oid !== 'string' || typeof decoded.exp !== 'number') {
      return null;
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;

    return { assetId: decoded.aid, organizationId: decoded.oid, expSeconds: decoded.exp };
  } catch {
    return null;
  }
}
