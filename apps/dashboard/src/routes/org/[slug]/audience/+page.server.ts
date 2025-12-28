import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      audience: []
    };
  }

  // Fetch organization audience
  const audienceResponse = await classroomio.organization.audience.$get({}, getApiHeaders(cookies, orgId));

  const audienceData = await audienceResponse.json();
  const audience = audienceData.success ? audienceData.data : [];

  return {
    audience
  };
};
