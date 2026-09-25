import { env } from '@cio/core/config/env';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countActiveOrganizationApiKeys,
  countOrganizationAutomationUsageSince,
  countOrganizationAutomationUsageSinceByKey,
  createOrganizationAutomationUsage,
  deleteOrganizationAutomationUsage,
  getActiveOrganizationPlan,
  listRecentOrganizationAutomationUsage,
  lockOrganizationAutomationUsage
} from '@cio/db/queries/organization';
import type { TOrganizationApiKey, TOrganizationApiKeyType, TPlan } from '@db/types';
import {
  AUTOMATION_TYPE,
  getMcpAutomationCategory,
  canUsePublicApi,
  getMcpAutomationLimits,
  type TMcpToolName
} from '@cio/utils/plans';

export type OrganizationAutomationUsageSummary = {
  type: TOrganizationApiKeyType;
  planName: TPlan;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  activeKeys: number;
  maxActiveKeys: number;
  rateLimits: ReturnType<typeof getMcpAutomationLimits>['rateLimits'];
  recentActions: Array<{
    action: string;
    creditsConsumed: number;
    createdAt: string;
  }>;
};

function getBillingPeriodStart(date: Date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function getBillingPeriodEnd(date: Date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function getMinuteWindowStart(date: Date = new Date()) {
  return new Date(date.getTime() - 60_000);
}

async function getOrganizationPlanName(orgId: string): Promise<TPlan> {
  const activePlan = await getActiveOrganizationPlan(orgId);
  return (activePlan?.planName as TPlan | null) ?? 'BASIC';
}

export async function assertOrganizationAutomationKeyCreationAllowed(
  organizationId: string,
  type: TOrganizationApiKeyType
): Promise<void> {
  const planName = await getOrganizationPlanName(organizationId);

  if (type === AUTOMATION_TYPE.API) {
    const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';

    if (!canUsePublicApi(planName, isSelfHosted)) {
      throw new AppError(
        isSelfHosted
          ? 'Public API keys require an Enterprise plan'
          : 'Public API keys require an Early Adopter or Enterprise plan',
        ErrorCodes.UPGRADE_REQUIRED,
        403
      );
    }
  }

  if (type !== AUTOMATION_TYPE.MCP) {
    return;
  }

  const limits = getMcpAutomationLimits(planName);
  const activeKeys = await countActiveOrganizationApiKeys(organizationId, type);

  if (activeKeys >= limits.maxActiveKeys) {
    throw new AppError(
      `Your plan allows up to ${limits.maxActiveKeys} active MCP key${limits.maxActiveKeys === 1 ? '' : 's'}`,
      ErrorCodes.AUTOMATION_KEY_LIMIT_EXCEEDED,
      403
    );
  }
}

export async function getOrganizationAutomationUsageSummaryService(
  organizationId: string,
  type: TOrganizationApiKeyType
): Promise<OrganizationAutomationUsageSummary> {
  const planName = await getOrganizationPlanName(organizationId);
  const billingPeriodStart = getBillingPeriodStart();
  const billingPeriodEnd = getBillingPeriodEnd();

  if (type !== AUTOMATION_TYPE.MCP) {
    return {
      type,
      planName,
      billingPeriodStart: billingPeriodStart.toISOString(),
      billingPeriodEnd: billingPeriodEnd.toISOString(),
      activeKeys: await countActiveOrganizationApiKeys(organizationId, type),
      maxActiveKeys: 0,
      rateLimits: {
        perKey: { readPerMinute: 0, writePerMinute: 0, publishPerMinute: 0 },
        perOrg: { readPerMinute: 0, writePerMinute: 0, publishPerMinute: 0 }
      },
      recentActions: []
    };
  }

  const limits = getMcpAutomationLimits(planName);
  const [activeKeys, recentActions] = await Promise.all([
    countActiveOrganizationApiKeys(organizationId, type),
    listRecentOrganizationAutomationUsage(organizationId, type, 10)
  ]);

  return {
    type,
    planName,
    billingPeriodStart: billingPeriodStart.toISOString(),
    billingPeriodEnd: billingPeriodEnd.toISOString(),
    activeKeys,
    maxActiveKeys: limits.maxActiveKeys,
    rateLimits: limits.rateLimits,
    recentActions: recentActions.map((action) => ({
      action: action.action,
      creditsConsumed: action.creditsConsumed,
      createdAt: action.createdAt
    }))
  };
}

async function assertWithinMcpRateLimits(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName,
  dbClient: DbOrTxClient = db
): Promise<void> {
  const planName = await getOrganizationPlanName(automationKey.organizationId);
  const limits = getMcpAutomationLimits(planName);
  const category = getMcpAutomationCategory(toolName);
  const now = new Date();
  const minuteWindowStart = getMinuteWindowStart(now).toISOString();

  const [keyRequestsInWindow, orgRequestsInWindow] = await Promise.all([
    countOrganizationAutomationUsageSinceByKey(automationKey.id, category, minuteWindowStart, dbClient),
    countOrganizationAutomationUsageSince(
      automationKey.organizationId,
      automationKey.type,
      category,
      minuteWindowStart,
      dbClient
    )
  ]);

  const keyLimit =
    category === 'read'
      ? limits.rateLimits.perKey.readPerMinute
      : category === 'write'
        ? limits.rateLimits.perKey.writePerMinute
        : limits.rateLimits.perKey.publishPerMinute;

  const orgLimit =
    category === 'read'
      ? limits.rateLimits.perOrg.readPerMinute
      : category === 'write'
        ? limits.rateLimits.perOrg.writePerMinute
        : limits.rateLimits.perOrg.publishPerMinute;

  if (keyRequestsInWindow >= keyLimit || orgRequestsInWindow >= orgLimit) {
    throw new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429);
  }
}

function buildMcpUsageRow(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName,
  metadata: Record<string, unknown>
) {
  return {
    organizationId: automationKey.organizationId,
    organizationApiKeyId: automationKey.id,
    type: automationKey.type,
    action: toolName,
    category: getMcpAutomationCategory(toolName),
    creditsConsumed: 0,
    metadata
  };
}

export async function assertMcpAutomationUsageAllowed(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName
): Promise<void> {
  await assertWithinMcpRateLimits(automationKey, toolName);
}

export async function recordMcpAutomationUsage(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await createOrganizationAutomationUsage(buildMcpUsageRow(automationKey, toolName, metadata));
}

/**
 * Checks the tool's rate limit and records one usage row under a per-organization lock. Throws 429 at the limit;
 * returns the usage id.
 */
export async function reserveMcpAutomationUsage(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  return db.transaction(async (tx) => {
    await lockOrganizationAutomationUsage(automationKey.organizationId, automationKey.type, tx);
    await assertWithinMcpRateLimits(automationKey, toolName, tx);

    const usage = await createOrganizationAutomationUsage(buildMcpUsageRow(automationKey, toolName, metadata), tx);

    return usage.id;
  });
}

/**
 * Removes a reservation made by {@link reserveMcpAutomationUsage} for a call that did not succeed.
 */
export async function releaseMcpAutomationUsage(usageId: string): Promise<void> {
  await deleteOrganizationAutomationUsage(usageId);
}
