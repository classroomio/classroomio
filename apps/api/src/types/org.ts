import type { AudienceMemberStatus } from '@api/utils/audience-member-status';
import type {
  TAudienceActivityWindow,
  TAudienceCertificate,
  TAudienceCompletion,
  TAudienceEnrollment,
  TAudienceInviteStatus,
  TAudienceMemberStatus,
  TAudienceSortBy,
  TAudienceSortOrder
} from '@cio/utils/validation/organization';

export type OrgAudienceMember = {
  id: number;
  profileId: string | null;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  /** Derived invite state. Not the lifecycle state — that is `memberStatus`. */
  status: AudienceMemberStatus;
  /** Lifecycle state of the membership: ACTIVE / DEACTIVATED / ARCHIVED. */
  memberStatus: TAudienceMemberStatus;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  enrolledCount: number;
  completedCount: number;
  progressPercent: number;
  /** Courses in this organization where the learner has earned a certificate. */
  certificateCount: number;
};

export type OrgAudiencePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OrgWidgetPagination = {
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
  status: TAudienceMemberStatus;
  inviteStatus?: TAudienceInviteStatus;
  enrollment?: TAudienceEnrollment;
  completion?: TAudienceCompletion;
  certificate?: TAudienceCertificate;
  lastLoginBefore?: TAudienceActivityWindow;
  lastActiveBefore?: TAudienceActivityWindow;
  excludeRecentJoiners: boolean;
};
