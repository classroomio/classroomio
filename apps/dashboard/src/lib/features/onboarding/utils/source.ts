import { AI_SOURCE_VALUE } from './constants';

export function resolveOnboardingSource(source: string, aiProvider: string): string {
  return source === AI_SOURCE_VALUE ? aiProvider : source;
}
