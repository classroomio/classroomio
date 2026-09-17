import { MOCK_TUTOR_ID } from './mock-data';
import type { LearningPathDetail, LearningPathSummary } from './types';

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
 * Checks if a learning path is accessible to a user based on their organization role and profile.
 *
 * @param path The learning path detail or summary
 * @param isAdmin Whether the current user is an organization admin
 * @param userProfileId The current user's profile ID
 * @returns True if accessible; false otherwise
 */
export function isPathAccessibleToUser(
  path: LearningPathSummary | LearningPathDetail,
  isAdmin: boolean,
  userProfileId?: string | null
): boolean {
  if (isAdmin) {
    return true;
  }

  if (!path.tutorIds || path.tutorIds.length === 0) {
    return false;
  }

  if (userProfileId && path.tutorIds.includes(userProfileId)) {
    return true;
  }

  return path.tutorIds.includes(MOCK_TUTOR_ID);
}

/**
 * Resolves the active learning path by checking currentPath, paths list, and fallback data.
 */
export function resolveActivePath(
  publicPathId: string,
  currentPath: LearningPathDetail | null,
  paths: LearningPathDetail[],
  fallback?: LearningPathDetail | null,
  access?: { isAdmin?: boolean | null; userProfileId?: string | null }
): LearningPathDetail | null {
  let candidate: LearningPathDetail | null = null;

  if (currentPath?.publicId === publicPathId) {
    candidate = currentPath;
  } else {
    const found = paths.find((p) => p.publicId === publicPathId);
    candidate = found || fallback || null;
  }

  if (candidate && access && access.isAdmin !== undefined && access.isAdmin !== null) {
    const isAccessible = isPathAccessibleToUser(candidate, access.isAdmin, access.userProfileId);
    if (!isAccessible) {
      return null;
    }
  }

  return candidate;
}
