import { PLAN, STUDENT_LIMITS } from './constants';

/**
 * Org-scoped resources that carry a per-plan limit and are surfaced to the
 * dashboard. Extend this tuple (plus PLAN_LIMITS) to add a new limited resource.
 */
export const PLAN_LIMIT_RESOURCES = ['students'] as const;
export type PlanLimitResource = (typeof PLAN_LIMIT_RESOURCES)[number];

/** Per-resource, per-plan numeric caps (Infinity = unlimited). */
export const PLAN_LIMITS: Record<PlanLimitResource, Record<string, number>> = {
  students: STUDENT_LIMITS
};

export function getPlanLimit(resource: PlanLimitResource, planName: string | null | undefined): number {
  const table = PLAN_LIMITS[resource];
  if (!planName) return table[PLAN.BASIC];

  return table[planName] ?? table[PLAN.BASIC];
}

/** JSON-safe usage record carried in the account payload. `limit: null` = unlimited. */
export type ResourceUsage = { used: number; limit: number | null };
export type OrgUsageLimits = Partial<Record<PlanLimitResource, ResourceUsage>>;

/** Build a usage record, converting a non-JSON-safe Infinity limit to null. */
export function toResourceUsage(used: number, planLimit: number): ResourceUsage {
  return { used, limit: Number.isFinite(planLimit) ? planLimit : null };
}

export function isResourceLimitReached(usage: ResourceUsage | undefined): boolean {
  if (!usage || usage.limit === null) return false;

  return usage.used >= usage.limit;
}

export function resourceLimitRemaining(usage: ResourceUsage | undefined): number | null {
  if (!usage || usage.limit === null) return null;

  return Math.max(0, usage.limit - usage.used);
}
