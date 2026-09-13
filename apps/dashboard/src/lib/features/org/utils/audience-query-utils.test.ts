import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ORG_AUDIENCE_QUERY,
  applyAudienceView,
  clearAudienceFilters,
  countActiveAudienceFilters,
  getAudienceQueryFromSearchParams,
  getAudienceSearchParams,
  matchAudienceView
} from './audience-query-utils';

describe('getAudienceQueryFromSearchParams', () => {
  it('returns the defaults for an empty URL', () => {
    expect(getAudienceQueryFromSearchParams(new URLSearchParams())).toEqual(DEFAULT_ORG_AUDIENCE_QUERY);
  });

  it('reads every filter off the URL', () => {
    const query = getAudienceQueryFromSearchParams(
      new URLSearchParams(
        'status=ARCHIVED&inviteStatus=pending&enrollment=enrolled&completion=not_started&lastLoginBefore=90d&lastActiveBefore=never&sortBy=lastActiveAt&sortOrder=asc&page=3&search=ada'
      )
    );

    expect(query).toMatchObject({
      status: 'ARCHIVED',
      inviteStatus: 'pending',
      enrollment: 'enrolled',
      completion: 'not_started',
      lastLoginBefore: '90d',
      lastActiveBefore: 'never',
      sortBy: 'lastActiveAt',
      sortOrder: 'asc',
      page: 3,
      search: 'ada'
    });
  });

  it('falls back to defaults on unrecognised values rather than failing to load', () => {
    const query = getAudienceQueryFromSearchParams(
      new URLSearchParams('status=BOGUS&sortBy=nonsense&lastLoginBefore=42y&page=-1')
    );

    expect(query.status).toBe(DEFAULT_ORG_AUDIENCE_QUERY.status);
    expect(query.sortBy).toBe(DEFAULT_ORG_AUDIENCE_QUERY.sortBy);
    expect(query.lastLoginBefore).toBeUndefined();
    expect(query.page).toBe(DEFAULT_ORG_AUDIENCE_QUERY.page);
  });

  it('keeps the recent-joiner guard on unless the URL explicitly disables it', () => {
    expect(getAudienceQueryFromSearchParams(new URLSearchParams()).excludeRecentJoiners).toBe(true);
    expect(
      getAudienceQueryFromSearchParams(new URLSearchParams('excludeRecentJoiners=nonsense')).excludeRecentJoiners
    ).toBe(true);
    expect(
      getAudienceQueryFromSearchParams(new URLSearchParams('excludeRecentJoiners=false')).excludeRecentJoiners
    ).toBe(false);
  });
});

describe('getAudienceSearchParams', () => {
  it('writes nothing for a default query, so /audience stays clean', () => {
    expect(getAudienceSearchParams(DEFAULT_ORG_AUDIENCE_QUERY).toString()).toBe('');
  });

  it('round-trips a filtered query', () => {
    const original = applyAudienceView('inactive_180d', DEFAULT_ORG_AUDIENCE_QUERY);
    const restored = getAudienceQueryFromSearchParams(getAudienceSearchParams(original));

    expect(restored).toEqual(original);
  });

  it('round-trips every saved view', () => {
    for (const view of ['all', 'never_logged_in', 'inactive_90d', 'enrolled_not_started', 'archived'] as const) {
      const original = applyAudienceView(view, DEFAULT_ORG_AUDIENCE_QUERY);

      expect(getAudienceQueryFromSearchParams(getAudienceSearchParams(original))).toEqual(original);
    }
  });
});

describe('audience views', () => {
  it('recognises the view a query represents', () => {
    expect(matchAudienceView(applyAudienceView('never_logged_in'))).toBe('never_logged_in');
    expect(matchAudienceView(applyAudienceView('archived'))).toBe('archived');
    expect(matchAudienceView(DEFAULT_ORG_AUDIENCE_QUERY)).toBe('all');
  });

  it('reports no view for a filter combination that is not one', () => {
    expect(matchAudienceView({ ...DEFAULT_ORG_AUDIENCE_QUERY, completion: 'completed' })).toBeNull();
  });

  it('keeps the admin search and sort when switching view', () => {
    const current = { ...DEFAULT_ORG_AUDIENCE_QUERY, search: 'ada', sortBy: 'name' as const, page: 5 };
    const next = applyAudienceView('inactive_90d', current);

    expect(next.search).toBe('ada');
    expect(next.sortBy).toBe('name');
    // A filter change must reset paging, or the admin lands on an empty page.
    expect(next.page).toBe(1);
  });

  it('drops the previous view filters instead of stacking them', () => {
    const archived = applyAudienceView('archived', DEFAULT_ORG_AUDIENCE_QUERY);
    const next = applyAudienceView('never_logged_in', archived);

    expect(next.status).toBe('ACTIVE');
    expect(next.lastLoginBefore).toBe('never');
  });
});

describe('countActiveAudienceFilters', () => {
  it('counts nothing for the default view', () => {
    expect(countActiveAudienceFilters(DEFAULT_ORG_AUDIENCE_QUERY)).toBe(0);
  });

  it('ignores search, which has its own visible input', () => {
    expect(countActiveAudienceFilters({ ...DEFAULT_ORG_AUDIENCE_QUERY, search: 'ada' })).toBe(0);
  });

  it('counts each active filter', () => {
    expect(
      countActiveAudienceFilters({
        ...DEFAULT_ORG_AUDIENCE_QUERY,
        status: 'ARCHIVED',
        completion: 'completed',
        lastActiveBefore: '90d'
      })
    ).toBe(3);
  });

  it('clears filters back to the default while keeping search', () => {
    const cleared = clearAudienceFilters({
      ...DEFAULT_ORG_AUDIENCE_QUERY,
      status: 'ARCHIVED',
      completion: 'completed',
      search: 'ada'
    });

    expect(countActiveAudienceFilters(cleared)).toBe(0);
    expect(cleared.search).toBe('ada');
  });
});
