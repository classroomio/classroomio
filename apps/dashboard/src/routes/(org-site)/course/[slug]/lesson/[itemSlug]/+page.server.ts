import type { MetaTagsProps } from 'svelte-meta-tags';

import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type GetPublicCourseRequest = (typeof classroomio)['org-site']['course'][':courseSlug']['$get'];
type GetPublicCourseItemRequest =
  (typeof classroomio)['org-site']['course'][':courseSlug']['item'][':itemSlug']['$get'];

type GetPublicCourseSuccess = Extract<InferResponseType<GetPublicCourseRequest>, { success: true }>;
type GetPublicCourseItemSuccess = Extract<InferResponseType<GetPublicCourseItemRequest>, { success: true }>;

export const load = async ({ params = { slug: '', itemSlug: '' } }) => {
  const [treeResult, itemResult] = await Promise.all([
    safeServerApi<GetPublicCourseSuccess>(() =>
      classroomio['org-site'].course[':courseSlug'].$get({ param: { courseSlug: params.slug } }, getApiKeyHeaders())
    ),
    safeServerApi<GetPublicCourseItemSuccess>(() =>
      classroomio['org-site'].course[':courseSlug'].item[':itemSlug'].$get(
        { param: { courseSlug: params.slug, itemSlug: params.itemSlug } },
        getApiKeyHeaders()
      )
    )
  ]);

  if (!treeResult.ok || !itemResult.ok) {
    throw error(404, 'Public course or lesson not found');
  }

  const tree = treeResult.body.data;
  const item = itemResult.body.data;

  const itemTitle = 'title' in item ? item.title : tree.course.title;
  const itemSummary =
    item.kind === 'lesson' && typeof item.body === 'string'
      ? item.body.replace(/<[^>]+>/g, '').slice(0, 155)
      : (tree.course.description ?? '');

  const pageMetaTags = Object.freeze({
    title: `${itemTitle} · ${tree.course.title}`,
    description: itemSummary || tree.course.description || '',
    openGraph: {
      title: itemTitle,
      description: itemSummary || tree.course.description || '',
      images: tree.course.bannerImage
        ? [
            {
              url: tree.course.bannerImage,
              alt: tree.course.title,
              width: 1200,
              height: 630,
              secureUrl: tree.course.bannerImage,
              type: 'image/jpeg'
            }
          ]
        : []
    }
  }) satisfies MetaTagsProps;

  return {
    tree,
    item,
    pageMetaTags
  };
};
