import { MOCK_PATHS } from '$features/learning-path/utils/mock-data';

export const load = async ({ params, parent }) => {
  const publicId = params.publicId;
  const parentData = await parent();
  const orgSlug = parentData.orgSiteName || parentData.org?.siteName || 'default';

  const path = MOCK_PATHS.find((p) => p.publicId === publicId) || null;

  return {
    publicId,
    pathId: path?.id,
    orgSlug,
    path
  };
};
