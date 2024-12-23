import { error } from '@sveltejs/kit';
import type { BlogPost, RawBlogPost } from '$lib/types';
import type { MetaTagsProps } from 'svelte-meta-tags';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
  try {
    const response = await fetch('/api/blog');
    const posts: BlogPost[] = await response.json();

    const blog: RawBlogPost = await import(`../../../blog/${params.slug}.md`);

    return {
      content: blog.default,
      meta: blog.metadata,
      slug: params.slug,
      pageMetaTags: getPageMetaTags(blog),
      relatedPosts: getRelatedPosts(posts, blog.metadata.tags, params.slug)
    };
  } catch (e) {
    error(404, `Could not find ${params.slug}`);
  }
}

function getRelatedPosts(posts: BlogPost[], tags: string[], slug: string) {
  const related = posts
    .filter((post) => post.tags.some((tag) => tags.includes(tag)) && post.slug !== slug)
    .map((post) => ({
      ...post,
      rank: post.tags.filter((tag) => tags.includes(tag)).length
    }))
    .sort((a, b) => b.rank - a.rank);

  const topPosts = related.filter((post) => post.rank > 1);

  if (topPosts.length > 2) {
    return topPosts.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  return related.slice(0, 2);
}

function getPageMetaTags(blog: RawBlogPost): MetaTagsProps {
  return Object.freeze({
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
}
