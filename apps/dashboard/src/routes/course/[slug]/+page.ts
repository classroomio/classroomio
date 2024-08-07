import { fetchCourse } from '$lib/utils/services/courses';
import { supabase, getSupabase } from '$lib/utils/functions/supabase';
import type { MetaTagsProps } from 'svelte-meta-tags';

if (!supabase) {
  getSupabase();
}

export const load = async ({ params = { slug: '' } }) => {
  const { data } = await fetchCourse(undefined, params.slug);

  const pageMetaTags = Object.freeze({
    title: data?.title,
    description: data?.description,
    openGraph: {
      title: data?.title,
      description: data?.description,
      images: [
        {
          url: data?.logo,
          alt: data?.title,
          width: 280,
          height: 200,
          secureUrl: data?.logo,
          type: 'image/jpeg'
        }
      ]
    },
    twitter: {
      handle: '@classroomio',
      site: '@classroomio',
      cardType: 'summary_large_image',
      title: data?.title,
      description: data?.description,
      image: data?.logo,
      imageAlt: 'ClassroomIO OG Image'
    }
  }) satisfies MetaTagsProps;

  return {
    slug: params.slug,
    course: data,
    pageMetaTags
  };
};
