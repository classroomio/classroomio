import { AppError, ErrorCodes } from '@api/utils/errors';
import { getMarksByCourseId } from '@cio/db/queries/mark';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';

export type MarksViewerScope = {
  canViewAllMarks: boolean;
  groupMemberId: string | null;
};

/**
 * Instructors (course admin/tutor or org admin) may see every learner's scores.
 * Students are scoped to their own group membership.
 */
export async function resolveMarksViewerScope(courseId: string, profileId: string): Promise<MarksViewerScope> {
  const canViewAllMarks = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);

  if (canViewAllMarks) {
    return { canViewAllMarks: true, groupMemberId: null };
  }

  const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, profileId);
  return { canViewAllMarks: false, groupMemberId };
}

/**
 * Gets marks for a course
 * Marks are computed from submissions and exercises using a database function
 * @param courseId Course ID
 * @param profileId Viewing user's profile ID
 * @returns Array of mark records visible to the viewer
 */
export async function getMarks(courseId: string, profileId: string) {
  try {
    const { canViewAllMarks, groupMemberId } = await resolveMarksViewerScope(courseId, profileId);

    if (canViewAllMarks) {
      return await getMarksByCourseId(courseId);
    }

    if (!groupMemberId) {
      return [];
    }

    return await getMarksByCourseId(courseId, groupMemberId);
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : 'Failed to get marks', ErrorCodes.INTERNAL_ERROR, 500);
  }
}
