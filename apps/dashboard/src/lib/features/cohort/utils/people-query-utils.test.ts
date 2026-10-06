import { describe, expect, it } from 'vitest';

import {
  COHORT_PEOPLE_VIEWS,
  DEFAULT_COHORT_PEOPLE_QUERY,
  applyCohortPeopleView,
  clearCohortPeopleFilters,
  countActiveCohortPeopleFilters,
  getCohortPeopleQueryFromSearchParams,
  getCohortPeopleSearchParams,
  matchCohortPeopleView
} from './people-query-utils';

describe('getCohortPeopleQueryFromSearchParams', () => {
  it('returns the defaults for an empty URL', () => {
    expect(getCohortPeopleQueryFromSearchParams(new URLSearchParams())).toEqual(DEFAULT_COHORT_PEOPLE_QUERY);
  });

  it('reads every filter off the URL', () => {
    const query = getCohortPeopleQueryFromSearchParams(
      new URLSearchParams(
        'page=3&limit=5&search=ada&roleId=2&sortBy=joined&sortOrder=desc&membership=invited&lastLoginBefore=30d'
      )
    );

    expect(query).toEqual({
      page: 3,
      limit: 5,
      search: 'ada',
      roleId: 2,
      sortBy: 'joined',
      sortOrder: 'desc',
      membership: 'invited',
      lastLoginBefore: '30d'
    });
  });

  it('falls back to defaults for out-of-range paging', () => {
    const query = getCohortPeopleQueryFromSearchParams(new URLSearchParams('page=0&limit=-4'));

    expect(query.page).toBe(DEFAULT_COHORT_PEOPLE_QUERY.page);
    expect(query.limit).toBe(DEFAULT_COHORT_PEOPLE_QUERY.limit);
  });

  it('drops an unsupported sort key instead of forwarding it', () => {
    const query = getCohortPeopleQueryFromSearchParams(new URLSearchParams('sortBy=progress'));

    expect(query.sortBy).toBe(DEFAULT_COHORT_PEOPLE_QUERY.sortBy);
  });

  it('drops an unsupported activity window', () => {
    const query = getCohortPeopleQueryFromSearchParams(new URLSearchParams('lastLoginBefore=99y'));

    expect(query.lastLoginBefore).toBeUndefined();
  });

  it('treats a blank search as absent', () => {
    const query = getCohortPeopleQueryFromSearchParams(new URLSearchParams('search=%20%20'));

    expect(query.search).toBeUndefined();
  });
});

describe('getCohortPeopleSearchParams', () => {
  it('omits defaults so a clean URL stays clean', () => {
    expect(getCohortPeopleSearchParams(DEFAULT_COHORT_PEOPLE_QUERY).toString()).toBe('');
  });

  it('serializes only non-default values', () => {
    const search = getCohortPeopleSearchParams({
      ...DEFAULT_COHORT_PEOPLE_QUERY,
      page: 4,
      sortBy: 'lastLogin',
      sortOrder: 'desc'
    }).toString();

    expect(search).toContain('page=4');
    expect(search).toContain('sortBy=lastLogin');
    expect(search).toContain('sortOrder=desc');
    expect(search).not.toContain('limit=');
  });

  it('clears a filter that was removed from the query', () => {
    const current = new URLSearchParams('roleId=2&sortBy=role');
    const search = getCohortPeopleSearchParams({ ...DEFAULT_COHORT_PEOPLE_QUERY, sortBy: 'name' }, current);

    expect(search.has('roleId')).toBe(false);
    expect(search.has('sortBy')).toBe(false);
  });

  it('preserves params owned by another feature', () => {
    const current = new URLSearchParams('add=true&tab=roster');
    const search = getCohortPeopleSearchParams({ ...DEFAULT_COHORT_PEOPLE_QUERY, search: 'ada' }, current);

    expect(search.get('add')).toBe('true');
    expect(search.get('tab')).toBe('roster');
    expect(search.get('search')).toBe('ada');
  });

  it('round-trips a fully populated query', () => {
    const original = {
      page: 2,
      limit: 10,
      search: 'grace',
      roleId: 3,
      sortBy: 'role' as const,
      sortOrder: 'desc' as const,
      membership: 'joined' as const,
      lastLoginBefore: '7d' as const
    };

    expect(getCohortPeopleQueryFromSearchParams(getCohortPeopleSearchParams(original))).toEqual(original);
  });
});

describe('applyCohortPeopleView', () => {
  it('applies each view filter and resets to page one', () => {
    const current = { ...DEFAULT_COHORT_PEOPLE_QUERY, page: 6, search: 'ada' };

    expect(applyCohortPeopleView('tutors', current)).toMatchObject({ roleId: 2, page: 1, search: 'ada' });
    expect(applyCohortPeopleView('students', current)).toMatchObject({ roleId: 3, page: 1 });
    expect(applyCohortPeopleView('pending_invites', current)).toMatchObject({ membership: 'invited', page: 1 });
    expect(applyCohortPeopleView('never_logged_in', current)).toMatchObject({ lastLoginBefore: 'never', page: 1 });
  });

  it('replaces the previous view filter rather than stacking it', () => {
    const applied = applyCohortPeopleView('students', applyCohortPeopleView('tutors', DEFAULT_COHORT_PEOPLE_QUERY));

    expect(applied.roleId).toBe(3);
  });

  it('keeps search, sort and limit across a view change', () => {
    const applied = applyCohortPeopleView('tutors', {
      ...DEFAULT_COHORT_PEOPLE_QUERY,
      search: 'ada',
      sortBy: 'joined',
      sortOrder: 'desc',
      limit: 50
    });

    expect(applied).toMatchObject({ search: 'ada', sortBy: 'joined', sortOrder: 'desc', limit: 50 });
  });

  it('clears view filters for the all view', () => {
    const applied = applyCohortPeopleView('all', {
      ...DEFAULT_COHORT_PEOPLE_QUERY,
      roleId: 2,
      membership: 'invited',
      lastLoginBefore: 'never'
    });

    expect(countActiveCohortPeopleFilters(applied)).toBe(0);
  });
});

describe('matchCohortPeopleView', () => {
  it('labels the all view when no filter is set', () => {
    expect(matchCohortPeopleView(DEFAULT_COHORT_PEOPLE_QUERY)).toBe('all');
  });

  it('labels a hand-edited URL that matches a view', () => {
    const query = getCohortPeopleQueryFromSearchParams(new URLSearchParams('roleId=2&sortBy=progress'));

    expect(matchCohortPeopleView(query)).toBe('tutors');
  });

  it('returns null when filters do not match any single view', () => {
    const query = { ...DEFAULT_COHORT_PEOPLE_QUERY, roleId: 2, membership: 'invited' as const };

    expect(matchCohortPeopleView(query)).toBeNull();
  });

  it('ignores search when matching', () => {
    const query = { ...DEFAULT_COHORT_PEOPLE_QUERY, search: 'ada' };

    expect(matchCohortPeopleView(query)).toBe('all');
  });

  it('exposes every view it can match', () => {
    expect(COHORT_PEOPLE_VIEWS).toEqual(['all', 'tutors', 'students', 'pending_invites', 'never_logged_in']);
  });
});

describe('clearCohortPeopleFilters', () => {
  it('removes every filter but keeps the sort', () => {
    const cleared = clearCohortPeopleFilters({
      ...DEFAULT_COHORT_PEOPLE_QUERY,
      page: 3,
      search: 'ada',
      roleId: 2,
      membership: 'invited',
      lastLoginBefore: '30d',
      sortBy: 'lastLogin'
    });

    expect(countActiveCohortPeopleFilters(cleared)).toBe(0);
    expect(cleared.page).toBe(1);
    expect(cleared.search).toBe('ada');
    expect(cleared.sortBy).toBe('lastLogin');
  });
});

describe('countActiveCohortPeopleFilters', () => {
  it('counts each active filter', () => {
    expect(countActiveCohortPeopleFilters(DEFAULT_COHORT_PEOPLE_QUERY)).toBe(0);
    expect(countActiveCohortPeopleFilters({ ...DEFAULT_COHORT_PEOPLE_QUERY, roleId: 2 })).toBe(1);
    expect(
      countActiveCohortPeopleFilters({
        ...DEFAULT_COHORT_PEOPLE_QUERY,
        roleId: 2,
        membership: 'invited',
        lastLoginBefore: 'never'
      })
    ).toBe(3);
  });

  it('does not count search or paging', () => {
    expect(countActiveCohortPeopleFilters({ ...DEFAULT_COHORT_PEOPLE_QUERY, search: 'ada', page: 4 })).toBe(0);
  });
});
