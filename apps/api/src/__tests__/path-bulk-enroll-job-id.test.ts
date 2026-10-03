import { describe, expect, it } from 'vitest';

import { buildPathBulkEnrollJobId } from '@cio/jobs/enqueue';
import { ROLE } from '@cio/utils/constants';

const PATH_ID = '11111111-1111-4111-8111-111111111111';

function payload(members: Array<{ profileId?: string; email?: string }>, enqueuedAt = '2026-10-03T03:22:37.000Z') {
  return {
    organizationId: 'org-1',
    actorProfileId: 'admin-1',
    pathId: PATH_ID,
    enqueuedAt,
    members: members.map((member) => ({ ...member, roleId: ROLE.STUDENT as 3 })),
    chunkSize: 50,
    sendEmail: true
  };
}

describe('buildPathBulkEnrollJobId', () => {
  it('is the same for the same payload regardless of member order', () => {
    const first = buildPathBulkEnrollJobId(payload([{ profileId: 'a' }, { email: 'b@example.com' }]));
    const second = buildPathBulkEnrollJobId(payload([{ email: 'b@example.com' }, { profileId: 'a' }]));

    expect(first).toBe(second);
  });

  it('differs for another admin decision (enqueuedAt) or another member set', () => {
    const base = buildPathBulkEnrollJobId(payload([{ profileId: 'a' }]));

    expect(buildPathBulkEnrollJobId(payload([{ profileId: 'a' }], '2026-10-03T03:22:38.000Z'))).not.toBe(base);
    expect(buildPathBulkEnrollJobId(payload([{ profileId: 'b' }]))).not.toBe(base);
  });

  it('never contains ":" so BullMQ accepts it as a custom id', () => {
    const jobId = buildPathBulkEnrollJobId(payload([{ profileId: 'a' }]));

    expect(jobId).not.toContain(':');
    expect(jobId.startsWith(`path-bulk-enroll_${PATH_ID}_`)).toBe(true);
  });
});
