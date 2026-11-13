import { error } from '@sveltejs/kit';

export const prerender = false;

const blogSources = import.meta.glob('/src/blog/*.md', { query: '?raw', import: 'default', eager: true });

export function GET({ params }) {
  const source = blogSources[`/src/blog/${params.slug}.md`];
  if (typeof source !== 'string') error(404, 'Blog post not found');

  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
  const published = /^published:\s*true\s*$/m.test(frontmatter);
  if (!published) error(404, 'Blog post not found');

  return new Response(source, {
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=3600' }
  });
}
