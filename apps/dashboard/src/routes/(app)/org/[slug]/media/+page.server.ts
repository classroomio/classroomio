import type { GetAssetStorageSuccess, ListAssetsSuccess, OrganizationAssets } from '$features/media/utils/types';
import type { MediaListFilters } from '$features/media/utils/media-list-filters';
import {
  DEFAULT_MEDIA_LIST_NEXT,
  MEDIA_PAGE_SIZE,
  parseMediaListFilters,
  parseMediaListNext
} from '$features/media/utils/media-list-filters';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

type ApiHeaders = ReturnType<typeof getApiHeaders>;

function toMediaListQuery(filters: MediaListFilters, page: number) {
  return {
    page: String(page),
    limit: String(MEDIA_PAGE_SIZE),
    includeExternal: 'true',
    ...(filters.kind !== 'all' ? { kind: filters.kind } : {}),
    ...(filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {})
  };
}

async function fetchMediaAssetsPages(headers: ApiHeaders, filters: MediaListFilters, pagesToLoad: number) {
  const allAssets: OrganizationAssets = [];
  const seenAssetIds = new Set<string>();
  let pagination: ListAssetsSuccess['pagination'] = {
    page: DEFAULT_MEDIA_LIST_NEXT,
    limit: MEDIA_PAGE_SIZE,
    total: 0,
    totalPages: 0
  };

  for (let page = DEFAULT_MEDIA_LIST_NEXT; page <= pagesToLoad; page += 1) {
    const query = toMediaListQuery(filters, page);
    const assetsResult = await safeServerApi<ListAssetsSuccess>(() =>
      classroomio.organization.assets.$get({ query }, headers)
    );

    if (!assetsResult.ok) {
      break;
    }

    pagination = assetsResult.body.pagination;

    for (const asset of assetsResult.body.data ?? []) {
      if (seenAssetIds.has(asset.id)) {
        continue;
      }

      seenAssetIds.add(asset.id);
      allAssets.push(asset);
    }

    if (page >= (pagination.totalPages || 1)) {
      break;
    }
  }

  return { assets: allAssets, pagination };
}

export const load = async ({ parent, cookies, url }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      assets: [],
      pagination: null,
      storageSummary: null
    };
  }

  const filters = parseMediaListFilters(url.searchParams);
  const pagesToLoad = parseMediaListNext(url.searchParams);
  const headers = getApiHeaders(cookies, orgId);

  const [assetsResult, storageResult] = await Promise.all([
    fetchMediaAssetsPages(headers, filters, pagesToLoad),
    safeServerApi<GetAssetStorageSuccess>(() => classroomio.organization.assets.storage.$get({}, headers))
  ]);

  return {
    assets: assetsResult.assets,
    pagination: assetsResult.pagination,
    storageSummary: storageResult.ok ? storageResult.body.data : null
  };
};
