import type { GetTagGroupsSuccess } from '$features/tag/utils/types';
import type { OrgCourses } from '$features/course/types';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type { InferResponseType } from '$lib/utils/services/api';

import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

type GetOrganizationCoursesRequest = typeof classroomio.organization.courses.$get;
type GetOrganizationCoursesSuccess = Extract<InferResponseType<GetOrganizationCoursesRequest>, { success: true }>;
type ApiHeaders = ReturnType<typeof getApiHeaders>;

async function fetchAllOrganizationCourses(headers: ApiHeaders, tagsQuery?: string): Promise<OrgCourses> {
  const allCourses: OrgCourses = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const coursesResult = await safeServerApi<GetOrganizationCoursesSuccess>(() =>
      classroomio.organization.courses.$get(
        {
          query: {
            page: String(currentPage),
            limit: '100',
            ...(tagsQuery ? { tags: tagsQuery } : {})
          }
        },
        headers
      )
    );

    if (!coursesResult.ok) {
      break;
    }

    allCourses.push(...(coursesResult.body.data ?? []));
    totalPages = coursesResult.body.pagination?.totalPages ?? 1;
    currentPage += 1;
  }

  return allCourses;
}

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

  const headers = getApiHeaders(cookies, orgId);
  const apiStart = performance.now();
  const [courses, tagsResult] = await Promise.all([
    fetchAllOrganizationCourses(headers, normalizedTagsQuery),
    safeServerApi<GetTagGroupsSuccess>(() => classroomio.organization.tags.$get({}, headers))
  ]);

  const apiMs = Math.round((performance.now() - apiStart) * 100) / 100;
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
