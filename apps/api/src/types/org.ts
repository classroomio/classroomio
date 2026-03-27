import type { AudienceMemberStatus } from '@api/utils/audience-member-status';

export type OrgAudienceMember = {
  id: number;
  profileId: string | null;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  status: AudienceMemberStatus;
};
