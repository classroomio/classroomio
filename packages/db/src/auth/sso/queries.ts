/**
 * SSO Database Queries
 */

import { and, eq, gt } from 'drizzle-orm';
import { db } from '@db/drizzle';
import * as schema from '@db/schema';
import type { SsoConfig, SsoSession, SsoProviderType, SamlConfig, OidcConfig, AttributeMapping } from './types';

/**
 * Get SSO configuration for an organization
 */
export async function getSsoConfigByOrgId(organizationId: string): Promise<SsoConfig | null> {
  const result = await db
    .select()
    .from(schema.organizationSsoConfig)
    .where(eq(schema.organizationSsoConfig.organizationId, organizationId))
    .limit(1);

  if (!result.length) return null;

  const config = result[0];
  return {
    id: config.id,
    organizationId: config.organizationId,
    providerType: config.providerType,
    providerName: config.providerName,
    displayName: config.displayName,
    enabled: config.enabled,
    samlConfig: config.samlConfig as SamlConfig | null,
    oidcConfig: config.oidcConfig as OidcConfig | null,
    forceSso: config.forceSso,
    autoProvisionUsers: config.autoProvisionUsers,
    allowedDomains: config.allowedDomains,
    defaultRoleId: config.defaultRoleId,
    attributeMapping: config.attributeMapping as AttributeMapping | null,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  };
}

/**
 * Get SSO configuration by ID
 */
export async function getSsoConfigById(id: string): Promise<SsoConfig | null> {
  const result = await db
    .select()
    .from(schema.organizationSsoConfig)
    .where(eq(schema.organizationSsoConfig.id, id))
    .limit(1);

  if (!result.length) return null;

  const config = result[0];
  return {
    id: config.id,
    organizationId: config.organizationId,
    providerType: config.providerType,
    providerName: config.providerName,
    displayName: config.displayName,
    enabled: config.enabled,
    samlConfig: config.samlConfig as SamlConfig | null,
    oidcConfig: config.oidcConfig as OidcConfig | null,
    forceSso: config.forceSso,
    autoProvisionUsers: config.autoProvisionUsers,
    allowedDomains: config.allowedDomains,
    defaultRoleId: config.defaultRoleId,
    attributeMapping: config.attributeMapping as AttributeMapping | null,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  };
}

/**
 * Create or update SSO configuration for an organization
 */
export async function upsertSsoConfig(config: {
  organizationId: string;
  providerType: SsoProviderType;
  providerName: string;
  displayName?: string;
  enabled?: boolean;
  samlConfig?: SamlConfig;
  oidcConfig?: OidcConfig;
  forceSso?: boolean;
  autoProvisionUsers?: boolean;
  allowedDomains?: string[];
  defaultRoleId?: number;
  attributeMapping?: AttributeMapping;
}): Promise<SsoConfig> {
  const existing = await getSsoConfigByOrgId(config.organizationId);

  if (existing) {
    // Update existing config
    const result = await db
      .update(schema.organizationSsoConfig)
      .set({
        providerType: config.providerType,
        providerName: config.providerName,
        displayName: config.displayName,
        enabled: config.enabled ?? existing.enabled,
        samlConfig: config.samlConfig,
        oidcConfig: config.oidcConfig,
        forceSso: config.forceSso ?? existing.forceSso,
        autoProvisionUsers: config.autoProvisionUsers ?? existing.autoProvisionUsers,
        allowedDomains: config.allowedDomains,
        defaultRoleId: config.defaultRoleId,
        attributeMapping: config.attributeMapping ?? existing.attributeMapping,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.organizationSsoConfig.id, existing.id))
      .returning();

    return {
      ...result[0],
      samlConfig: result[0].samlConfig as SamlConfig | null,
      oidcConfig: result[0].oidcConfig as OidcConfig | null,
      attributeMapping: result[0].attributeMapping as AttributeMapping | null
    };
  } else {
    // Create new config
    const result = await db
      .insert(schema.organizationSsoConfig)
      .values({
        organizationId: config.organizationId,
        providerType: config.providerType,
        providerName: config.providerName,
        displayName: config.displayName,
        enabled: config.enabled ?? false,
        samlConfig: config.samlConfig,
        oidcConfig: config.oidcConfig,
        forceSso: config.forceSso ?? false,
        autoProvisionUsers: config.autoProvisionUsers ?? true,
        allowedDomains: config.allowedDomains,
        defaultRoleId: config.defaultRoleId,
        attributeMapping: config.attributeMapping ?? {
          email: 'email',
          name: 'name',
          firstName: 'given_name',
          lastName: 'family_name'
        }
      })
      .returning();

    return {
      ...result[0],
      samlConfig: result[0].samlConfig as SamlConfig | null,
      oidcConfig: result[0].oidcConfig as OidcConfig | null,
      attributeMapping: result[0].attributeMapping as AttributeMapping | null
    };
  }
}

/**
 * Delete SSO configuration for an organization
 */
export async function deleteSsoConfig(organizationId: string): Promise<void> {
  await db
    .delete(schema.organizationSsoConfig)
    .where(eq(schema.organizationSsoConfig.organizationId, organizationId));
}

/**
 * Toggle SSO enabled status
 */
export async function toggleSsoEnabled(organizationId: string, enabled: boolean): Promise<SsoConfig | null> {
  const result = await db
    .update(schema.organizationSsoConfig)
    .set({
      enabled,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.organizationSsoConfig.organizationId, organizationId))
    .returning();

  if (!result.length) return null;

  return {
    ...result[0],
    samlConfig: result[0].samlConfig as SamlConfig | null,
    oidcConfig: result[0].oidcConfig as OidcConfig | null,
    attributeMapping: result[0].attributeMapping as AttributeMapping | null
  };
}

/**
 * Create SSO session for tracking auth flow
 */
export async function createSsoSession(session: {
  organizationId: string;
  ssoConfigId: string;
  state: string;
  nonce?: string;
  codeVerifier?: string;
  redirectUrl?: string;
  expiresInMinutes?: number;
}): Promise<SsoSession> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (session.expiresInMinutes ?? 10));

  const result = await db
    .insert(schema.ssoSession)
    .values({
      organizationId: session.organizationId,
      ssoConfigId: session.ssoConfigId,
      state: session.state,
      nonce: session.nonce,
      codeVerifier: session.codeVerifier,
      redirectUrl: session.redirectUrl,
      status: 'pending',
      expiresAt: expiresAt.toISOString()
    })
    .returning();

  return result[0] as SsoSession;
}

/**
 * Get SSO session by state
 */
export async function getSsoSessionByState(state: string): Promise<SsoSession | null> {
  const result = await db
    .select()
    .from(schema.ssoSession)
    .where(
      and(
        eq(schema.ssoSession.state, state),
        gt(schema.ssoSession.expiresAt, new Date().toISOString())
      )
    )
    .limit(1);

  if (!result.length) return null;

  return result[0] as SsoSession;
}

/**
 * Update SSO session status
 */
export async function updateSsoSession(
  state: string,
  updates: {
    status?: 'pending' | 'completed' | 'failed' | 'expired';
    userId?: string;
    errorMessage?: string;
  }
): Promise<SsoSession | null> {
  const result = await db
    .update(schema.ssoSession)
    .set(updates)
    .where(eq(schema.ssoSession.state, state))
    .returning();

  if (!result.length) return null;

  return result[0] as SsoSession;
}

/**
 * Clean up expired SSO sessions
 */
export async function cleanupExpiredSsoSessions(): Promise<number> {
  const result = await db
    .delete(schema.ssoSession)
    .where(
      and(
        eq(schema.ssoSession.status, 'pending'),
        gt(new Date().toISOString(), schema.ssoSession.expiresAt)
      )
    )
    .returning();

  return result.length;
}

/**
 * Check if organization has SSO enabled
 */
export async function isOrgSsoEnabled(organizationId: string): Promise<boolean> {
  const config = await getSsoConfigByOrgId(organizationId);
  return config?.enabled ?? false;
}

/**
 * Check if SSO is forced for organization (email/password disabled)
 */
export async function isOrgSsoForced(organizationId: string): Promise<boolean> {
  const config = await getSsoConfigByOrgId(organizationId);
  return config?.forceSso ?? false;
}
