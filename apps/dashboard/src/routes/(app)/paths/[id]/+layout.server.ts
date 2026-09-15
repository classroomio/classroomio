import { MOCK_PATHS } from '$features/learning-path/utils/mock-data';

export const load = async ({ params, parent }) => {
  const pathId = params.id;
  const parentData = await parent();
  const orgSlug = parentData.orgSiteName || parentData.org?.siteName || 'default';

  const path = MOCK_PATHS.find((p) => p.id === pathId || p.slug === pathId) || null;

  return {
    pathId,
    orgSlug,
    path
  };
};
