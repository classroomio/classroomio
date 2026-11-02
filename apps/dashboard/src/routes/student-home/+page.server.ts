import { redirect } from '@sveltejs/kit';
import { LMS_FALLBACK_PATH } from '@cio/utils/lms';
import { ROUTE } from '$lib/utils/constants/routes';
import { fetchStudentHomePath } from '$features/org/api/student-home.server';

export const load = async ({ parent, cookies, url }) => {
  const { isOrgSite, org, locals } = await parent();

  if (!locals.user) {
    const loginPath = `${ROUTE.LOGIN}?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    redirect(303, loginPath);
  }

  const studentHomePath = await fetchStudentHomePath({ isOrgSite, org, cookies });

  redirect(303, studentHomePath ?? LMS_FALLBACK_PATH);
};
