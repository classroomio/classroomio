import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ params, parent, cookies }) => {
  const { org } = await parent();
  const paramParts = params.params?.split('/') ?? [];

  const userId = paramParts[0];
  const orgId = paramParts[1] || org?.id;

  if (!userId || !orgId) {
    return {
      userId,
      orgId,
      analytics: null
    };
  }

  // Fetch user analytics using the new API route
  const analyticsResponse = await classroomio.organization[':orgId'].audience[':userId'].analytics.$get(
    { param: { orgId, userId } },
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
