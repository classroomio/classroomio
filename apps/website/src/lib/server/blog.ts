import type { BlogPost } from '$lib/utils/types';

export function getPublishedBlogPosts(): BlogPost[] {
  const blogPosts: BlogPost[] = [];
  const files = import.meta.glob('/src/blog/*.md', { eager: true });

  for (const path in files) {
    const file = files[path];
    const slug = path.split('/').at(-1)?.replace('.md', '');

    if (file && typeof file === 'object' && 'metadata' in file && slug) {
      const metadata = file.metadata as Omit<BlogPost, 'slug'>;
      const blogPost = { ...metadata, slug } satisfies BlogPost;
      if (blogPost.published) blogPosts.push(blogPost);
    }
  }

  return blogPosts.sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
}
