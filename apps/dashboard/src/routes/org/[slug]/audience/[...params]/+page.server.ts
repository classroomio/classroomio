import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { orgId } = await parent();
  const paramParts = params.params?.split('/') ?? [];

  const userId = paramParts[0];

  if (!userId || !orgId) {
    return {
      userId,
      orgId,
      analytics: null
    };
  }

  const analyticsResponse = await classroomio.organization.audience[':userId'].analytics.$get(
    { param: { userId } },
    getApiHeaders(cookies, orgId)
  );

  const analyticsData = await analyticsResponse.json();
  const analytics = analyticsData.success ? analyticsData.data : null;

  return {
    userId,
    orgId,
    analytics
  };
};
