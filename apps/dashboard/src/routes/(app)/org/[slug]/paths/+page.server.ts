import { MOCK_PATHS } from '$features/learning-path/utils/mock-data';

export const load = async ({ parent, params }) => {
  const { orgId } = await parent();

  return {
    orgSlug: params.slug,
    orgId,
    // Phase 1 handoff: swap MOCK_PATHS for real API call when Phase 1 routes are mounted
    paths: MOCK_PATHS
  };
};
