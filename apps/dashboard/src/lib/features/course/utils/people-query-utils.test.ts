import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PEOPLE_QUERY,
  COURSE_PEOPLE_VIEWS,
  applyPeopleView,
  clearPeopleFilters,
  countActivePeopleFilters,
  getPeopleQueryFromSearchParams,
  getPeopleSearchParams,
  matchPeopleView
} from './people-query-utils';

describe('getPeopleQueryFromSearchParams', () => {
  it('returns the defaults for an empty URL', () => {
    expect(getPeopleQueryFromSearchParams(new URLSearchParams())).toEqual(DEFAULT_PEOPLE_QUERY);
  });

  it('reads every filter off the URL', () => {
    const query = getPeopleQueryFromSearchParams(
      new URLSearchParams(
        'progress=in_progress&membership=joined&enrolledWithin=30d&lastLoginBefore=never&certificateEarned=false&roleId=2&sortBy=progress&sortOrder=desc&page=3&search=ada'
      )
    );

    expect(query).toEqual({
      page: 3,
      limit: 20,
      search: 'ada',
      roleId: 2,
      sortBy: 'progress',
      sortOrder: 'desc',
      progress: 'in_progress',
      membership: 'joined',
      enrolledWithin: '30d',
      lastLoginBefore: 'never',
      certificateEarned: false
    });
  });

  it('falls back to the default when an enum value is unknown', () => {
    const query = getPeopleQueryFromSearchParams(
      new URLSearchParams('sortBy=drop_table&sortOrder=sideways&progress=maybe&membership=perhaps')
    );

    expect(query.sortBy).toBe('role');
    expect(query.sortOrder).toBe('asc');
    expect(query.progress).toBeUndefined();
    expect(query.membership).toBeUndefined();
  });

  it('rejects a non-positive or fractional page', () => {
    const query = getPeopleQueryFromSearchParams(new URLSearchParams('page=0&limit=-4'));

    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
  });

  it('reads certificateEarned as an explicit tri-state', () => {
    expect(getPeopleQueryFromSearchParams(new URLSearchParams('certificateEarned=true')).certificateEarned).toBe(true);
    expect(getPeopleQueryFromSearchParams(new URLSearchParams('certificateEarned=false')).certificateEarned).toBe(
      false
    );
    expect(getPeopleQueryFromSearchParams(new URLSearchParams()).certificateEarned).toBeUndefined();
  });
});

describe('getPeopleSearchParams', () => {
  it('omits defaults so a plain page keeps a clean URL', () => {
    expect(getPeopleSearchParams(DEFAULT_PEOPLE_QUERY).toString()).toBe('');
  });

  it('round-trips through the reader', () => {
    const query = { ...DEFAULT_PEOPLE_QUERY, page: 4, search: 'ada', progress: 'completed' as const };
    const roundTripped = getPeopleQueryFromSearchParams(getPeopleSearchParams(query));

    expect(roundTripped).toEqual(query);
  });

  it('preserves params this page does not own', () => {
    const searchParams = getPeopleSearchParams(
      { ...DEFAULT_PEOPLE_QUERY, search: 'ada' },
      new URLSearchParams('add=true&back=/courses')
    );

    expect(searchParams.get('add')).toBe('true');
    expect(searchParams.get('back')).toBe('/courses');
    expect(searchParams.get('search')).toBe('ada');
  });

  it('clears a param it previously set when the value returns to its default', () => {
    const withFilter = getPeopleSearchParams({ ...DEFAULT_PEOPLE_QUERY, progress: 'completed' });
    const cleared = getPeopleSearchParams(DEFAULT_PEOPLE_QUERY, withFilter);

    expect(cleared.get('progress')).toBeNull();
  });
});

describe('applyPeopleView', () => {
  it('replaces the previous view rather than stacking filters', () => {
    const first = applyPeopleView('not_started');
    const second = applyPeopleView('never_logged_in', first);

    expect(second.progress).toBeUndefined();
    expect(second.lastLoginBefore).toBe('never');
  });

  it('keeps search, sort and page size across a view change', () => {
    const next = applyPeopleView('completed', {
      ...DEFAULT_PEOPLE_QUERY,
      search: 'ada',
      sortBy: 'name',
      sortOrder: 'desc',
      limit: 50
    });

    expect(next).toMatchObject({ search: 'ada', sortBy: 'name', sortOrder: 'desc', limit: 50, progress: 'completed' });
  });

  it('resets to the first page', () => {
    expect(applyPeopleView('completed', { ...DEFAULT_PEOPLE_QUERY, page: 7 }).page).toBe(1);
  });
});

describe('matchPeopleView', () => {
  it('matches the default query to the all view', () => {
    expect(matchPeopleView(DEFAULT_PEOPLE_QUERY)).toBe('all');
  });

  it('matches a saved view from its filters alone', () => {
    const query = { ...DEFAULT_PEOPLE_QUERY, page: 5, lastLoginBefore: 'never' as const };

    expect(matchPeopleView(query)).toBe('never_logged_in');
  });

  it('survives a hand-edited URL', () => {
    const query = getPeopleQueryFromSearchParams(new URLSearchParams('progress=completed&page=2&sortBy=name'));

    expect(matchPeopleView(query)).toBe('completed');
  });

  it('returns null for a combination no view describes', () => {
    expect(matchPeopleView({ ...DEFAULT_PEOPLE_QUERY, progress: 'completed', membership: 'invited' })).toBeNull();
  });

  it('never changes the view when only sort or page changes', () => {
    for (const view of COURSE_PEOPLE_VIEWS) {
      const applied = applyPeopleView(view);
      const resorted = matchPeopleView({ ...applied, page: 3, sortBy: 'name', sortOrder: 'desc' });

      expect(resorted).toBe(view);
    }
  });
});

describe('clearPeopleFilters', () => {
  it('drops every filter but keeps search and sort', () => {
    const cleared = clearPeopleFilters({
      ...DEFAULT_PEOPLE_QUERY,
      search: 'ada',
      sortBy: 'name',
      roleId: 2,
      progress: 'completed',
      lastLoginBefore: 'never'
    });

    expect(countActivePeopleFilters(cleared)).toBe(0);
    expect(cleared).toMatchObject({ search: 'ada', sortBy: 'name' });
  });
});

describe('countActivePeopleFilters', () => {
  it('is zero for the default query', () => {
    expect(countActivePeopleFilters(DEFAULT_PEOPLE_QUERY)).toBe(0);
  });

  it('ignores search, page and sort', () => {
    const query = { ...DEFAULT_PEOPLE_QUERY, page: 4, search: 'ada', sortBy: 'name' as const };

    expect(countActivePeopleFilters(query)).toBe(0);
  });
});
