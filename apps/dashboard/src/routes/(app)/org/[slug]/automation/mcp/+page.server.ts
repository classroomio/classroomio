import type {
  GetAutomationUsageSuccess,
  GetOAuthConfigSuccess,
  ListAutomationKeysSuccess,
  ListConnectedAppsSuccess
} from '$features/automation/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();
  if (!orgId) return { keys: [], usage: null, connectedApps: [], mcpUrl: '' };
  const headers = getApiHeaders(cookies, orgId);
  const [keysResult, usageResult, connectedAppsResult, configResult] = await Promise.all([
    safeServerApi<ListAutomationKeysSuccess>(() =>
      classroomio.organization.automation.keys.$get({ query: { type: 'mcp' } }, headers)
    ),
    safeServerApi<GetAutomationUsageSuccess>(() =>
      classroomio.organization.automation.usage.$get({ query: { type: 'mcp' } }, headers)
    ),
    safeServerApi<ListConnectedAppsSuccess>(() =>
      classroomio.organization.automation['connected-apps'].$get({}, headers)
    ),
    safeServerApi<GetOAuthConfigSuccess>(() => classroomio.oauth.config.$get({}, headers))
  ]);
  return {
    keys: keysResult.ok ? keysResult.body.data : [],
    usage: usageResult.ok ? usageResult.body.data : null,
    connectedApps: connectedAppsResult.ok ? connectedAppsResult.body.data : [],
    mcpUrl: configResult.ok ? configResult.body.data.mcpUrl : ''
  };
};
