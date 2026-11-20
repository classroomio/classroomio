import { ASSET_KIND_OPTIONS, ASSET_STATUS_OPTIONS } from './constants';
import type { AssetKindFilter, AssetStatusFilter } from './types';

export interface MediaListFilters {
  search: string;
  kind: AssetKindFilter;
  status: AssetStatusFilter;
}

export const MEDIA_PAGE_SIZE = 20;
export const DEFAULT_MEDIA_LIST_NEXT = 1;
export const MAX_MEDIA_LIST_NEXT = 50;

const MEDIA_LIST_FILTER_PARAM_KEYS = ['search', 'kind', 'status', 'next'] as const;

function parseKindFilter(value: string | null): AssetKindFilter {
  return ASSET_KIND_OPTIONS.find((option) => option === value) ?? 'all';
}

function parseStatusFilter(value: string | null): AssetStatusFilter {
  return ASSET_STATUS_OPTIONS.find((option) => option === value) ?? 'all';
}

export function parseMediaListFilters(params: URLSearchParams): MediaListFilters {
  return {
    search: params.get('search')?.trim() ?? '',
    kind: parseKindFilter(params.get('kind')),
    status: parseStatusFilter(params.get('status'))
  };
}

export function parseMediaListNext(params: URLSearchParams): number {
  const raw = Number(params.get('next'));

  if (!Number.isInteger(raw) || raw < DEFAULT_MEDIA_LIST_NEXT) {
    return DEFAULT_MEDIA_LIST_NEXT;
  }

  return Math.min(raw, MAX_MEDIA_LIST_NEXT);
}

export function buildMediaListSearchParams(filters: MediaListFilters, next = DEFAULT_MEDIA_LIST_NEXT): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.kind !== 'all') {
    params.set('kind', filters.kind);
  }

  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (next > DEFAULT_MEDIA_LIST_NEXT) {
    params.set('next', String(next));
  }

  return params;
}

export function mergeMediaListSearchParams(
  current: URLSearchParams,
  filters: MediaListFilters,
  next = DEFAULT_MEDIA_LIST_NEXT
): URLSearchParams {
  const nextParams = new URLSearchParams(current);

  for (const key of MEDIA_LIST_FILTER_PARAM_KEYS) {
    nextParams.delete(key);
  }

  const built = buildMediaListSearchParams(filters, next);
  built.forEach((value, key) => {
    nextParams.set(key, value);
  });

  return nextParams;
}
