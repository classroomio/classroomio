import type { TWidgetLayoutType, TWidgetListStatus, TWidgetSelectionMode } from '@cio/utils/validation/widget';
import {
  WIDGET_LAYOUT_TYPE_VALUES,
  WIDGET_SELECTION_MODE_VALUES,
  WIDGET_LIST_STATUS_VALUES
} from '@cio/utils/validation/widget';

export interface WidgetListFilters {
  page: number;
  search: string;
  statuses: TWidgetListStatus[];
  layoutTypes: TWidgetLayoutType[];
  selectionModes: TWidgetSelectionMode[];
}

/** Mirrors the `max` on `ZListWidgetsQuery.search`, so the request can never be rejected for length. */
export const WIDGET_LIST_SEARCH_MAX_LENGTH = 120;

export const DEFAULT_WIDGET_LIST_FILTERS: WidgetListFilters = {
  page: 1,
  search: '',
  statuses: [],
  layoutTypes: [],
  selectionModes: []
};

/** Every key this page owns, so merging can clear stale values it no longer emits. */
export const WIDGET_LIST_FILTER_PARAM_KEYS = ['page', 'search', 'status', 'layoutType', 'selectionMode'] as const;

/**
 * Reads a comma-separated filter, keeping only values the API would accept.
 * An unknown value is dropped rather than fatal, so a stale bookmark still loads
 * the widgets it can and simply ignores the filter it no longer supports.
 */
function readCsvEnum<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];

  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is T => part.length > 0 && (allowed as readonly string[]).includes(part));
}

export function getWidgetListFiltersFromSearchParams(params: URLSearchParams): WidgetListFilters {
  const page = Number(params.get('page'));

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_WIDGET_LIST_FILTERS.page,
    search: params.get('search')?.trim() ?? DEFAULT_WIDGET_LIST_FILTERS.search,
    statuses: readCsvEnum(params.get('status'), WIDGET_LIST_STATUS_VALUES),
    layoutTypes: readCsvEnum(params.get('layoutType'), WIDGET_LAYOUT_TYPE_VALUES),
    selectionModes: readCsvEnum(params.get('selectionMode'), WIDGET_SELECTION_MODE_VALUES)
  };
}

/** Omits everything at its default, so an untouched page keeps a clean URL. */
export function getWidgetListSearchParams(filters: WidgetListFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page !== DEFAULT_WIDGET_LIST_FILTERS.page) {
    params.set('page', String(filters.page));
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.statuses.length > 0) {
    params.set('status', filters.statuses.join(','));
  }
  if (filters.layoutTypes.length > 0) {
    params.set('layoutType', filters.layoutTypes.join(','));
  }
  if (filters.selectionModes.length > 0) {
    params.set('selectionMode', filters.selectionModes.join(','));
  }

  return params;
}

/**
 * Replaces this page's params while leaving anything else in the URL alone, so
 * unrelated query state on the route is not silently dropped.
 */
export function mergeWidgetListSearchParams(current: URLSearchParams, filters: WidgetListFilters): URLSearchParams {
  const params = new URLSearchParams(current);

  for (const key of WIDGET_LIST_FILTER_PARAM_KEYS) {
    params.delete(key);
  }
  getWidgetListSearchParams(filters).forEach((value, key) => params.set(key, value));

  return params;
}

/**
 * Drives the popover's active dot. Counts selected values, not dimensions: these
 * filters are multi-select, so "Carousel + Card grid" is two selections.
 *
 * Page is deliberately excluded: paging is not a filter, and leaving it out stops
 * the dot lighting up on page 2.
 */
export function countActiveWidgetFilters(filters: WidgetListFilters): number {
  return (
    filters.statuses.length + filters.layoutTypes.length + filters.selectionModes.length + (filters.search ? 1 : 0)
  );
}

/** Keeps the current page number, which survives a filter change that did not ask to reset it. */
export function clearWidgetListFilters(filters: WidgetListFilters): WidgetListFilters {
  return { ...DEFAULT_WIDGET_LIST_FILTERS, page: filters.page };
}

/**
 * Query object for the RPC client. Arrays become comma-separated strings, which is
 * the shape the API's `csvEnum` schema parses.
 *
 * The search is clamped to the API's `ZListWidgetsQuery` limit: the URL can hold a
 * longer value than the schema accepts, and an over-long search is rejected with a
 * 400 that the loader renders as two empty lists rather than an error.
 */
export function toWidgetListRequestQuery(filters: WidgetListFilters) {
  const search = filters.search.slice(0, WIDGET_LIST_SEARCH_MAX_LENGTH);

  return {
    page: String(filters.page),
    search: search || undefined,
    status: filters.statuses.length > 0 ? filters.statuses.join(',') : undefined,
    layoutType: filters.layoutTypes.length > 0 ? filters.layoutTypes.join(',') : undefined,
    selectionMode: filters.selectionModes.length > 0 ? filters.selectionModes.join(',') : undefined
  };
}

/** A filter change shrinks the result set, so staying on page 7 would show an empty grid. */
export function withFilterChange(filters: WidgetListFilters, patch: Partial<WidgetListFilters>): WidgetListFilters {
  return { ...filters, ...patch, page: DEFAULT_WIDGET_LIST_FILTERS.page };
}

/** Archived rows are all ARCHIVED, so the status filter cannot apply there. */
export function withoutStatusFilter(filters: WidgetListFilters): WidgetListFilters {
  return { ...filters, statuses: [] };
}
