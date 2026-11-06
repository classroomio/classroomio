import type { Cookies } from '@sveltejs/kit';

import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type { AccountOrg, AccountSuccess } from '$features/app/types';

/**
 * Loads the signed-in user's own org memberships, with their role and plans.
 * Returns null when the account cannot be loaded.
 */
export async function getAccountOrganizations(cookies: Cookies): Promise<AccountOrg[] | null> {
  const result = await safeServerApi<AccountSuccess>(() => classroomio.account.$get(undefined, getApiHeaders(cookies)));

  if (!result.ok) {
    return null;
  }

  return result.body.organizations;
}
