import { deriveAudienceMemberStatus } from '@api/utils/audience-member-status';
import { getLatestOrgInvitesByEmails, getOrganizationAudience } from '@cio/db/queries/organization';
import type { TGetAudienceQuery } from '@cio/utils/validation/organization';

export type AudienceExportRow = {
  name: string;
  email: string;
  memberStatus: string;
  inviteStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  enrolledCount: number;
  completedCount: number;
  progressPercent: number;
};

type AudienceExportQuery = Omit<TGetAudienceQuery, 'page' | 'limit'> & { memberIds?: number[] };

/** Page size for the internal walk. */
const EXPORT_PAGE_SIZE = 100;

/**
 * Yields the roster in batches so the caller can stream it. Invite status is
 * resolved per batch, not per row.
 */
export async function* getAudienceExportRows(
  orgId: string,
  query: AudienceExportQuery
): AsyncGenerator<AudienceExportRow[]> {
  // Ids must bypass the filters in the query itself. Filtering pages afterwards
  // would apply `status=ACTIVE` first and silently drop selected archived rows.
  const { memberIds, ...filters } = query;
  const listQuery = memberIds?.length ? { memberIds } : filters;

  let page = 1;

  for (;;) {
    const result = await getOrganizationAudience(orgId, {
      ...listQuery,
      page,
      limit: EXPORT_PAGE_SIZE
    });

    const items = result.items;

    if (items.length > 0) {
      const emailsWithoutProfile = items
        .filter((item) => !item.profileId && item.email)
        .map((item) => item.email.toLowerCase());

      const invites = await getLatestOrgInvitesByEmails(orgId, emailsWithoutProfile);
      const inviteByEmail = new Map(invites.map((invite) => [invite.email.toLowerCase(), invite]));

      yield items.map((item) => ({
        name: item.name,
        email: item.email,
        memberStatus: item.memberStatus,
        inviteStatus: deriveAudienceMemberStatus(
          item.profileId,
          item.email ? inviteByEmail.get(item.email.toLowerCase()) : undefined
        ),
        createdAt: item.createdAt,
        lastLoginAt: item.lastLoginAt,
        lastActiveAt: item.lastActiveAt,
        enrolledCount: item.enrolledCount,
        completedCount: item.completedCount,
        progressPercent: item.progressPercent
      }));
    }

    if (page >= result.totalPages || result.items.length === 0) {
      return;
    }

    page += 1;
  }
}
