import type { MetaTagsProps } from 'svelte-meta-tags';
import { redirect } from '@sveltejs/kit';
import { mockLearningPaths } from '@cio/ui/custom/org-landing-page';

export const load = async ({ parent, url }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    throw redirect(307, '/');
  }

  const siteName = orgSiteName || org.siteName;
  if (!siteName) {
    throw redirect(307, '/');
  }

  // TODO: replace with a real `classroomio.organization.learningPaths.public.$get` call
  // once the `learning_path` API ships (see prd/learning-paths/README.md). Mirrors the
  // shape `/courses` uses today so swapping the data source later needs no template changes.
  const learningPaths = mockLearningPaths;

  const canonicalUrl = new URL(url.pathname, url.origin).href;
  const orgTitle = `${org.name} – Learning Paths`;
  const orgDescription = `Browse guided, multi-course learning paths offered by ${org.name}`;

  const pageMetaTags = Object.freeze({
    title: orgTitle,
    description: orgDescription,
    canonical: canonicalUrl,
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: orgTitle,
      description: orgDescription
    }
  } satisfies MetaTagsProps);

  return {
    org,
    learningPaths,
    pageMetaTags
  };
};
