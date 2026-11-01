import type {
  GetOAuthConfigSuccess,
  ListAutomationKeysSuccess,
  ListConnectedAppsSuccess
} from '$features/automation/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();
  if (!orgId) return { keys: [], connectedApps: [], mcpUrl: '' };
  const headers = getApiHeaders(cookies, orgId);
  const [keysResult, connectedAppsResult, configResult] = await Promise.all([
    safeServerApi<ListAutomationKeysSuccess>(() =>
      classroomio.organization.automation.keys.$get({ query: { type: 'mcp' } }, headers)
    ),
    safeServerApi<ListConnectedAppsSuccess>(() =>
      classroomio.organization.automation['connected-apps'].$get({}, headers)
    ),
    safeServerApi<GetOAuthConfigSuccess>(() => classroomio.oauth.config.$get({}, headers))
  ]);
  return {
    keys: keysResult.ok ? keysResult.body.data : [],
    connectedApps: connectedAppsResult.ok ? connectedAppsResult.body.data : [],
    mcpUrl: configResult.ok ? configResult.body.data.mcpUrl : ''
  };
};
