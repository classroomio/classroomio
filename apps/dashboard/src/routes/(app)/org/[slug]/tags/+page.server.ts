import type { GetTagGroupsSuccess } from '$features/tag/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

export const load = async ({ parent, cookies, params }) => {
  const { orgId } = await parent();

  if (!orgId) {
    return {
      initialTagGroups: [],
      orgSlug: params.slug
    };
  }

  const result = await safeServerApi<GetTagGroupsSuccess>(() =>
    classroomio.organization.tags.$get({}, getApiHeaders(cookies, orgId))
  );

  if (!result.ok && (result.status === 401 || result.status === 403)) {
    throw redirect(302, `/org/${params.slug}`);
  }

  return {
    initialTagGroups: result.ok ? result.body.data : [],
    orgSlug: params.slug
  };
};
