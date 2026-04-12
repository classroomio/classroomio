import type { GetTagGroupsSuccess } from '$features/tag/utils/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type { InferResponseType } from '$lib/utils/services/api';

import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

type GetOrganizationCoursesRequest = typeof classroomio.organization.courses.$get;
type GetOrganizationCoursesSuccess = Extract<InferResponseType<GetOrganizationCoursesRequest>, { success: true }>;

export const load = async ({ parent, locals, cookies, url }) => {
  const loadStart = performance.now();

  const tagsParam = url.searchParams.get('tags');
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    return {
      courses: []
    };
  }

  const normalizedTags = tagsParam
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalizedTagsQuery = normalizedTags && normalizedTags.length > 0 ? normalizedTags.join(',') : undefined;

  const apiStart = performance.now();
  const [coursesResult, tagsResult] = await Promise.all([
    safeServerApi<GetOrganizationCoursesSuccess>(() =>
      classroomio.organization.courses.$get(
        normalizedTagsQuery
          ? {
              query: {
                tags: normalizedTagsQuery
              }
            }
          : { query: {} },
        getApiHeaders(cookies, orgId)
      )
    ),
    safeServerApi<GetTagGroupsSuccess>(() => classroomio.organization.tags.$get({}, getApiHeaders(cookies, orgId)))
  ]);

  const apiMs = Math.round((performance.now() - apiStart) * 100) / 100;

  const courses = coursesResult.ok ? coursesResult.body.data : [];
  const tagGroups = tagsResult.ok ? tagsResult.body.data : [];

  const loadMs = Math.round((performance.now() - loadStart) * 100) / 100;
  console.log(
    `[org/[slug]/courses +page.server] load: ${loadMs}ms (organization courses + tags API: ${apiMs}ms) | PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED}`
  );

  return {
    courses: courses || [],
    activeTags: normalizedTags ?? [],
    tagGroups
  };
};
