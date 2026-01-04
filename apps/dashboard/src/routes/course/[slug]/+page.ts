import type { MetaTagsProps } from 'svelte-meta-tags';
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

export const load = async ({ params = { slug: '' } }) => {
  let course = null;
  try {
    const response = await classroomio.course.slug[':slug'].$get(
      {
        param: { slug: params.slug }
      },
      getApiKeyHeaders()
    );

    const result = await response.json();
    if (result.success && result.data) {
      course = result.data;
    }
  } catch (error) {
    console.error('Failed to fetch course:', error);
  }

  const pageMetaTags = Object.freeze({
    title: course?.title,
    description: course?.description,
    openGraph: {
      title: course?.title,
      description: course?.description,
      images: [
        {
          url: course?.logo || '',
          alt: course?.title,
          width: 280,
          height: 200,
          secureUrl: course?.logo,
          type: 'image/jpeg'
        }
      ]
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image' as const,
      title: course?.title,
      description: course?.description,
      image: course?.logo,
      imageAlt: 'ClassroomIO OG Image'
    }
  }) satisfies MetaTagsProps;

  return {
    slug: params.slug,
    course,
    pageMetaTags
  };
};
