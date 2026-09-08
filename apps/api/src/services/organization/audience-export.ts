import { deriveAudienceMemberStatus } from '@api/utils/audience-member-status';
import { getLatestOrgInvitesByEmails, getOrganizationAudience } from '@cio/db/queries/organization';
import type { TAudienceExportQuery } from '@cio/utils/validation/organization';

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

/** Page size for the internal walk. */
const EXPORT_PAGE_SIZE = 100;

/**
 * Ceiling on one export. The client builds the file in the browser, so an
 * unbounded roster is paid for twice — once in this response, again in the tab.
 * Past this the admin should narrow the filters.
 */
export const AUDIENCE_EXPORT_MAX_ROWS = 20_000;

/**
 * Every row matching the scope. Walked in pages so this process never holds
 * more than a page of database rows, but returned whole because the caller
 * renders the file client-side. Invite status resolves per page, not per row.
 */
export async function getAudienceExportRows(orgId: string, query: TAudienceExportQuery): Promise<AudienceExportRow[]> {
  // Ids must bypass the filters in the query itself. Filtering pages afterwards
  // would apply `status=ACTIVE` first and silently drop selected archived rows.
  const { memberIds, ...filters } = query;
  const listQuery = memberIds?.length ? { memberIds } : filters;

  const rows: AudienceExportRow[] = [];
  let page = 1;

  for (;;) {
    const result = await getOrganizationAudience(orgId, { ...listQuery, page, limit: EXPORT_PAGE_SIZE });

    if (result.items.length > 0) {
      const emailsWithoutProfile = result.items
        .filter((item) => !item.profileId && item.email)
        .map((item) => item.email.toLowerCase());

      const invites = await getLatestOrgInvitesByEmails(orgId, emailsWithoutProfile);
      const inviteByEmail = new Map(invites.map((invite) => [invite.email.toLowerCase(), invite]));

      for (const item of result.items) {
        rows.push({
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
        });
      }
    }

    if (rows.length >= AUDIENCE_EXPORT_MAX_ROWS || page >= result.totalPages || result.items.length === 0) {
      return rows.slice(0, AUDIENCE_EXPORT_MAX_ROWS);
    }

    page += 1;
  }
}
