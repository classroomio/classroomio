import { describe, expect, it } from 'vitest';

import { collapseLatestActivityByMember } from '@cio/db/queries/analytics/analytics';

type PageEvent = Parameters<typeof collapseLatestActivityByMember>[0][number];

const ORG = '11111111-1111-1111-1111-111111111111';
const OTHER_ORG = '99999999-9999-9999-9999-999999999999';
const LEARNER = '22222222-2222-2222-2222-222222222222';
const OTHER_LEARNER = '33333333-3333-3333-3333-333333333333';

function pageEvent(overrides: Partial<PageEvent>): PageEvent {
  return {
    orgId: ORG,
    userId: LEARNER,
    occurredAt: '2026-09-01T10:00:00.000Z',
    ...overrides
  } as PageEvent;
}

describe('collapseLatestActivityByMember', () => {
  it('keeps only the latest event per member', () => {
    const collapsed = collapseLatestActivityByMember([
      pageEvent({ occurredAt: '2026-09-01T10:00:00.000Z' }),
      pageEvent({ occurredAt: '2026-09-03T10:00:00.000Z' }),
      pageEvent({ occurredAt: '2026-09-02T10:00:00.000Z' })
    ]);

    expect(collapsed).toEqual([{ orgId: ORG, userId: LEARNER, occurredAt: '2026-09-03T10:00:00.000Z' }]);
  });

  it('picks the latest regardless of batch ordering', () => {
    const ascending = collapseLatestActivityByMember([
      pageEvent({ occurredAt: '2026-09-01T10:00:00.000Z' }),
      pageEvent({ occurredAt: '2026-09-05T10:00:00.000Z' })
    ]);
    const descending = collapseLatestActivityByMember([
      pageEvent({ occurredAt: '2026-09-05T10:00:00.000Z' }),
      pageEvent({ occurredAt: '2026-09-01T10:00:00.000Z' })
    ]);

    expect(ascending).toEqual(descending);
    expect(ascending[0].occurredAt).toBe('2026-09-05T10:00:00.000Z');
  });

  it('tracks the same person separately per organization', () => {
    const collapsed = collapseLatestActivityByMember([
      pageEvent({ orgId: ORG, occurredAt: '2026-09-01T10:00:00.000Z' }),
      pageEvent({ orgId: OTHER_ORG, occurredAt: '2026-09-04T10:00:00.000Z' })
    ]);

    expect(collapsed).toHaveLength(2);
    expect(collapsed).toContainEqual({ orgId: ORG, userId: LEARNER, occurredAt: '2026-09-01T10:00:00.000Z' });
    expect(collapsed).toContainEqual({ orgId: OTHER_ORG, userId: LEARNER, occurredAt: '2026-09-04T10:00:00.000Z' });
  });

  it('tracks different members in one organization separately', () => {
    const collapsed = collapseLatestActivityByMember([
      pageEvent({ userId: LEARNER, occurredAt: '2026-09-01T10:00:00.000Z' }),
      pageEvent({ userId: OTHER_LEARNER, occurredAt: '2026-09-02T10:00:00.000Z' })
    ]);

    expect(collapsed).toHaveLength(2);
  });

  it('drops events that carry no membership signal', () => {
    const collapsed = collapseLatestActivityByMember([
      pageEvent({ userId: null }),
      pageEvent({ orgId: null }),
      pageEvent({ occurredAt: undefined })
    ]);

    expect(collapsed).toEqual([]);
  });

  it('returns nothing for an empty batch', () => {
    expect(collapseLatestActivityByMember([])).toEqual([]);
  });

  it('keeps anonymous traffic from masking a real member', () => {
    const collapsed = collapseLatestActivityByMember([
      pageEvent({ userId: null, occurredAt: '2026-09-09T10:00:00.000Z' }),
      pageEvent({ userId: LEARNER, occurredAt: '2026-09-02T10:00:00.000Z' })
    ]);

    expect(collapsed).toEqual([{ orgId: ORG, userId: LEARNER, occurredAt: '2026-09-02T10:00:00.000Z' }]);
  });
});
