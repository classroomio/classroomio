import type { ListAutomationKeysSuccess } from '$features/automation/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
export const load = async ({ parent, cookies }) => {
  const { orgId } = await parent();
  if (!orgId) return { keys: [] };
  const result = await safeServerApi<ListAutomationKeysSuccess>(() =>
    classroomio.organization.automation.keys.$get({ query: { type: 'api' } }, getApiHeaders(cookies, orgId))
  );
  return { keys: result.ok ? result.body.data : [] };
};
