import {
  PATH_LIST_COMPLETION_FILTERS,
  PATH_LIST_ENROLLMENT_FILTERS,
  PATH_LIST_SORT_BY,
  PATH_LIST_SORT_ORDERS,
  PATH_LIST_STATUS_FILTERS
} from '@cio/utils/validation/learning-path';
import { DEFAULT_PATH_SORT, DEFAULT_SORT_ORDER } from './constants';
import type { CompletionFilter, EnrollmentFilter, PathListFilters, StatusFilter } from './types';

/** Page size for the URL-driven org paths listing. */
export const PATH_LIST_PAGE_SIZE = 20;

/** URL params owned by the paths listing; merging preserves everything else. */
export const PATH_LIST_FILTER_PARAM_KEYS = ['search', 'status', 'enrollment', 'completion', 'sort', 'order'] as const;

function parseStatusFilter(value: string | null): StatusFilter {
  if (value && (PATH_LIST_STATUS_FILTERS as readonly string[]).includes(value)) {
    return value as StatusFilter;
  }

  return 'all';
}

function parseEnrollmentFilter(value: string | null): EnrollmentFilter {
  if (value && (PATH_LIST_ENROLLMENT_FILTERS as readonly string[]).includes(value)) {
    return value as EnrollmentFilter;
  }

  return 'all';
}

function parseCompletionFilter(value: string | null): CompletionFilter {
  if (value && (PATH_LIST_COMPLETION_FILTERS as readonly string[]).includes(value)) {
    return value as CompletionFilter;
  }

  return 'all';
}

/**
 * Reads the paths-listing filters from the URL, validating each value against
 * the backend `PATH_LIST_*` constants. Unknown or missing values fall back to
 * defaults (`all`/empty sort defaults), so hand-edited URLs never break the list.
 */
export function parsePathListFilters(params: URLSearchParams): PathListFilters {
  const search = params.get('search')?.trim() ?? '';
  const status = parseStatusFilter(params.get('status'));
  const enrollment = parseEnrollmentFilter(params.get('enrollment'));
  const completion = parseCompletionFilter(params.get('completion'));

  const rawSort = params.get('sort');
  const sort =
    rawSort && (PATH_LIST_SORT_BY as readonly string[]).includes(rawSort)
      ? (rawSort as PathListFilters['sort'])
      : DEFAULT_PATH_SORT;

  const rawOrder = params.get('order');
  const order =
    rawOrder && (PATH_LIST_SORT_ORDERS as readonly string[]).includes(rawOrder)
      ? (rawOrder as PathListFilters['order'])
      : DEFAULT_SORT_ORDER;

  return { search, status, enrollment, completion, sort, order };
}

/**
 * Serializes filters to URL params, leaving defaults out so clean URLs stay short.
 */
export function buildPathListSearchParams(filters: PathListFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (filters.enrollment !== 'all') {
    params.set('enrollment', filters.enrollment);
  }

  if (filters.completion !== 'all') {
    params.set('completion', filters.completion);
  }

  if (filters.sort !== DEFAULT_PATH_SORT) {
    params.set('sort', filters.sort);
  }

  if (filters.order !== DEFAULT_SORT_ORDER) {
    params.set('order', filters.order);
  }

  return params;
}

/**
 * Merges new filters into the current URL params, preserving unrelated keys
 * (e.g. `create`, pagination helpers) and dropping cleared filter keys.
 */
export function mergePathListSearchParams(current: URLSearchParams, filters: PathListFilters): URLSearchParams {
  const merged = new URLSearchParams(current);

  for (const key of PATH_LIST_FILTER_PARAM_KEYS) {
    merged.delete(key);
  }

  const filterParams = buildPathListSearchParams(filters);
  for (const [key, value] of filterParams) {
    merged.set(key, value);
  }

  return merged;
}

/**
 * True when any listing filter differs from its default (search text counts).
 */
export function hasActivePathListFilters(filters: PathListFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.enrollment !== 'all' ||
    filters.completion !== 'all' ||
    filters.sort !== DEFAULT_PATH_SORT ||
    filters.order !== DEFAULT_SORT_ORDER
  );
}

/**
 * Builds the API query for the paths listing, omitting defaults so the server
 * applies its own (`date_created` desc) when nothing is selected.
 */
export function toPathListApiQuery(orgId: string, filters: PathListFilters, page: number) {
  return {
    organizationId: orgId,
    page: String(page),
    limit: String(PATH_LIST_PAGE_SIZE),
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.enrollment !== 'all' ? { enrollment: filters.enrollment } : {}),
    ...(filters.completion !== 'all' ? { completion: filters.completion } : {}),
    ...(filters.sort !== DEFAULT_PATH_SORT ? { sort: filters.sort } : {}),
    ...(filters.order !== DEFAULT_SORT_ORDER ? { order: filters.order } : {})
  };
}
