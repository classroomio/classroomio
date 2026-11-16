import { error } from '@sveltejs/kit';
import { getAlternative, SLUGS } from '$lib/features/alternatives/content';

export const prerender = true;

export function entries() {
  return SLUGS.map((slug) => ({ slug }));
}

export function load({ params }) {
  const alternative = getAlternative(params.slug);

  if (!alternative) {
    error(404, `Could not find an alternative page for ${params.slug}`);
  }

  const pageMetaTags = {
    title: alternative.page.seo.title,
    description: alternative.page.seo.meta,
    openGraph: {
      title: alternative.page.seo.title,
      description: alternative.page.seo.meta
    },
    twitter: {
      title: alternative.page.seo.title,
      description: alternative.page.seo.meta
    }
  };

  return {
    ...alternative,
    pageMetaTags
  };
}
