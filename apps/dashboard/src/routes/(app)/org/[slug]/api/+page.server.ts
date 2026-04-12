import type { ListAutomationKeysSuccess } from '$features/automation/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return { keys: [] };
  }

  const headers = getApiHeaders(cookies, orgId);

  const keysResult = await safeServerApi<ListAutomationKeysSuccess>(() =>
    classroomio.organization.automation.keys.$get({ query: { type: 'api' } }, headers)
  );

  return {
    keys: keysResult.ok ? keysResult.body.data : []
  };
};
