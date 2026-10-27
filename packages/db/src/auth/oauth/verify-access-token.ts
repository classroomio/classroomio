import { createLocalJWKSet, errors, jwtVerify, type JSONWebKeySet } from 'jose';

import { MCP_RESOURCE, OAUTH_ISSUER, PUBLIC_API_RESOURCE } from '@db/constants';
import { listPublicJwks } from '@db/queries/auth/oauth';
import { OAUTH_API_SCOPES } from './oauth-scopes';

const JWKS_CACHE_TTL_MS = 60 * 1000;

export type OAuthAccessTokenClaims = {
  userId: string;
  clientId: string;
  organizationId: string;
  scopes: string[];
  kind: 'mcp' | 'api';
};

let cachedJwks: { keySet: ReturnType<typeof createLocalJWKSet>; expiresAt: number } | null = null;

async function getKeySet() {
  if (cachedJwks && cachedJwks.expiresAt > Date.now()) return cachedJwks.keySet;

  const keys = await listPublicJwks();
  cachedJwks = { keySet: createLocalJWKSet({ keys } as JSONWebKeySet), expiresAt: Date.now() + JWKS_CACHE_TTL_MS };

  return cachedJwks.keySet;
}

async function verifyWithKeyRefresh(token: string) {
  const options = { issuer: OAUTH_ISSUER, audience: [MCP_RESOURCE, PUBLIC_API_RESOURCE] };

  try {
    const { payload } = await jwtVerify(token, await getKeySet(), options);

    return payload;
  } catch (error) {
    if (!(error instanceof errors.JWKSNoMatchingKey)) throw error;

    cachedJwks = null;
    const { payload } = await jwtVerify(token, await getKeySet(), options);

    return payload;
  }
}

/**
 * Verifies a ClassroomIO-issued OAuth access token for one of the protected resources.
 * Throws when the signature, issuer, audience or expiry is invalid or the token lacks an organization.
 */
export async function verifyOAuthAccessToken(token: string): Promise<OAuthAccessTokenClaims> {
  const payload = await verifyWithKeyRefresh(token);

  const organizationId = payload.org_id;
  const clientId = payload.azp;

  if (typeof payload.sub !== 'string' || typeof organizationId !== 'string' || typeof clientId !== 'string') {
    throw new Error('OAuth access token is missing required claims');
  }

  const grantedScopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
  const scopes = grantedScopes.filter((scope) => OAUTH_API_SCOPES.some((allowed) => allowed === scope));

  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  const kind = audiences.includes(MCP_RESOURCE) ? 'mcp' : 'api';

  return { userId: payload.sub, clientId, organizationId, scopes, kind };
}
