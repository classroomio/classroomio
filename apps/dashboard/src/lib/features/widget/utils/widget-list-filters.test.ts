import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WIDGET_LIST_FILTERS,
  clearWidgetListFilters,
  countActiveWidgetFilters,
  getWidgetListFiltersFromSearchParams,
  getWidgetListSearchParams,
  mergeWidgetListSearchParams,
  toWidgetListRequestQuery,
  WIDGET_LIST_SEARCH_MAX_LENGTH,
  withFilterChange,
  withoutStatusFilter,
  type WidgetListFilters
} from './widget-list-filters';

const FILTERED: WidgetListFilters = {
  page: 1,
  search: '',
  statuses: ['PUBLISHED'],
  layoutTypes: ['carousel', 'card_grid'],
  selectionModes: ['manual']
};

describe('getWidgetListFiltersFromSearchParams', () => {
  it('returns the defaults for an empty URL', () => {
    expect(getWidgetListFiltersFromSearchParams(new URLSearchParams())).toEqual(DEFAULT_WIDGET_LIST_FILTERS);
  });

  it('reads every filter off the URL', () => {
    const filters = getWidgetListFiltersFromSearchParams(
      new URLSearchParams('page=3&search=promo&status=DRAFT,PUBLISHED&layoutType=carousel&selectionMode=published')
    );

    expect(filters).toEqual({
      page: 3,
      search: 'promo',
      statuses: ['DRAFT', 'PUBLISHED'],
      layoutTypes: ['carousel'],
      selectionModes: ['published']
    });
  });

  it('drops unknown enum values instead of failing', () => {
    const filters = getWidgetListFiltersFromSearchParams(
      new URLSearchParams('status=DRAFT&layoutType=carousel,masonry&selectionMode=curated')
    );

    expect(filters.statuses).toEqual(['DRAFT']);
    expect(filters.layoutTypes).toEqual(['carousel']);
    expect(filters.selectionModes).toEqual([]);
  });

  it('never accepts ARCHIVED as a status filter', () => {
    const filters = getWidgetListFiltersFromSearchParams(new URLSearchParams('status=ARCHIVED'));

    expect(filters.statuses).toEqual([]);
  });

  it('trims search and falls back to page 1 on junk', () => {
    const filters = getWidgetListFiltersFromSearchParams(new URLSearchParams('page=abc&search=%20%20promo%20%20'));

    expect(filters.page).toBe(1);
    expect(filters.search).toBe('promo');
  });

  it('ignores empty and non-positive pages', () => {
    expect(getWidgetListFiltersFromSearchParams(new URLSearchParams('page=0')).page).toBe(1);
    expect(getWidgetListFiltersFromSearchParams(new URLSearchParams('page=-4')).page).toBe(1);
  });
});

describe('getWidgetListSearchParams', () => {
  it('keeps an untouched page clean', () => {
    expect(getWidgetListSearchParams(DEFAULT_WIDGET_LIST_FILTERS).toString()).toBe('');
  });

  it('emits only the params that are set', () => {
    const params = getWidgetListSearchParams(FILTERED);

    expect(params.get('status')).toBe('PUBLISHED');
    expect(params.get('layoutType')).toBe('carousel,card_grid');
    expect(params.get('selectionMode')).toBe('manual');
    expect(params.get('page')).toBeNull();
    expect(params.get('search')).toBeNull();
  });

  it('round-trips a parsed URL', () => {
    const original = new URLSearchParams(
      'page=4&search=promo&status=DRAFT&layoutType=tag_filter&selectionMode=published'
    );

    expect(getWidgetListSearchParams(getWidgetListFiltersFromSearchParams(original)).toString()).toBe(
      original.toString()
    );
  });
});

describe('mergeWidgetListSearchParams', () => {
  it('replaces stale values this page used to own', () => {
    const current = new URLSearchParams('status=DRAFT&layoutType=carousel&search=old');

    expect(mergeWidgetListSearchParams(current, DEFAULT_WIDGET_LIST_FILTERS).toString()).toBe('');
  });

  it('leaves params owned by something else alone', () => {
    const current = new URLSearchParams('status=DRAFT&from=notification');

    const merged = mergeWidgetListSearchParams(current, DEFAULT_WIDGET_LIST_FILTERS);

    expect(merged.get('from')).toBe('notification');
    expect(merged.get('status')).toBeNull();
  });
});

describe('countActiveWidgetFilters', () => {
  it('counts nothing for the default filters', () => {
    expect(countActiveWidgetFilters(DEFAULT_WIDGET_LIST_FILTERS)).toBe(0);
  });

  it('counts every selected value across the three dimensions', () => {
    expect(countActiveWidgetFilters(FILTERED)).toBe(4);
    expect(countActiveWidgetFilters({ ...FILTERED, search: 'promo' })).toBe(5);
  });

  it('does not count the page as a filter', () => {
    expect(countActiveWidgetFilters({ ...DEFAULT_WIDGET_LIST_FILTERS, page: 4 })).toBe(0);
  });
});

describe('clearWidgetListFilters', () => {
  it('drops every filter but keeps the page', () => {
    const cleared = clearWidgetListFilters({ ...FILTERED, page: 5 });

    expect(cleared).toEqual({ ...DEFAULT_WIDGET_LIST_FILTERS, page: 5 });
  });
});

describe('withFilterChange', () => {
  it('resets to page 1 so a shrunken result set cannot strand the user', () => {
    const changed = withFilterChange({ ...FILTERED, page: 6 }, { search: 'promo' });

    expect(changed.page).toBe(1);
    expect(changed.search).toBe('promo');
  });
});

describe('withoutStatusFilter', () => {
  it('clears statuses but keeps the other filters', () => {
    expect(withoutStatusFilter(FILTERED)).toEqual({ ...FILTERED, statuses: [] });
  });
});

describe('toWidgetListRequestQuery', () => {
  it('sends nothing for unset filters so the API applies its own defaults', () => {
    expect(toWidgetListRequestQuery(DEFAULT_WIDGET_LIST_FILTERS)).toEqual({
      page: '1',
      search: undefined,
      status: undefined,
      layoutType: undefined,
      selectionMode: undefined
    });
  });

  it('joins multi-selects into the comma-separated form the API parses', () => {
    expect(toWidgetListRequestQuery(FILTERED)).toMatchObject({
      page: '1',
      status: 'PUBLISHED',
      layoutType: 'carousel,card_grid',
      selectionMode: 'manual'
    });
  });

  it('produces a query the API accepts', () => {
    const query = toWidgetListRequestQuery(FILTERED);
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, value);
    }

    expect(getWidgetListFiltersFromSearchParams(params)).toEqual(FILTERED);
  });

  it('clamps a search past the API limit so the request is not rejected', () => {
    const overlongSearch = 'a'.repeat(WIDGET_LIST_SEARCH_MAX_LENGTH + 40);
    const query = toWidgetListRequestQuery({ ...FILTERED, search: overlongSearch });

    expect(query.search).toHaveLength(WIDGET_LIST_SEARCH_MAX_LENGTH);
  });

  it('never exceeds the length the API schema accepts', () => {
    for (const length of [0, 1, WIDGET_LIST_SEARCH_MAX_LENGTH - 1, WIDGET_LIST_SEARCH_MAX_LENGTH, 5000]) {
      const query = toWidgetListRequestQuery({ ...FILTERED, search: 'x'.repeat(length) });

      expect(query.search === undefined || query.search.length <= WIDGET_LIST_SEARCH_MAX_LENGTH).toBe(true);
    }
  });
});
