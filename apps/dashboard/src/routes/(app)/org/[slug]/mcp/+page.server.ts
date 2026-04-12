import type { GetAutomationUsageSuccess, ListAutomationKeysSuccess } from '$features/automation/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return { keys: [], usage: null };
  }

  const headers = getApiHeaders(cookies, orgId);

  const [keysResult, usageResult] = await Promise.all([
    safeServerApi<ListAutomationKeysSuccess>(() =>
      classroomio.organization.automation.keys.$get({ query: { type: 'mcp' } }, headers)
    ),
    safeServerApi<GetAutomationUsageSuccess>(() =>
      classroomio.organization.automation.usage.$get({ query: { type: 'mcp' } }, headers)
    )
  ]);

  return {
    keys: keysResult.ok ? keysResult.body.data : [],
    usage: usageResult.ok ? usageResult.body.data : null
  };
};
