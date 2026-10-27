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
  issuedAt: number;
};

export type OAuthResourceKind = OAuthAccessTokenClaims['kind'] | 'any';

const RESOURCE_BY_KIND = { mcp: MCP_RESOURCE, api: PUBLIC_API_RESOURCE } as const;

function getAudiences(resource: OAuthResourceKind): string[] {
  return resource === 'any' ? [MCP_RESOURCE, PUBLIC_API_RESOURCE] : [RESOURCE_BY_KIND[resource]];
}

let cachedJwks: { keySet: ReturnType<typeof createLocalJWKSet>; expiresAt: number } | null = null;

async function getKeySet() {
  if (cachedJwks && cachedJwks.expiresAt > Date.now()) return cachedJwks.keySet;

  const keys = await listPublicJwks();
  cachedJwks = { keySet: createLocalJWKSet({ keys } as JSONWebKeySet), expiresAt: Date.now() + JWKS_CACHE_TTL_MS };

  return cachedJwks.keySet;
}

async function verifyWithKeyRefresh(token: string, resource: OAuthResourceKind) {
  const options = { issuer: OAUTH_ISSUER, audience: getAudiences(resource) };

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
 * Verifies a ClassroomIO-issued OAuth access token for the given protected resource.
 * Throws when the signature, issuer, audience or expiry is invalid or the token lacks an organization.
 */
export async function verifyOAuthAccessToken(
  token: string,
  resource: OAuthResourceKind
): Promise<OAuthAccessTokenClaims> {
  const payload = await verifyWithKeyRefresh(token, resource);

  const organizationId = payload.org_id;
  const clientId = payload.azp;

  if (
    typeof payload.sub !== 'string' ||
    typeof organizationId !== 'string' ||
    typeof clientId !== 'string' ||
    typeof payload.iat !== 'number'
  ) {
    throw new Error('OAuth access token is missing required claims');
  }

  const grantedScopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
  const scopes = grantedScopes.filter((scope) => OAUTH_API_SCOPES.some((allowed) => allowed === scope));

  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  const kind = audiences.includes(MCP_RESOURCE) ? 'mcp' : 'api';

  return { userId: payload.sub, clientId, organizationId, scopes, kind, issuedAt: payload.iat };
}
