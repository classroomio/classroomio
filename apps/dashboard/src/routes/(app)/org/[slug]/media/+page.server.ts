import type { GetAssetStorageSuccess, ListAssetsSuccess } from '$features/media/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
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

  const page = parsePositiveInt(url.searchParams.get('page'), 1);
  const limit = Math.min(parsePositiveInt(url.searchParams.get('limit'), 20), 100);
  const kind = url.searchParams.get('kind') ?? undefined;
  const status = url.searchParams.get('status') ?? undefined;
  const search = url.searchParams.get('search') ?? undefined;
  const includeExternal = url.searchParams.get('includeExternal');

  const query = {
    page,
    limit,
    kind,
    status,
    search,
    includeExternal: includeExternal ? includeExternal === 'true' : true
  };

  const [assetsResult, storageResult] = await Promise.all([
    safeServerApi<ListAssetsSuccess>(() =>
      classroomio.organization.assets.$get({ query }, getApiHeaders(cookies, orgId))
    ),
    safeServerApi<GetAssetStorageSuccess>(() =>
      classroomio.organization.assets.storage.$get({}, getApiHeaders(cookies, orgId))
    )
  ]);

  return {
    assets: assetsResult.ok ? assetsResult.body.data : [],
    pagination: assetsResult.ok ? assetsResult.body.pagination : null,
    storageSummary: storageResult.ok ? storageResult.body.data : null
  };
};
