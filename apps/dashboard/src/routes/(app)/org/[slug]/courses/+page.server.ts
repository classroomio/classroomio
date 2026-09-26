import type { GetTagGroupsSuccess } from '$features/tag/utils/types';
import type { OrgCourses, OrgCoursesSuccess } from '$features/course/types';
import {
  DEFAULT_COURSE_LIST_NEXT,
  ORG_COURSES_PAGE_SIZE,
  parseCourseListFilters,
  parseCourseListNext,
  type CourseListFilters
} from '$features/course/utils/course-list-filters';
import { classroomio, getApiHeaders } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';

import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

type ApiHeaders = ReturnType<typeof getApiHeaders>;

function toOrganizationCoursesApiQuery(filters: CourseListFilters, page: number) {
  const tags = filters.tags.length > 0 ? filters.tags.join(',') : undefined;
  const search = filters.search || undefined;
  const type = filters.courseType !== 'all' ? filters.courseType : undefined;
  const status = filters.publishedStatus === 'all' ? undefined : filters.publishedStatus;
  const sort = filters.sortKey;
  const order = filters.order;

  return {
    page: String(page),
    limit: String(ORG_COURSES_PAGE_SIZE),
    search,
    tags,
    type,
    status,
    sort,
    order
  };
}

async function fetchOrganizationCoursesPages(
  headers: ApiHeaders,
  filters: CourseListFilters,
  pagesToLoad: number
): Promise<{ courses: OrgCourses; pagination: OrgCoursesSuccess['pagination'] }> {
  const allCourses: OrgCourses = [];
  const seenIds = new Set<string>();
  let pagination: OrgCoursesSuccess['pagination'] = {
    page: DEFAULT_COURSE_LIST_NEXT,
    limit: ORG_COURSES_PAGE_SIZE,
    total: 0,
    totalPages: 0
  };

  for (let page = 1; page <= pagesToLoad; page += 1) {
    const query = toOrganizationCoursesApiQuery(filters, page);
    const coursesResult = await safeServerApi<OrgCoursesSuccess>(() =>
      classroomio.organization.courses.$get({ query }, headers)
    );

    if (!coursesResult.ok) {
      break;
    }

    pagination = coursesResult.body.pagination;

    for (const course of coursesResult.body.data ?? []) {
      if (seenIds.has(course.id)) {
        continue;
      }

      seenIds.add(course.id);
      allCourses.push(course);
    }

    if (page >= (pagination.totalPages || 1)) {
      break;
    }
  }

  return { courses: allCourses, pagination };
}

export const load = async ({ parent, locals, cookies, url }) => {
  const loadStart = performance.now();
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    return {
      courses: [],
      activeTags: [],
      tagGroups: [],
      pagination: {
        next: DEFAULT_COURSE_LIST_NEXT,
        limit: ORG_COURSES_PAGE_SIZE,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    };
  }

  const filters = parseCourseListFilters(url.searchParams);
  const next = parseCourseListNext(url.searchParams);
  const headers = getApiHeaders(cookies, orgId);
  const apiStart = performance.now();
  const [{ courses, pagination }, tagsResult] = await Promise.all([
    fetchOrganizationCoursesPages(headers, filters, next),
    safeServerApi<GetTagGroupsSuccess>(() => classroomio.organization.tags.$get({}, headers))
  ]);

  const apiMs = Math.round((performance.now() - apiStart) * 100) / 100;
  const tagGroups = tagsResult.ok ? tagsResult.body.data : [];
  const totalPages = pagination.totalPages ?? 0;
  const loadMs = Math.round((performance.now() - loadStart) * 100) / 100;
  console.log(
    `[org/[slug]/courses +page.server] load: ${loadMs}ms (organization courses + tags API: ${apiMs}ms) | PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED}`
  );

  return {
    courses,
    activeTags: filters.tags,
    tagGroups,
    pagination: {
      next,
      limit: pagination.limit ?? ORG_COURSES_PAGE_SIZE,
      total: pagination.total ?? 0,
      totalPages,
      hasMore: next < totalPages
    }
  };
};
