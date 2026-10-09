import type { Cookies } from '@sveltejs/kit';

import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { ROLE } from '@cio/utils/constants';
import type { PublicOrg } from '$features/app/types';
import type { ResolveStudentHomeSuccess } from '../utils/types';
import { isSafeStudentHomePath } from '../utils/student-home';

type StudentHomeRedirectContext = {
  isOrgSite: boolean;
  org: PublicOrg | null;
  locals: App.Locals;
  cookies: Cookies;
};

/**
 * Resolves the student-home redirect for GET /. Returns a safe path or null
 * when the landing page should render. Never throws: an API failure means
 * the landing page renders as today.
 */
export async function resolveStudentHomeRedirect({
  isOrgSite,
  org,
  locals,
  cookies
}: StudentHomeRedirectContext): Promise<string | null> {
  if (!isOrgSite || !org?.hasStudentHome || !locals.user) {
    return null;
  }

  if (locals.orgRoles?.[org.id] !== ROLE.STUDENT) {
    return null;
  }

  const result = await safeServerApi<ResolveStudentHomeSuccess>(() =>
    classroomio.organization['student-home'].resolve.$get(undefined, getApiHeaders(cookies, org.id))
  );

  if (!result.ok) {
    return null;
  }

  const path = result.body.data.path;

  return path && isSafeStudentHomePath(path) ? path : null;
}
