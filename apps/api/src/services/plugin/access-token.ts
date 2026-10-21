import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import * as z from 'zod';
import { env } from '@cio/core/config/env';
import { AppError } from '@api/utils/errors';
import { recordPluginAuditEvent } from '@cio/db/queries';
import type { VerifiedPluginLaunchClaims } from './launch';
import { authorizePluginRequest } from './authorization';

const PLUGIN_API_AUDIENCE = 'classroomio:plugin-api:v1';
const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;

const ZPluginApiAccessTokenClaims = z
  .object({
    iss: z.literal('classroomio'),
    aud: z.literal(PLUGIN_API_AUDIENCE),
    sub: z.string().uuid(),
    jti: z.string().uuid(),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    pluginId: z.string().min(1),
    versionId: z.string().min(1),
    installationId: z.string().uuid(),
    organizationId: z.string().uuid(),
    organizationRole: z.enum(['admin', 'tutor', 'student']),
    contributionTarget: z.enum(['plugin.page', 'certificate.templates']),
    resource: z
      .object({
        type: z.enum(['lesson', 'course', 'certificate', 'organization']),
        id: z.string().uuid()
      })
      .strict()
      .nullable(),
    clientAudience: z.string().url(),
    scopes: z.array(z.string().min(1))
  })
  .strict();

export type PluginApiAccessTokenClaims = z.infer<typeof ZPluginApiAccessTokenClaims>;

function getTokenSecret(): string {
  const configuredSecret = env.PLUGIN_API_TOKEN_SECRET;
  if (configuredSecret) return configuredSecret;

  if (env.NODE_ENV === 'production') {
    throw new AppError('Plugin API token signing is not configured', 'INTERNAL_ERROR', 500);
  }

  return 'classroomio-plugin-api-development-secret-change-me';
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function sign(value: string): string {
  return createHmac('sha256', getTokenSecret()).update(value).digest('base64url');
}

function signaturesMatch(value: string, signature: string): boolean {
  const expected = Buffer.from(sign(value), 'ascii');
  const received = Buffer.from(signature, 'ascii');
  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
}

export function createPluginApiAccessToken(launchClaims: VerifiedPluginLaunchClaims): {
  accessToken: string;
  expiresAt: string;
} {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtEpoch = issuedAt + ACCESS_TOKEN_LIFETIME_SECONDS;
  const claims: PluginApiAccessTokenClaims = {
    iss: 'classroomio',
    aud: PLUGIN_API_AUDIENCE,
    sub: launchClaims.userId,
    jti: randomUUID(),
    iat: issuedAt,
    exp: expiresAtEpoch,
    pluginId: launchClaims.pluginId,
    versionId: launchClaims.versionId,
    installationId: launchClaims.installationId,
    organizationId: launchClaims.organizationId,
    organizationRole: launchClaims.organizationRole,
    contributionTarget: launchClaims.contributionTarget,
    resource: launchClaims.resource,
    clientAudience: launchClaims.audience,
    scopes: launchClaims.grantedScopes
  };
  const header = encodeJson({ alg: 'HS256', typ: 'at+jwt', kid: 'plugin-api-v1' });
  const payload = encodeJson(claims);
  const unsignedToken = `${header}.${payload}`;

  return {
    accessToken: `${unsignedToken}.${sign(unsignedToken)}`,
    expiresAt: new Date(expiresAtEpoch * 1000).toISOString()
  };
}

function parsePluginApiAccessToken(token: string): PluginApiAccessTokenClaims {
  const [header, payload, signature, extra] = token.split('.');
  if (!header || !payload || !signature || extra || !signaturesMatch(`${header}.${payload}`, signature)) {
    throw new AppError('Invalid plugin API access token', 'UNAUTHORIZED', 401);
  }

  try {
    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'at+jwt' || parsedHeader.kid !== 'plugin-api-v1') {
      throw new Error('Unsupported token header');
    }

    const parsedClaims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return ZPluginApiAccessTokenClaims.parse(parsedClaims);
  } catch {
    throw new AppError('Invalid plugin API access token', 'UNAUTHORIZED', 401);
  }
}

export async function verifyPluginApiAccessToken(token: string): Promise<PluginApiAccessTokenClaims> {
  const claims = parsePluginApiAccessToken(token);
  const currentTime = Math.floor(Date.now() / 1000);
  if (claims.exp <= currentTime || claims.iat > currentTime + 30) {
    throw new AppError('Plugin API access token has expired', 'UNAUTHORIZED', 401);
  }

  const authorization = await authorizePluginRequest({
    installationId: claims.installationId,
    organizationId: claims.organizationId,
    actorId: claims.sub
  });
  if (
    authorization.installation.pluginId !== claims.pluginId ||
    authorization.installation.pluginVersionId !== claims.versionId
  ) {
    throw new AppError('Plugin token does not match the installed version', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const currentScopeSet = new Set<string>(authorization.grantedScopes);
  claims.scopes = claims.scopes.filter((scope) => currentScopeSet.has(scope));
  claims.organizationRole = authorization.organizationRole!;

  await recordPluginAuditEvent({
    installationId: claims.installationId,
    organizationId: claims.organizationId,
    actorProfileId: claims.sub,
    action: 'plugin.api_token_verified',
    resource: claims.pluginId,
    outcome: 'success',
    metadata: { tokenId: claims.jti }
  });

  return claims;
}
