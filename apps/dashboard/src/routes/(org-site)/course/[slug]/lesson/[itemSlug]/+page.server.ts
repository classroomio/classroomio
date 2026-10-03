import type { MetaTagsProps } from 'svelte-meta-tags';

import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type GetPublicCourseItemRequest =
  (typeof classroomio)['org-site']['course'][':courseSlug']['item'][':itemSlug']['$get'];
type GetPublicCourseItemSuccess = Extract<InferResponseType<GetPublicCourseItemRequest>, { success: true }>;

export const load = async ({ params = { slug: '', itemSlug: '' }, url, parent }) => {
  const { tree } = await parent();

  const itemResult = await safeServerApi<GetPublicCourseItemSuccess>(() =>
    classroomio['org-site'].course[':courseSlug'].item[':itemSlug'].$get(
      { param: { courseSlug: params.slug, itemSlug: params.itemSlug } },
      getApiKeyHeaders()
    )
  );

  if (!itemResult.ok) {
    throw error(404, 'Public course or lesson not found');
  }

  const item = itemResult.body.data;

  const courseUrl = new URL(`/course/${tree.course.slug}`, url.origin).href;
  const description = tree.course.description || '';
  const ogImage = tree.course.bannerImage || null;

  const pageMetaTags = Object.freeze({
    title: tree.course.title,
    description,
    canonical: courseUrl,
    openGraph: {
      type: 'website',
      url: courseUrl,
      title: tree.course.title,
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: tree.course.title,
              width: 1200,
              height: 630,
              secureUrl: ogImage,
              type: 'image/jpeg'
            }
          ]
        : []
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image' as const,
      title: tree.course.title,
      description,
      image: ogImage ?? undefined,
      imageAlt: tree.course.title
    }
  }) satisfies MetaTagsProps;

  return {
    item,
    pageMetaTags
  };
};
