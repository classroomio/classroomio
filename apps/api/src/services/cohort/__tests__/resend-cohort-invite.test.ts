import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortById: vi.fn(),
  getCohortMemberRole: vi.fn(),
  isOrgAdminByCohortId: vi.fn()
}));
vi.mock('@api/services/organization/audience', () => ({ importAudienceMembers: vi.fn() }));

import { getCohortById } from '@cio/db/queries/cohort';
import { importAudienceMembers } from '@api/services/organization/audience';
import { resendCohortInvite } from '@api/services/cohort/invite';

const COHORT_ID = 'cohort-1';
const EMAIL = 'pending@example.com';

function importedRow(status: string) {
  return { rows: [{ email: EMAIL, status, inviteId: status === 'invite_resent' ? 'invite-1' : null }] } as never;
}

describe('resendCohortInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCohortById).mockResolvedValue({ id: COHORT_ID, organizationId: 'org-1' } as never);
  });

  it('returns the fresh invite when the email was sent', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(importedRow('invite_resent'));

    await expect(resendCohortInvite(COHORT_ID, EMAIL, 'tutor-1')).resolves.toEqual({
      email: EMAIL,
      status: 'invite_resent',
      inviteId: 'invite-1'
    });
  });

  it.each([
    ['over_seat_limit', 403],
    ['is_staff', 409],
    ['archived', 409],
    ['invalid_email', 400]
  ])('refuses instead of reporting success when the row is %s', async (status, statusCode) => {
    vi.mocked(importAudienceMembers).mockResolvedValue(importedRow(status));

    await expect(resendCohortInvite(COHORT_ID, EMAIL, 'tutor-1')).rejects.toMatchObject({ statusCode });
  });
});
