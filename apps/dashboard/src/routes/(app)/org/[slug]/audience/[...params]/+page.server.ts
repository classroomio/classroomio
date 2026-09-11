import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type { GetAudienceAnalyticsSuccess } from '$features/audience/utils/types';

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const paramParts = params.params?.split('/') ?? [];

  const userId = paramParts[0];

  if (!userId || !orgId) {
    return {
      userId,
      orgId,
      analytics: null,
      loadFailed: false
    };
  }

  const result = await safeServerApi<GetAudienceAnalyticsSuccess>(() =>
    classroomio.organization.audience[':userId'].analytics.$get({ param: { userId } }, getApiHeaders(cookies, orgId))
  );
  const analytics = result.ok ? result.body.data : null;

  return {
    userId,
    orgId,
    analytics,
    loadFailed: !result.ok
  };
};
