import type { MetaTagsProps } from 'svelte-meta-tags';
import { error } from '@sveltejs/kit';
import { mockLearningPaths, mockLearningPathDetails, toLearningPathDetail } from '@cio/ui/custom/org-landing-page';

export const load = async ({ params, parent, url }) => {
  const { isOrgSite, org } = await parent();

  if (!isOrgSite || !org) {
    throw error(404, 'Not found');
  }

  const detail = toLearningPathDetail(mockLearningPaths, mockLearningPathDetails, params.slug);

  if (!detail) {
    throw error(404, 'Not found');
  }

  const canonicalUrl = new URL(`/learning-paths/${params.slug}`, `${url.origin}`).href;
  const pageTitle = `${detail.title} · ${org.name}`;
  const pageDescription = detail.description;

  const pageMetaTags: MetaTagsProps = Object.freeze({
    title: pageTitle,
    description: pageDescription,
    canonical: canonicalUrl,
    openGraph: {
      type: 'website',
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl
    }
  });

  return {
    org,
    detail,
    pageMetaTags
  };
};
