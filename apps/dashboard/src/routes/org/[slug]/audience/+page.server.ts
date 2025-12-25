import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { org } = await parent();

  if (!org?.id) {
    return {
      audience: []
    };
  }

  // Fetch organization audience
  const audienceResponse = await classroomio.organization[':orgId'].audience.$get(
    { param: { orgId: org.id } },
    getApiHeaders(cookies, org.id)
  );

  const audienceData = await audienceResponse.json();
  const audience = audienceData.success ? audienceData.data : [];

  return {
    audience
  };
};
