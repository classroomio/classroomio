import { env } from '@cio/core/config/env';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  AutomationRateLimitExceededError,
  countActiveOrganizationApiKeys,
  completeMcpAutomationUsageMetadata,
  getActiveOrganizationPlan,
  listRecentOrganizationAutomationUsage,
  releaseMcpAutomationUsageReservation,
  reserveMcpAutomationUsageSlot
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

function getMcpRateLimits(
  limits: ReturnType<typeof getMcpAutomationLimits>,
  category: ReturnType<typeof getMcpAutomationCategory>
) {
  if (category === 'read') {
    return {
      keyLimit: limits.rateLimits.perKey.readPerMinute,
      orgLimit: limits.rateLimits.perOrg.readPerMinute
    };
  }

  if (category === 'write') {
    return {
      keyLimit: limits.rateLimits.perKey.writePerMinute,
      orgLimit: limits.rateLimits.perOrg.writePerMinute
    };
  }

  return {
    keyLimit: limits.rateLimits.perKey.publishPerMinute,
    orgLimit: limits.rateLimits.perOrg.publishPerMinute
  };
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

export async function withMcpAutomationUsage<T>(
  automationKey: TOrganizationApiKey | undefined | null,
  toolName: TMcpToolName,
  run: () => Promise<T>,
  getMetadata?: (result: T) => Record<string, unknown>
): Promise<T> {
  if (!automationKey || automationKey.type !== 'mcp') {
    return run();
  }

  const planName = await getOrganizationPlanName(automationKey.organizationId);
  const limits = getMcpAutomationLimits(planName);
  const category = getMcpAutomationCategory(toolName);
  const minuteWindowStart = getMinuteWindowStart().toISOString();
  const { keyLimit, orgLimit } = getMcpRateLimits(limits, category);

  try {
    const reservationId = await reserveMcpAutomationUsageSlot({
      organizationId: automationKey.organizationId,
      organizationApiKeyId: automationKey.id,
      type: automationKey.type,
      action: toolName,
      category,
      keyLimit,
      orgLimit,
      since: minuteWindowStart
    });

    try {
      const result = await run();
      await completeMcpAutomationUsageMetadata(reservationId, getMetadata ? getMetadata(result) : {});
      return result;
    } catch (error) {
      await releaseMcpAutomationUsageReservation(reservationId);
      throw error;
    }
  } catch (error) {
    if (error instanceof AutomationRateLimitExceededError) {
      throw new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429);
    }

    throw error;
  }
}
