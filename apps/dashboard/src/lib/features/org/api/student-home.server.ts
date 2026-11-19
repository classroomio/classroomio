import type { Cookies } from '@sveltejs/kit';

import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { ROLE } from '@cio/utils/constants';
import type { PublicOrg } from '$features/app/types';
import type { ResolveStudentHomeSuccess } from '../utils/types';
import { isSafeStudentHomePath } from '../utils/student-home';

type StudentHomeLookupContext = {
  isOrgSite: boolean;
  org: PublicOrg | null;
  cookies: Cookies;
};

type StudentHomeRedirectContext = StudentHomeLookupContext & {
  locals: App.Locals;
};

/**
 * Asks the API for the signed-in user's student home in the current org.
 * Returns a safe path, or null when the org has no student home, the user is
 * not a student there, or the API call fails. Never throws.
 */
export async function fetchStudentHomePath({
  isOrgSite,
  org,
  cookies
}: StudentHomeLookupContext): Promise<string | null> {
  if (!isOrgSite || !org?.hasStudentHome) {
    return null;
  }

  const result = await safeServerApi<ResolveStudentHomeSuccess>(() =>
    classroomio.organization['student-home'].resolve.$get(
      { header: { 'cio-org-id': org.id } },
      getApiHeaders(cookies, org.id)
    )
  );

  if (!result.ok) {
    return null;
  }

  const path = result.body.data.path;

  return path && isSafeStudentHomePath(path) ? path : null;
}

/**
 * Resolves the student-home redirect for GET /. Returns a safe path, or null
 * when the landing page should render. Skips the API call unless the session
 * already marks the user as a student of this org.
 */
export async function resolveStudentHomeRedirect({
  isOrgSite,
  org,
  locals,
  cookies
}: StudentHomeRedirectContext): Promise<string | null> {
  if (!org || !locals.user || locals.orgRoles?.[org.id] !== ROLE.STUDENT) {
    return null;
  }

  return fetchStudentHomePath({ isOrgSite, org, cookies });
}
