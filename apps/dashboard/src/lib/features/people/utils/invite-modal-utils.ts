import { ROLE } from '@cio/utils/constants';
import type { OrgTeamMember } from '$lib/utils/types/org';
import type { OrgStudent, Tutor } from './types';

export interface InviteRosterMember {
  profileId: string | null;
  roleId: number;
  email: string | null;
}

/**
 * Tutors available to invite: verified team members not already tutoring the
 * resource. Matches by profileId or normalized email, but only against
 * non-student roster entries so students stay promotable through this tab.
 */
export function getInviteCandidateTutors(team: OrgTeamMember[], members: InviteRosterMember[]): Tutor[] {
  const existingTutorProfileIds = new Set(
    members
      .filter((member) => member.roleId !== ROLE.STUDENT)
      .map((member) => member.profileId)
      .filter((profileId): profileId is string => Boolean(profileId))
  );
  const existingTutorEmails = new Set(
    members
      .filter((member) => member.roleId !== ROLE.STUDENT)
      .map((member) => member.email?.toLowerCase())
      .filter((email): email is string => Boolean(email))
  );

  return team
    .filter((teamMember) => teamMember.verified)
    .filter((teamMember) => {
      if (teamMember.profileId && existingTutorProfileIds.has(teamMember.profileId)) {
        return false;
      }

      if (teamMember.email && existingTutorEmails.has(teamMember.email.toLowerCase())) {
        return false;
      }

      return true;
    })
    .map((teamMember) => ({
      id: teamMember.id,
      text: teamMember.fullname,
      profileId: teamMember.profileId,
      email: teamMember.email
    }));
}

/**
 * Audience students not yet enrolled as students on the roster.
 * Mirrors the course modal on prod (profileId-only exclusion).
 */
export function getInviteCandidateStudents(students: OrgStudent[], members: InviteRosterMember[]) {
  const enrolledStudentIds = new Set(
    members
      .filter((member) => member.roleId === ROLE.STUDENT)
      .map((member) => member.profileId)
      .filter((profileId): profileId is string => Boolean(profileId))
  );

  return students.filter((student) => {
    if (!student.profileId) {
      return false;
    }

    return !enrolledStudentIds.has(student.profileId);
  });
}
