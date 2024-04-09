import { PLANS_BY_FEATURE } from './constants';

export function hasFeature(featureName: string, userPlan: string) {
  const features = PLANS_BY_FEATURE[userPlan];

  return features.includes(featureName);
}
