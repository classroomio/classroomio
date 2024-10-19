import { error } from '@sveltejs/kit';
import type { MetaTagsProps } from 'svelte-meta-tags';

export async function load({ params }) {
  try {
    const blog = await import(`../../../blog/${params.slug}.md`);

    const pageMetaTags = Object.freeze({
      title: blog.metadata.title,
      description: blog.metadata.description,
      openGraph: {
        title: blog.metadata.title,
        description: blog.metadata.description,
        images: [
          {
            url: blog.metadata.imageUrl,
            alt: blog.metadata.title,
            width: 280,
            height: 200,
            secureUrl: blog.metadata.imageUrl,
            type: 'image/jpeg'
          }
        ]
      },
      twitter: {
        handle: '@classroomio',
        site: '@classroomio',
        cardType: 'summary_large_image' as const,
        title: blog.metadata.title,
        description: blog.metadata.description,
        image: blog.metadata.imageUrl,
        imageAlt: `${blog.metadata.title} OG`
      }
    }) satisfies MetaTagsProps;

    return {
      content: blog.default,
      meta: blog.metadata,
      slug: params.slug,
      pageMetaTags
    };
  } catch (e) {
    error(404, `Could not find ${params.slug}`);
  }
}
