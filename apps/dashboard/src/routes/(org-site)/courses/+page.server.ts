import type { MetaTagsProps } from 'svelte-meta-tags';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

type GetPublicCoursesRequest = typeof classroomio.organization.courses.public.$get;
type GetPublicCoursesSuccess = Extract<InferResponseType<GetPublicCoursesRequest>, { success: true }>;
type GetPublicTagsRequest = typeof classroomio.organization.tags.public.$get;
type GetPublicTagsSuccess = Extract<InferResponseType<GetPublicTagsRequest>, { success: true }>;

function normalizeTagsParam(rawTags: string | null): string[] {
  const normalized = rawTags
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return normalized ?? [];
}

export const load = async ({ parent, url }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    throw redirect(307, '/');
  }

  const siteName = orgSiteName || org.siteName;
  if (!siteName) {
    throw redirect(307, '/');
  }

  const normalizedTags = normalizeTagsParam(url.searchParams.get('tags'));
  const normalizedTagsQuery = normalizedTags.length > 0 ? normalizedTags.join(',') : undefined;

  const requestedPage = Number(url.searchParams.get('page'));
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [coursesResult, tagsResult] = await Promise.all([
    safeServerApi<GetPublicCoursesSuccess>(() =>
      classroomio.organization.courses.public.$get({
        query: {
          siteName,
          page: String(currentPage),
          ...(normalizedTagsQuery ? { tags: normalizedTagsQuery } : {})
        }
      })
    ),
    safeServerApi<GetPublicTagsSuccess>(() =>
      classroomio.organization.tags.public.$get({
        query: {
          siteName
        }
      })
    )
  ]);
  const courseData = coursesResult.ok
    ? coursesResult.body.data
    : { courses: [], hasMoreCourses: false, total: 0, page: currentPage, limit: 0, totalPages: 0 };
  const canonicalUrl = new URL(url.pathname, url.origin).href;
  const orgTitle = `${org.name} – All Courses`;
  const orgDescription = `Browse all courses offered by ${org.name}`;

  const pageMetaTags = Object.freeze({
    title: orgTitle,
    description: orgDescription,
    canonical: canonicalUrl,
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: orgTitle,
      description: orgDescription,
      ...(org.avatarUrl
        ? {
            images: [
              {
                url: org.avatarUrl,
                alt: `${org.name} logo`,
                secureUrl: org.avatarUrl,
                type: 'image/jpeg'
              }
            ]
          }
        : {})
    }
  } satisfies MetaTagsProps);

  return {
    org,
    courses: courseData.courses,
    tagGroups: tagsResult.ok ? tagsResult.body.data : [],
    activeTags: normalizedTags,
    pagination: {
      page: courseData.page,
      perPage: courseData.limit,
      total: courseData.total,
      totalPages: courseData.totalPages
    },
    pageMetaTags
  };
};
