import type { OrganizationAudience, OrganizationTeamMembers } from '$features/org/utils/types';

type OrgTeamMemberItem = OrganizationTeamMembers[number];
export type Tutor = Pick<OrgTeamMemberItem, 'id' | 'profileId' | 'email'> & {
  text: OrgTeamMemberItem['fullname'];
};

type OrgAudienceMemberItem = OrganizationAudience[number];
export type OrgStudent = OrgAudienceMemberItem;
