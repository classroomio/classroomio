import * as schema from '@db/schema';

import { and, eq } from 'drizzle-orm';

import { db } from '@db/drizzle';
import type {
  TNewOrganizationAuthPolicy,
  TNewOrganizationSsoConfig,
  TOrganizationAuthPolicy,
  TOrganizationSsoConfig
} from '@db/types';

// Organization Auth Policy Queries

export const getOrganizationAuthPolicy = async (orgId: string): Promise<TOrganizationAuthPolicy | null> => {
  const [policy] = await db
    .select()
    .from(schema.organizationAuthPolicy)
    .where(eq(schema.organizationAuthPolicy.organizationId, orgId))
    .limit(1);

  return policy || null;
};

export const createOrganizationAuthPolicy = async (
  data: TNewOrganizationAuthPolicy
): Promise<TOrganizationAuthPolicy> => {
  const [policy] = await db.insert(schema.organizationAuthPolicy).values(data).returning();

  return policy;
};

export const updateOrganizationAuthPolicy = async (
  orgId: string,
  data: Partial<TOrganizationAuthPolicy>
): Promise<TOrganizationAuthPolicy | null> => {
  const [policy] = await db
    .update(schema.organizationAuthPolicy)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.organizationAuthPolicy.organizationId, orgId))
    .returning();

  return policy || null;
};

export const deleteOrganizationAuthPolicy = async (orgId: string): Promise<void> => {
  await db.delete(schema.organizationAuthPolicy).where(eq(schema.organizationAuthPolicy.organizationId, orgId));
};

// Organization SSO Config Queries

export const getOrganizationSsoConfig = async (orgId: string): Promise<TOrganizationSsoConfig | null> => {
  const [config] = await db
    .select()
    .from(schema.organizationSsoConfig)
    .where(eq(schema.organizationSsoConfig.organizationId, orgId))
    .limit(1);

  return config || null;
};

export const getOrganizationSsoConfigByDomain = async (domain: string): Promise<TOrganizationSsoConfig | null> => {
  const [config] = await db
    .select()
    .from(schema.organizationSsoConfig)
    .where(and(eq(schema.organizationSsoConfig.domain, domain), eq(schema.organizationSsoConfig.isActive, true)))
    .limit(1);

  return config || null;
};

export const createOrganizationSsoConfig = async (data: TNewOrganizationSsoConfig): Promise<TOrganizationSsoConfig> => {
  const [config] = await db.insert(schema.organizationSsoConfig).values(data).returning();

  return config;
};

export const updateOrganizationSsoConfig = async (
  orgId: string,
  data: Partial<TOrganizationSsoConfig>
): Promise<TOrganizationSsoConfig | null> => {
  const [config] = await db
    .update(schema.organizationSsoConfig)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.organizationSsoConfig.organizationId, orgId))
    .returning();

  return config || null;
};

export const deleteOrganizationSsoConfig = async (orgId: string): Promise<TOrganizationSsoConfig | null> => {
  const [config] = await db
    .delete(schema.organizationSsoConfig)
    .where(eq(schema.organizationSsoConfig.organizationId, orgId))
    .returning();

  return config || null;
};

// Combined query: Get SSO info with policy
export const getOrganizationSsoInfo = async (orgId: string) => {
  const [result] = await db
    .select({
      config: schema.organizationSsoConfig,
      policy: schema.organizationAuthPolicy
    })
    .from(schema.organizationSsoConfig)
    .leftJoin(
      schema.organizationAuthPolicy,
      eq(schema.organizationSsoConfig.organizationId, schema.organizationAuthPolicy.organizationId)
    )
    .where(eq(schema.organizationSsoConfig.organizationId, orgId))
    .limit(1);

  return result || null;
};
