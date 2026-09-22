import type { LearningPathDetail } from './learning-path-detail.types';
import type { LearningPathItem } from './types';

export function toLearningPathDetail(
  paths: LearningPathItem[],
  details: Record<string, LearningPathDetail>,
  slug: string
): LearningPathDetail | null {
  const path = paths.find((candidate) => candidate.slug === slug);

  if (!path) return null;

  return details[slug] ?? null;
}
