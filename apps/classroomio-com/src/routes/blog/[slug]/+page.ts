import type { BlogPost } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { MetaTagsProps } from 'svelte-meta-tags';


export async function load({ params }) {
  try {
		const response = await fetch('api/blog');
    const posts: BlogPost[] = await response.json();

		const blog = await import(`../../../blog/${params.slug}.md`);


		const relatedPosts = posts
		.filter(
			post =>
				post.tags.some(tag => blog.metadata.tags.includes(tag)) &&
				post.slug !== params.slug
		)
		.map(post => ({
			...post,
			matchScore: post.tags.filter(tag => blog.metadata.tags.includes(tag)).length,
		}))
		.sort((a, b) => b.matchScore - a.matchScore);


	const highPriorityPosts = relatedPosts.filter(post => post.matchScore > 1);

	const otherBlogsSuggestion =
		highPriorityPosts.length > 2
			? highPriorityPosts
					.sort(() => Math.random() - 0.5)
					.slice(0, 2) 
			: relatedPosts.slice(0, 2);


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
      pageMetaTags,
			otherBlogsSuggestion
    };
  } catch (e) {
    error(404, `Could not find ${params.slug}`);
  }
}
