import type { StudentInviteListItem, StudentInviteAuditItem } from '../../utils/types';
import type { OrganizationTeamMembers } from '$features/org/utils/types';
import type { TCourseInvitePreset } from '@cio/utils/validation/course/invite';

export interface Profile {
  id: string;
  fullname: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export interface Person {
  id: string;
  email?: string;
  role_id: number;
  profile?: Profile;
  profile_id?: string;
  assigned_student_id: string;
}

export interface ProfileRole {
  label: string;
  value: string | number;
}

/** UI shape for tutor picker, derived from org team API response */
type OrgTeamMemberItem = OrganizationTeamMembers[number];
export type Tutor = Pick<OrgTeamMemberItem, 'id' | 'profileId' | 'email'> & {
  text: OrgTeamMemberItem['fullname'];
};

/** Re-export API-driven invite types from course utils */
export type InviteListItem = StudentInviteListItem;
export type InviteAuditItem = StudentInviteAuditItem;
export type InviteStatus = StudentInviteListItem['status'];

/** Re-export preset from validation (API contract) */
export type InvitePreset = TCourseInvitePreset;
