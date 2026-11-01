import * as schema from '@db/schema';

import { and, eq, gt, max } from 'drizzle-orm';

import { createHash, randomBytes } from 'crypto';

import { ROLE } from '@cio/utils/constants/roles';
import { db } from '@db/drizzle';
import type { TOrganizationApiKey } from '@db/types';

const ORG_SELECTION_PREFIX = 'oauth-org-selection:';
const ORG_SELECTION_TTL_MS = 5 * 60 * 1000;

export type OAuthOrganizationOption = {
  id: string;
  name: string;
  siteName: string | null;
  avatarUrl: string | null;
};

export type OAuthConnectedApp = {
  consentId: string;
  clientId: string;
  clientName: string | null;
  clientIcon: string | null;
  clientUri: string | null;
  userId: string;
  userFullname: string | null;
  scopes: string[];
  createdAt: Date;
  lastUsedAt: string | null;
};

/**
 * Organizations where the user is an active admin, the only role that may authorize an integration.
 */
export async function listOAuthEligibleOrganizations(userId: string): Promise<OAuthOrganizationOption[]> {
  try {
    return await db
      .select({
        id: schema.organization.id,
        name: schema.organization.name,
        siteName: schema.organization.siteName,
        avatarUrl: schema.organization.avatarUrl
      })
      .from(schema.organizationmember)
      .innerJoin(schema.organization, eq(schema.organization.id, schema.organizationmember.organizationId))
      .where(
        and(
          eq(schema.organizationmember.profileId, userId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN),
          eq(schema.organizationmember.status, 'ACTIVE')
        )
      );
  } catch (error) {
    console.error('listOAuthEligibleOrganizations error:', error);
    throw new Error('Failed to list organizations');
  }
}

export async function isActiveOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.organizationmember.id })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.profileId, userId),
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN),
          eq(schema.organizationmember.status, 'ACTIVE')
        )
      )
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('isActiveOrganizationAdmin error:', error);
    throw new Error('Failed to check organization membership');
  }
}

/**
 * Remembers which organization the signed-in session chose for the OAuth flow in progress.
 */
export async function saveOAuthOrganizationSelection(sessionId: string, organizationId: string): Promise<void> {
  try {
    const identifier = `${ORG_SELECTION_PREFIX}${sessionId}`;
    const expiresAt = new Date(Date.now() + ORG_SELECTION_TTL_MS);

    await db.transaction(async (tx) => {
      await tx.delete(schema.verification).where(eq(schema.verification.identifier, identifier));
      await tx.insert(schema.verification).values({ identifier, value: organizationId, expiresAt });
    });
  } catch (error) {
    console.error('saveOAuthOrganizationSelection error:', error);
    throw new Error('Failed to save organization selection');
  }
}

export async function getOAuthOrganizationSelection(sessionId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ value: schema.verification.value })
      .from(schema.verification)
      .where(
        and(
          eq(schema.verification.identifier, `${ORG_SELECTION_PREFIX}${sessionId}`),
          gt(schema.verification.expiresAt, new Date())
        )
      )
      .limit(1);

    return row?.value ?? null;
  } catch (error) {
    console.error('getOAuthOrganizationSelection error:', error);
    throw new Error('Failed to read organization selection');
  }
}

/**
 * Returns the grant a user gave a client for an organization, or null once it is revoked.
 */
export async function findActiveOAuthConsent(
  userId: string,
  clientId: string,
  organizationId: string
): Promise<{ id: string; createdAt: Date } | null> {
  try {
    const [row] = await db
      .select({ id: schema.oauthConsent.id, createdAt: schema.oauthConsent.createdAt })
      .from(schema.oauthConsent)
      .where(
        and(
          eq(schema.oauthConsent.userId, userId),
          eq(schema.oauthConsent.clientId, clientId),
          eq(schema.oauthConsent.referenceId, organizationId)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('findActiveOAuthConsent error:', error);
    throw new Error('Failed to check OAuth grant');
  }
}

/**
 * Returns the API key row that meters one OAuth grant, creating it on first use.
 * The row carries an unguessable secret so it can never authenticate as a key.
 */
export async function getOrCreateOAuthGrantKey(data: {
  consentId: string;
  organizationId: string;
  userId: string;
  type: 'mcp' | 'api';
  label: string;
}): Promise<TOrganizationApiKey> {
  try {
    const condition = and(
      eq(schema.organizationApiKey.oauthConsentId, data.consentId),
      eq(schema.organizationApiKey.type, data.type)
    );
    const [existing] = await db.select().from(schema.organizationApiKey).where(condition).limit(1);

    if (existing) return existing;

    const secret = randomBytes(32).toString('base64url');
    const secretHash = createHash('sha256').update(secret).digest('hex');

    await db
      .insert(schema.organizationApiKey)
      .values({
        organizationId: data.organizationId,
        createdByProfileId: data.userId,
        type: data.type,
        label: data.label,
        secretPrefix: 'oauth',
        secretHash,
        scopes: [],
        oauthConsentId: data.consentId
      })
      .onConflictDoNothing();

    const [created] = await db.select().from(schema.organizationApiKey).where(condition).limit(1);

    if (!created) throw new Error('OAuth grant key was not created');

    return created;
  } catch (error) {
    console.error('getOrCreateOAuthGrantKey error:', error);
    throw new Error('Failed to resolve OAuth grant key');
  }
}

export async function listOAuthConnectedApps(organizationId: string): Promise<OAuthConnectedApp[]> {
  try {
    const consents = await db
      .select({
        consentId: schema.oauthConsent.id,
        clientId: schema.oauthConsent.clientId,
        clientName: schema.oauthClient.name,
        clientIcon: schema.oauthClient.icon,
        clientUri: schema.oauthClient.uri,
        userId: schema.oauthConsent.userId,
        userFullname: schema.profile.fullname,
        scopes: schema.oauthConsent.scopes,
        createdAt: schema.oauthConsent.createdAt
      })
      .from(schema.oauthConsent)
      .innerJoin(schema.oauthClient, eq(schema.oauthClient.clientId, schema.oauthConsent.clientId))
      .leftJoin(schema.profile, eq(schema.profile.id, schema.oauthConsent.userId))
      .where(eq(schema.oauthConsent.referenceId, organizationId));

    const lastUsedRows = await db
      .select({
        consentId: schema.organizationApiKey.oauthConsentId,
        lastUsedAt: max(schema.organizationApiKey.lastUsedAt)
      })
      .from(schema.organizationApiKey)
      .where(eq(schema.organizationApiKey.organizationId, organizationId))
      .groupBy(schema.organizationApiKey.oauthConsentId);

    const lastUsedByConsent = new Map(lastUsedRows.map((row) => [row.consentId, row.lastUsedAt]));
    const apps: OAuthConnectedApp[] = [];

    for (const consent of consents) {
      if (!consent.userId) continue;

      const lastUsedAt = lastUsedByConsent.get(consent.consentId) ?? null;
      apps.push({ ...consent, userId: consent.userId, lastUsedAt });
    }

    return apps;
  } catch (error) {
    console.error('listOAuthConnectedApps error:', error);
    throw new Error('Failed to list connected apps');
  }
}

/**
 * Deletes the grant and every token issued under it so the integration loses access immediately.
 * Returns false when the consent does not belong to the organization.
 */
export async function revokeOAuthConsent(consentId: string, organizationId: string): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      const [consent] = await tx
        .select()
        .from(schema.oauthConsent)
        .where(and(eq(schema.oauthConsent.id, consentId), eq(schema.oauthConsent.referenceId, organizationId)))
        .limit(1);

      if (!consent || !consent.userId) return false;

      const tokenScope = [
        eq(schema.oauthRefreshToken.userId, consent.userId),
        eq(schema.oauthRefreshToken.clientId, consent.clientId),
        eq(schema.oauthRefreshToken.referenceId, organizationId)
      ];

      await tx
        .delete(schema.oauthAccessToken)
        .where(
          and(
            eq(schema.oauthAccessToken.userId, consent.userId),
            eq(schema.oauthAccessToken.clientId, consent.clientId),
            eq(schema.oauthAccessToken.referenceId, organizationId)
          )
        );
      await tx.delete(schema.oauthRefreshToken).where(and(...tokenScope));
      await tx.delete(schema.oauthConsent).where(eq(schema.oauthConsent.id, consentId));

      return true;
    });
  } catch (error) {
    console.error('revokeOAuthConsent error:', error);
    throw new Error('Failed to revoke connected app');
  }
}

/**
 * Removes every grant a user holds in an organization, used when their membership ends.
 */
export async function revokeUserOAuthGrantsInOrganization(userId: string, organizationId: string): Promise<void> {
  try {
    const consents = await db
      .select({ id: schema.oauthConsent.id })
      .from(schema.oauthConsent)
      .where(and(eq(schema.oauthConsent.userId, userId), eq(schema.oauthConsent.referenceId, organizationId)));

    for (const consent of consents) {
      await revokeOAuthConsent(consent.id, organizationId);
    }
  } catch (error) {
    console.error('revokeUserOAuthGrantsInOrganization error:', error);
    throw new Error('Failed to revoke OAuth grants');
  }
}

export type PublicJwk = Record<string, unknown> & { kid: string };

/**
 * Public signing keys the OAuth provider has issued, in JWK form with `kid` set to the key id.
 */
export async function listPublicJwks(): Promise<PublicJwk[]> {
  try {
    const rows = await db
      .select({ id: schema.jwks.id, publicKey: schema.jwks.publicKey, alg: schema.jwks.alg })
      .from(schema.jwks);

    return rows.map(toPublicJwk);
  } catch (error) {
    console.error('listPublicJwks error:', error);
    throw new Error('Failed to list signing keys');
  }
}

function toPublicJwk(row: { id: string; publicKey: string; alg: string | null }): PublicJwk {
  const key = JSON.parse(row.publicKey) as Record<string, unknown>;
  const alg = row.alg ? { alg: row.alg } : {};

  return { ...key, kid: row.id, ...alg };
}
