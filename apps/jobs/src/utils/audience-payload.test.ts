import { describe, expect, it } from 'vitest';

import { ZAudienceBulkActionPayload } from '@cio/jobs';

const basePayload = {
  organizationId: 'org-1',
  actorProfileId: 'profile-1',
  memberIds: [1, 2, 3]
};

describe('ZAudienceBulkActionPayload', () => {
  it.each(['archive', 'unarchive', 'delete'])('accepts the %s action unchanged', (action) => {
    expect(ZAudienceBulkActionPayload.parse({ ...basePayload, action }).action).toBe(action);
  });

  it.each([
    ['deactivate', 'archive'],
    ['reactivate', 'unarchive']
  ])('runs a job queued with the retired %s action as %s', (retiredAction, replacement) => {
    expect(ZAudienceBulkActionPayload.parse({ ...basePayload, action: retiredAction }).action).toBe(replacement);
  });

  it.each(['constructor', 'purge', ''])('still rejects the unknown action %j', (action) => {
    expect(ZAudienceBulkActionPayload.safeParse({ ...basePayload, action }).success).toBe(false);
  });
});
