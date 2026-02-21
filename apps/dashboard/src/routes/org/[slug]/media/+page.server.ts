import { classroomio, getApiHeaders } from '$lib/utils/services/api';

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

  const [assetsResponse, storageResponse] = await Promise.all([
    classroomio.organization.assets.$get({ query }, getApiHeaders(cookies, orgId)),
    classroomio.organization.assets.storage.$get({}, getApiHeaders(cookies, orgId))
  ]);

  const assetsData = await assetsResponse.json();
  const storageData = await storageResponse.json();

  return {
    assets: assetsData.success ? assetsData.data : [],
    pagination: assetsData.success ? assetsData.pagination : null,
    storageSummary: storageData.success ? storageData.data : null
  };
};
