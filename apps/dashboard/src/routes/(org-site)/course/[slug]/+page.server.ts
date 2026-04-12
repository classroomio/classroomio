import type { MetaTagsProps } from 'svelte-meta-tags';
import type { GetCourseBySlugRequest } from '$features/course/utils/types';
import type { GetOrganizationRequest } from '$features/org/utils/types';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';

type GetCourseBySlugSuccess = Extract<InferResponseType<GetCourseBySlugRequest>, { success: true }>;
type GetOrganizationSuccess = Extract<InferResponseType<GetOrganizationRequest>, { success: true }>;

export const load = async ({ params = { slug: '' }, parent }) => {
  const { org: parentOrg } = await parent();

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

  const course = courseResult.body.data;

  let org = parentOrg ?? null;
  if (!org && course.org?.siteName) {
    const organizationResult = await safeServerApi<GetOrganizationSuccess>(() =>
      classroomio.organization.$get(
        {
          query: { siteName: course.org.siteName }
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
