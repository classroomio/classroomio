import type { MetaTagsProps } from 'svelte-meta-tags';
import type { CourseBySlugWithOrg, GetCourseBySlugRequest } from '$features/course/utils/types';
import type { GetOrganizationRequest } from '$features/org/utils/types';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';

type GetCourseBySlugSuccess = Extract<InferResponseType<GetCourseBySlugRequest>, { success: true }>;
type GetOrganizationSuccess = Extract<InferResponseType<GetOrganizationRequest>, { success: true }>;

type GetPublicCourseRequest = (typeof classroomio)['org-site']['course'][':courseSlug']['$get'];
type GetPublicCourseSuccess = Extract<InferResponseType<GetPublicCourseRequest>, { success: true }>;

export const load = async ({ params = { slug: '' }, parent }) => {
  const { org: parentOrg } = await parent();

  // PUBLIC courses are served by the anonymous org-site endpoint and bypass the
  // regular landing page entirely — redirect straight to the first item.
  const publicTreeResult = await safeServerApi<GetPublicCourseSuccess>(() =>
    classroomio['org-site'].course[':courseSlug'].$get({ param: { courseSlug: params.slug } }, getApiKeyHeaders())
  );

  if (publicTreeResult.ok && publicTreeResult.body.data.items.length > 0) {
    const firstItem = publicTreeResult.body.data.items[0]!;
    throw redirect(302, `/course/${params.slug}/lesson/${firstItem.slug}`);
  }

  const courseResult = await safeServerApi<GetCourseBySlugSuccess>(() =>
    classroomio.course.slug[':slug'].$get(
      {
        param: { slug: params.slug }
      },
      getApiKeyHeaders()
    )
  );

  if (!courseResult.ok || !courseResult.body.data) {
    console.error('Failed to fetch course:', courseResult);

    return {
      slug: params.slug,
      course: null,
      org: parentOrg ?? null,
      pageMetaTags: null
    };
  }

  const course = courseResult.body.data as CourseBySlugWithOrg;

  let org = parentOrg ?? null;
  const courseOrgSiteName = course.org?.siteName;

  if (!org && courseOrgSiteName) {
    const organizationResult = await safeServerApi<GetOrganizationSuccess>(() =>
      classroomio.organization.$get(
        {
          query: { siteName: courseOrgSiteName }
        },
        getApiKeyHeaders()
      )
    );

    if (organizationResult.ok) {
      org = organizationResult.body.data[0] ?? null;
    } else {
      console.error('Failed to fetch course organization:', organizationResult);
    }
  }

  const pageMetaTags = Object.freeze({
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [
        {
          url: course.logo || '',
          alt: course.title,
          width: 280,
          height: 200,
          secureUrl: course.logo,
          type: 'image/jpeg'
        }
      ]
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image' as const,
      title: course.title,
      description: course.description,
      image: course.logo,
      imageAlt: 'ClassroomIO OG Image'
    }
  }) satisfies MetaTagsProps;

  return {
    slug: params.slug,
    course,
    org,
    pageMetaTags
  };
};
