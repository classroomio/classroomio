import { getActivePathGrantsForCourseAndProfile, hasLiveNonPathGrant } from '@cio/db/queries/learning-path';

export type TCourseRedirectTarget = { type: 'course' } | { type: 'path'; publicId: string } | { type: 'hub' };

/**
 * Decides where a learner should open a course, for the learning-path
 * redirect behavior: independent (non-path) access stays on the course URL,
 * exactly one live path grant redirects into that path, otherwise the hub.
 *
 * Data-only contract for the LMS branch, which owns the actual navigation.
 * No authentication or membership checks here — callers authorize first.
 */
export async function resolveCourseRedirect(courseId: string, profileId: string): Promise<TCourseRedirectTarget> {
  const [hasNonPathAccess, pathGrants] = await Promise.all([
    hasLiveNonPathGrant(courseId, profileId),
    getActivePathGrantsForCourseAndProfile(courseId, profileId)
  ]);

  if (hasNonPathAccess) {
    return { type: 'course' };
  }

  const redirectable = pathGrants.filter((grant): grant is { learningPathId: string; publicId: string } =>
    Boolean(grant.publicId)
  );

  if (redirectable.length === 1) {
    return { type: 'path', publicId: redirectable[0].publicId };
  }

  return { type: 'hub' };
}
