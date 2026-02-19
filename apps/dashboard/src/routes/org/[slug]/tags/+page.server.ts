import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { redirect } from '@sveltejs/kit';

export const load = async ({ parent, cookies, params }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      initialTagGroups: [],
      orgSlug: params.slug
    };
  }

  const response = await classroomio.organization.tags.$get({}, getApiHeaders(cookies, orgId));

  if (response.status === 401 || response.status === 403) {
    throw redirect(302, `/org/${params.slug}`);
  }

  const payload = await response.json();

  return {
    initialTagGroups: payload.success ? payload.data : [],
    orgSlug: params.slug
  };
};
