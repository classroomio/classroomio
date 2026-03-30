import type { AudienceMemberStatus } from '@api/utils/audience-member-status';
import type { TAudienceSortBy, TAudienceSortOrder } from '@cio/utils/validation/organization';

export type OrgAudienceMember = {
  id: number;
  profileId: string | null;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  status: AudienceMemberStatus;
};

export type OrgAudiencePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OrgAudienceQuery = {
  page: number;
  limit: number;
  search?: string;
  sortBy: TAudienceSortBy;
  sortOrder: TAudienceSortOrder;
};
