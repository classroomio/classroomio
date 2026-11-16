import { listCourseCommentTeam, type TCourseCommentTeamRole } from '@cio/db/queries/course-comment';

import { assertTeamCommentsEnabled } from './access';

export interface TCourseCommentTeamMemberView {
  profileId: string;
  fullname: string;
  avatarUrl: string | null;
  role: TCourseCommentTeamRole;
}

/**
 * The people who can be @mentioned on a course: its current comment team.
 */
export async function listCourseCommentTeamView(courseId: string): Promise<TCourseCommentTeamMemberView[]> {
  await assertTeamCommentsEnabled(courseId);
  const team = await listCourseCommentTeam(courseId);

  return team.map((member) => ({
    profileId: member.profileId,
    fullname: member.fullname,
    avatarUrl: member.avatarUrl,
    role: member.role
  }));
}
