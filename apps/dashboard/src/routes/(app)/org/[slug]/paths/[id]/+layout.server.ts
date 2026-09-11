import { MOCK_PATHS } from '$features/learning-path/utils/mock-data';

export const load = async ({ params }) => {
  const pathId = params.id;
  const orgSlug = params.slug;

  const path = MOCK_PATHS.find((p) => p.id === pathId || p.slug === pathId) || {
    ...MOCK_PATHS[0],
    id: pathId
  };

  return {
    pathId,
    orgSlug,
    path
  };
};
