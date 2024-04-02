import { PLANS_BY_FEATURE, PLAN } from './constants';

export function hasFeature(featureName: string, userPlan: string) {
  const features = PLANS_BY_FEATURE[userPlan];

  return features.includes(featureName);
}

export function isFreePlan(plan?: { plan_name: string }) {
  return !plan || plan.plan_name === PLAN.BASIC
}
