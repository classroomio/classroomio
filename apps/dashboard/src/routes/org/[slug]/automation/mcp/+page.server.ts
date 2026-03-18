import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return { keys: [], usage: null };
  }

  const headers = getApiHeaders(cookies, orgId);

  const [keysResponse, usageResponse] = await Promise.all([
    classroomio.organization.automation.keys.$get({ query: { type: 'mcp' } }, headers),
    classroomio.organization.automation.usage.$get({ query: { type: 'mcp' } }, headers)
  ]);

  const [keysData, usageData] = await Promise.all([keysResponse.json(), usageResponse.json()]);

  return {
    keys: keysData.success ? keysData.data : [],
    usage: usageData.success ? usageData.data : null
  };
};
