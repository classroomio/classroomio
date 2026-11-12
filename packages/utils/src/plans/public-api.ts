import { PLAN } from './constants';

export function canUsePublicApi(planName: string | null | undefined, isSelfHosted: boolean): boolean {
  if (!planName || planName === PLAN.BASIC) {
    return false;
  }

  if (isSelfHosted) {
    return planName === PLAN.ENTERPRISE;
  }

  return planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE;
}

export const AUTOMATION_PLAN_GATE_MESSAGES = {
  publicApi: {
    cloud: 'Public API keys require an Early Adopter or Enterprise plan',
    selfHosted: 'Public API keys require an Enterprise plan'
  },
  webhooks: {
    cloud: 'Webhooks require an Early Adopter or Enterprise plan',
    selfHosted: 'Webhooks require an Enterprise plan'
  }
} as const;

/**
 * Whether an API error message is the plan gate that blocks the public API or webhooks for the whole organization,
 * as opposed to a narrower upgrade prompt such as a full student limit.
 */
export function isAutomationPlanGateMessage(message: string | undefined): boolean {
  if (!message) return false;

  return Object.values(AUTOMATION_PLAN_GATE_MESSAGES).some(
    (gate) => message === gate.cloud || message === gate.selfHosted
  );
}

/**
 * Whether the given org plan is allowed to fetch YouTube captions via the
 * provider API. Free (`BASIC`) orgs keep the current no-transcript behavior.
 * Self-hosted is ungated (same pattern as other paid cloud features).
 */
export function canFetchYouTubeCaptions(planName: string | null | undefined, isSelfHosted: boolean): boolean {
  if (isSelfHosted) {
    return true;
  }

  if (!planName || planName === PLAN.BASIC) {
    return false;
  }

  return planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE;
}
