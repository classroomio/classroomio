import { describe, expect, it } from 'vitest';

import { summarizeAddMembersCounts, summarizeAddMembersResult } from './path-add-members-utils';

describe('summarizeAddMembersResult', () => {
  it('tracks a queued add by job id', () => {
    expect(summarizeAddMembersResult({ mode: 'queued', jobId: 'job-1', requested: 120 })).toEqual({
      kind: 'queued',
      jobId: 'job-1',
      requested: 120
    });
  });

  it('reports a clean inline add as added', () => {
    expect(
      summarizeAddMembersResult({ mode: 'completed', members: [{}, {}], enrolled: 2, invited: 1, failed: [] })
    ).toEqual({ kind: 'added', added: 2, invited: 1 });
  });

  it('never reports success when some members failed', () => {
    expect(summarizeAddMembersResult({ mode: 'completed', enrolled: 40, invited: 5, failed: [{}, {}, {}] })).toEqual({
      kind: 'partial',
      added: 40,
      invited: 5,
      notAdded: 3
    });
  });

  it('counts emails skipped for an existing staff invite as not added', () => {
    expect(
      summarizeAddMembersResult({
        mode: 'completed',
        enrolled: 1,
        invited: 0,
        failed: [],
        skippedStaffInviteEmails: ['t@x.dev']
      })
    ).toEqual({ kind: 'partial', added: 1, invited: 0, notAdded: 1 });
  });
});

describe('summarizeAddMembersCounts', () => {
  it('falls back to the returned member rows when no enrolled count is present', () => {
    expect(summarizeAddMembersCounts({ members: [{}, {}, {}] })).toEqual({ kind: 'added', added: 3, invited: 0 });
  });
});
