import type { LearningPathDetail } from './types';

/**
 * Generates an SEO-friendly URL slug from a title
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves the active learning path by checking currentPath, paths list, and fallback data.
 */
export function resolveActivePath(
  pathId: string,
  currentPath: LearningPathDetail | null,
  paths: LearningPathDetail[],
  fallback?: LearningPathDetail | null
): LearningPathDetail | null {
  if (currentPath && (currentPath.id === pathId || currentPath.slug === pathId)) {
    return currentPath;
  }

  const found = paths.find((p) => p.id === pathId || p.slug === pathId);
  if (found) {
    return found;
  }

  return fallback || null;
}
