import { db } from '@cio/db';
import * as schema from '@cio/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TokenBalance, TokenUsage } from '@cio/ai-assistant';

// ─── Plan-Based Token Allowances ─────────────────────────────────────────────

const PLAN_TOKEN_ALLOWANCES: Record<string, number> = {
  BASIC: 50_000,
  EARLY_ADOPTER: 500_000,
  ENTERPRISE: 2_000_000
};

/**
 * Get the monthly token allowance for an org based on its active plan.
 * Also checks if the plan payload has a custom `aiTokenAllowance` override.
 */
async function getPlanAllowance(orgId: string): Promise<{ planName: string; allowance: number }> {
  const activePlan = await getActiveOrganizationPlan(orgId);

  if (!activePlan || !activePlan.planName) {
    return { planName: 'BASIC', allowance: PLAN_TOKEN_ALLOWANCES.BASIC };
  }

  const planName = activePlan.planName;
  const payload = activePlan.payload as Record<string, unknown> | null;
  const customAllowance = payload?.aiTokenAllowance as number | undefined;
  const allowance = customAllowance ?? PLAN_TOKEN_ALLOWANCES[planName] ?? 0;

  return { planName, allowance };
}

/**
 * Get the total tokens used by an org in the current month.
 */
async function getMonthlyUsage(orgId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({
      totalTokens: sql<number>`COALESCE(SUM(${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens}), 0)`
    })
    .from(schema.aiTokenUsage)
    .where(and(eq(schema.aiTokenUsage.orgId, orgId), gte(schema.aiTokenUsage.createdAt, startOfMonth.toISOString())));

  return Number(result?.totalTokens ?? 0);
}

/**
 * Get the credit balance for an org.
 */
async function getCreditBalance(orgId: string): Promise<number> {
  const [result] = await db
    .select({ balance: schema.aiCreditBalance.balance })
    .from(schema.aiCreditBalance)
    .where(eq(schema.aiCreditBalance.orgId, orgId))
    .limit(1);

  return result?.balance ?? 0;
}

/**
 * Get the full token balance for an org: used, allowance, credits, remaining.
 */
export async function getTokenBalance(orgId: string): Promise<TokenBalance> {
  const [{ planName, allowance }, monthlyUsage, creditBalance] = await Promise.all([
    getPlanAllowance(orgId),
    getMonthlyUsage(orgId),
    getCreditBalance(orgId)
  ]);

  const remainingAllowance = Math.max(0, allowance - monthlyUsage);
  const remaining = remainingAllowance + creditBalance;

  return {
    used: monthlyUsage,
    allowance,
    creditBalance,
    remaining
  };
}

/**
 * Check if the org has sufficient tokens. Throws 402 if exhausted.
 */
export async function enforceTokenBalance(orgId: string): Promise<TokenBalance> {
  const balance = await getTokenBalance(orgId);

  if (balance.remaining <= 0) {
    throw new AppError('Token limit reached', 'TOKEN_LIMIT_REACHED', 402);
  }

  return balance;
}

/**
 * Record token usage after an LLM call.
 */
export async function recordTokenUsage(
  orgId: string,
  userId: string,
  courseId: string,
  usage: TokenUsage,
  model: string
): Promise<void> {
  await db.insert(schema.aiTokenUsage).values({
    orgId,
    userId,
    courseId,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    model
  });
}

/**
 * Check if an org's plan supports a specific feature (e.g., document upload).
 * Returns the plan name so callers can decide what to gate.
 */
export async function getOrgPlanName(orgId: string): Promise<string> {
  const { planName } = await getPlanAllowance(orgId);

  return planName;
}

/**
 * Check if an org is on a paid plan (EARLY_ADOPTER or above).
 */
export async function isOrgOnPaidPlan(orgId: string): Promise<boolean> {
  const planName = await getOrgPlanName(orgId);

  return planName !== 'BASIC';
}

// ─── Usage History ───────────────────────────────────────────────────────────

export interface DailyUsage {
  date: string;
  tokens: number;
}

/**
 * Get daily token usage for the current month, grouped by day.
 */
export async function getUsageHistory(orgId: string): Promise<DailyUsage[]> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`DATE(${schema.aiTokenUsage.createdAt})`,
      tokens: sql<number>`SUM(${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})`
    })
    .from(schema.aiTokenUsage)
    .where(and(eq(schema.aiTokenUsage.orgId, orgId), gte(schema.aiTokenUsage.createdAt, startOfMonth.toISOString())))
    .groupBy(sql`DATE(${schema.aiTokenUsage.createdAt})`)
    .orderBy(sql`DATE(${schema.aiTokenUsage.createdAt})`);

  return rows.map((row) => ({
    date: String(row.date),
    tokens: Number(row.tokens)
  }));
}

/**
 * Get full detailed usage stats for the usage endpoint.
 */
export async function getDetailedUsage(orgId: string) {
  const [balance, history] = await Promise.all([getTokenBalance(orgId), getUsageHistory(orgId)]);

  return { ...balance, history };
}

// ─── Credit Purchases ────────────────────────────────────────────────────────

/**
 * Add credits to an org's balance.
 * Creates the balance row if it doesn't exist (upsert).
 */
export async function addCredits(orgId: string, amount: number): Promise<number> {
  if (amount <= 0) {
    throw new AppError('Credit amount must be positive', 'INVALID_CREDIT_AMOUNT', 400);
  }

  const existing = await db
    .select({ id: schema.aiCreditBalance.id, balance: schema.aiCreditBalance.balance })
    .from(schema.aiCreditBalance)
    .where(eq(schema.aiCreditBalance.orgId, orgId))
    .limit(1);

  if (existing.length > 0) {
    const newBalance = existing[0].balance + amount;
    await db
      .update(schema.aiCreditBalance)
      .set({ balance: newBalance, updatedAt: new Date().toISOString() })
      .where(eq(schema.aiCreditBalance.orgId, orgId));

    return newBalance;
  }

  await db.insert(schema.aiCreditBalance).values({ orgId, balance: amount });

  return amount;
}
