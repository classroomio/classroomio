import { countMathVisionRequests, MATH_VISION_USAGE_PREFIX } from '@cio/db/queries/agent';
import { enforceTokenBalance, isOrgOnPaidPlan, recordTokenUsage } from '@cio/core/services/agent/usage';
import { MATH_FREE_PLAN_MONTHLY_CONVERSIONS } from '@cio/utils/validation/math';
import { ErrorCodes } from '@cio/utils/constants';
import { AppError } from '@api/utils/errors';

function startOfCurrentMonthUtc(): Date {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Applies the same org token pool as the AI tutor, plus a small monthly conversion allowance on the free plan.
 * Throws a 402 AppError when either is exhausted.
 */
export async function enforceMathVisionAllowance(orgId: string): Promise<void> {
  await enforceTokenBalance(orgId);

  if (await isOrgOnPaidPlan(orgId)) return;

  const used = await countMathVisionRequests(orgId, startOfCurrentMonthUtc());
  if (used < MATH_FREE_PLAN_MONTHLY_CONVERSIONS) return;

  throw new AppError(
    'Free plan image conversions are used up for this month',
    ErrorCodes.MATH_VISION_LIMIT_REACHED,
    402
  );
}

export async function recordMathVisionUsage(
  orgId: string,
  userId: string,
  courseId: string,
  usage: { promptTokens: number; completionTokens: number },
  modelName: string
): Promise<void> {
  await recordTokenUsage(
    orgId,
    userId,
    courseId,
    { ...usage, totalTokens: usage.promptTokens + usage.completionTokens },
    MATH_VISION_USAGE_PREFIX + modelName
  );
}
