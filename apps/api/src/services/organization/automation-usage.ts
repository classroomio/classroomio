import { env } from '@cio/core/config/env';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countActiveOrganizationApiKeys,
  countOrganizationAutomationUsageSince,
  countOrganizationAutomationUsageSinceByKey,
  completeOrganizationAutomationUsage,
  createOrganizationAutomationUsage,
  getActiveOrganizationPlan,
  listRecentOrganizationAutomationUsage,
  releaseOrganizationAutomationUsage,
  reserveOrganizationAutomationUsage
} from '@cio/db/queries/organization';
import type { TOrganizationApiKey, TOrganizationApiKeyType, TPlan } from '@db/types';
import {
  AUTOMATION_TYPE,
  getMcpAutomationCategory,
  canUsePublicApi,
  getMcpAutomationLimits,
  MCP_TOOL_CREDIT_COST,
  type TAutomationUsageCategory,
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

/**
 * Category-level rate limiting, shared by the tool-name entry point below and
 * by /v1 (which has no per-tool identity to key off of — one automation key
 * can be hit by a plain API call or by any MCP tool, so /v1 derives a
 * category straight from the HTTP method instead).
 */
async function getMcpCategoryLimits(organizationId: string, category: TAutomationUsageCategory) {
  const { rateLimits } = getMcpAutomationLimits(await getOrganizationPlanName(organizationId));
  const perMinute = `${category}PerMinute` as const;

  return { keyLimit: rateLimits.perKey[perMinute], orgLimit: rateLimits.perOrg[perMinute] };
}

export async function assertMcpAutomationUsageAllowedForCategory(
  automationKey: TOrganizationApiKey,
  category: TAutomationUsageCategory
): Promise<void> {
  const { keyLimit, orgLimit } = await getMcpCategoryLimits(automationKey.organizationId, category);
  const minuteWindowStart = getMinuteWindowStart().toISOString();

  const [keyRequestsInWindow, orgRequestsInWindow] = await Promise.all([
    countOrganizationAutomationUsageSinceByKey(automationKey.id, category, minuteWindowStart),
    countOrganizationAutomationUsageSince(automationKey.organizationId, automationKey.type, category, minuteWindowStart)
  ]);

  if (keyRequestsInWindow >= keyLimit || orgRequestsInWindow >= orgLimit) {
    throw new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429);
  }
}

/**
 * Atomically checks the per-key and per-organization limits and reserves one slot, so concurrent
 * requests can't all pass the check before any of them is recorded. Returns the reservation id to
 * complete or release. Throws 429 over the limit, and 503 when the limiter can't record the request
 * (fail closed).
 */
export async function reserveMcpAutomationUsage(
  automationKey: TOrganizationApiKey,
  category: TAutomationUsageCategory,
  action: string
): Promise<string> {
  const { keyLimit, orgLimit } = await getMcpCategoryLimits(automationKey.organizationId, category);

  let reservationId: string | null;
  try {
    reservationId = await reserveOrganizationAutomationUsage({
      organizationId: automationKey.organizationId,
      organizationApiKeyId: automationKey.id,
      type: automationKey.type,
      category,
      action,
      since: getMinuteWindowStart().toISOString(),
      keyLimit,
      orgLimit
    });
  } catch {
    throw new AppError(
      'Automation usage could not be recorded, try again shortly',
      ErrorCodes.AUTOMATION_USAGE_UNAVAILABLE,
      503
    );
  }

  if (!reservationId) {
    throw new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429);
  }

  return reservationId;
}

export async function completeMcpAutomationUsage(
  reservationId: string,
  action: string,
  creditsConsumed: number
): Promise<void> {
  await completeOrganizationAutomationUsage(reservationId, { action, creditsConsumed });
}

export async function releaseMcpAutomationUsage(reservationId: string): Promise<void> {
  await releaseOrganizationAutomationUsage(reservationId);
}

export async function assertMcpAutomationUsageAllowed(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName
): Promise<void> {
  return assertMcpAutomationUsageAllowedForCategory(automationKey, getMcpAutomationCategory(toolName));
}

export async function recordMcpAutomationUsageForAction(
  automationKey: TOrganizationApiKey,
  action: string,
  category: TAutomationUsageCategory,
  creditsConsumed: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await createOrganizationAutomationUsage({
    organizationId: automationKey.organizationId,
    organizationApiKeyId: automationKey.id,
    type: automationKey.type,
    action,
    category,
    creditsConsumed,
    metadata
  });
}

export async function recordMcpAutomationUsage(
  automationKey: TOrganizationApiKey,
  toolName: TMcpToolName,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  return recordMcpAutomationUsageForAction(
    automationKey,
    toolName,
    getMcpAutomationCategory(toolName),
    MCP_TOOL_CREDIT_COST[toolName],
    metadata
  );
}
