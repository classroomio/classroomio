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

/** Page size for the internal walk. Large enough to be efficient, small enough to stay in constant memory. */
const EXPORT_PAGE_SIZE = 100;

/**
 * Yields the roster in batches so the caller can stream it without ever holding
 * the whole set in memory.
 *
 * Invite status is resolved per batch rather than per row: a `Promise.all` of a
 * per-row lookup across 20,000 learners is exactly the shape that turns an
 * export into an outage.
 */
export async function* getAudienceExportRows(
  orgId: string,
  query: AudienceExportQuery
): AsyncGenerator<AudienceExportRow[]> {
  // `memberIds` takes precedence over the filters *entirely*, and that has to
  // happen before the query runs. Filtering the pages afterwards would apply
  // the ordinary filters first — including the default `status=ACTIVE` — so
  // exporting a hand-picked set that includes archived learners would silently
  // drop them, handing the admin a shorter list than the one they ticked.
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
