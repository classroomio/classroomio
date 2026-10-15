import { describe, expect, it } from 'vitest';
import {
  PATH_LIST_FILTER_PARAM_KEYS,
  PATH_LIST_PAGE_SIZE,
  buildPathListSearchParams,
  hasActivePathListFilters,
  mergePathListSearchParams,
  parsePathListFilters,
  toPathListApiQuery
} from './path-list-filters';
import { DEFAULT_PATH_SORT, DEFAULT_SORT_ORDER } from './constants';

describe('parsePathListFilters', () => {
  it('returns defaults for an empty query', () => {
    const filters = parsePathListFilters(new URLSearchParams());

    expect(filters).toEqual({
      search: '',
      status: 'all',
      enrollment: 'all',
      completion: 'all',
      sort: DEFAULT_PATH_SORT,
      order: DEFAULT_SORT_ORDER
    });
  });

  it('passes through every valid backend value', () => {
    const filters = parsePathListFilters(
      new URLSearchParams('search=react&status=published&enrollment=1-49&completion=low&sort=courses&order=asc')
    );

    expect(filters).toEqual({
      search: 'react',
      status: 'published',
      enrollment: '1-49',
      completion: 'low',
      sort: 'courses',
      order: 'asc'
    });
  });

  it('falls back to defaults for hand-edited invalid values', () => {
    const filters = parsePathListFilters(
      new URLSearchParams('status=bogus&enrollment=bogus&completion=bogus&sort=bogus&order=bogus')
    );

    expect(filters.status).toBe('all');
    expect(filters.enrollment).toBe('all');
    expect(filters.completion).toBe('all');
    expect(filters.sort).toBe(DEFAULT_PATH_SORT);
    expect(filters.order).toBe(DEFAULT_SORT_ORDER);
  });

  it('trims search text', () => {
    expect(parsePathListFilters(new URLSearchParams('search=%20%20react%20%20')).search).toBe('react');
  });
});

describe('buildPathListSearchParams', () => {
  it('leaves defaults out of the URL', () => {
    const params = buildPathListSearchParams({
      search: '',
      status: 'all',
      enrollment: 'all',
      completion: 'all',
      sort: DEFAULT_PATH_SORT,
      order: DEFAULT_SORT_ORDER
    });

    expect(params.toString()).toBe('');
  });

  it('keeps only non-default values', () => {
    const params = buildPathListSearchParams({
      search: 'react',
      status: 'published',
      enrollment: 'all',
      completion: 'low',
      sort: DEFAULT_PATH_SORT,
      order: 'asc'
    });

    expect(params.get('search')).toBe('react');
    expect(params.get('status')).toBe('published');
    expect(params.get('completion')).toBe('low');
    expect(params.get('order')).toBe('asc');
    expect(params.has('enrollment')).toBe(false);
    expect(params.has('sort')).toBe(false);
  });
});

describe('mergePathListSearchParams', () => {
  it('preserves unrelated params and drops cleared filters', () => {
    const current = new URLSearchParams('create=true&status=published&page=2');
    const merged = mergePathListSearchParams(current, {
      search: '',
      status: 'all',
      enrollment: 'all',
      completion: 'all',
      sort: DEFAULT_PATH_SORT,
      order: DEFAULT_SORT_ORDER
    });

    expect(merged.get('create')).toBe('true');
    expect(merged.has('status')).toBe(false);
    expect(merged.get('page')).toBe('2');
  });

  it('round-trips through parsePathListFilters', () => {
    const merged = mergePathListSearchParams(new URLSearchParams('create=true'), {
      search: 'react',
      status: 'unpublished',
      enrollment: '50+',
      completion: 'high',
      sort: 'courses',
      order: 'asc'
    });

    expect(parsePathListFilters(merged)).toEqual({
      search: 'react',
      status: 'unpublished',
      enrollment: '50+',
      completion: 'high',
      sort: 'courses',
      order: 'asc'
    });
  });

  it('owns exactly the documented filter keys', () => {
    expect([...PATH_LIST_FILTER_PARAM_KEYS]).toEqual(['search', 'status', 'enrollment', 'completion', 'sort', 'order']);
  });
});

describe('hasActivePathListFilters', () => {
  it('is false for defaults and true for any active filter', () => {
    expect(
      hasActivePathListFilters({
        search: '',
        status: 'all',
        enrollment: 'all',
        completion: 'all',
        sort: DEFAULT_PATH_SORT,
        order: DEFAULT_SORT_ORDER
      })
    ).toBe(false);

    expect(
      hasActivePathListFilters({
        search: 'react',
        status: 'all',
        enrollment: 'all',
        completion: 'all',
        sort: DEFAULT_PATH_SORT,
        order: DEFAULT_SORT_ORDER
      })
    ).toBe(true);
  });
});

describe('toPathListApiQuery', () => {
  it('builds a page-1 query with the listing page size', () => {
    const query = toPathListApiQuery(
      'org-1',
      {
        search: '',
        status: 'all',
        enrollment: 'all',
        completion: 'all',
        sort: DEFAULT_PATH_SORT,
        order: DEFAULT_SORT_ORDER
      },
      1
    );

    expect(query).toEqual({
      organizationId: 'org-1',
      page: '1',
      limit: String(PATH_LIST_PAGE_SIZE)
    });
  });

  it('forwards non-default filters and the requested page', () => {
    const query = toPathListApiQuery(
      'org-1',
      {
        search: 'react',
        status: 'published',
        enrollment: '1-49',
        completion: 'low',
        sort: 'courses',
        order: 'asc'
      },
      3
    );

    expect(query).toMatchObject({
      organizationId: 'org-1',
      page: '3',
      search: 'react',
      status: 'published',
      enrollment: '1-49',
      completion: 'low',
      sort: 'courses',
      order: 'asc'
    });
  });
});
