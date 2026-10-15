import type { MetaTagsProps } from 'svelte-meta-tags';
import { redirect } from '@sveltejs/kit';
import { mockLearningPaths, type LearningPathItem } from '@cio/ui/custom/org-landing-page';

const PATHS_PER_PAGE = 9;

function toCatalogPath(path: LearningPathItem): LearningPathItem {
  return {
    ...path,
    logo: null,
    link: `/learning-paths/${path.slug ?? path.id}`
  };
}

function filterPaths(paths: LearningPathItem[], search: string): LearningPathItem[] {
  const normalized = search.toLowerCase();

  return normalized
    ? paths.filter(
        (path) => path.title.toLowerCase().includes(normalized) || path.description.toLowerCase().includes(normalized)
      )
    : paths;
}

export const load = async ({ parent, url }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    throw redirect(307, '/');
  }

  const activeSearch = url.searchParams.get('search')?.trim() ?? '';

  const requestedPage = Number(url.searchParams.get('page'));
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // TODO: replace with classroomio.organization.learningPaths.public.$get once available (Phase 4)
  const filteredPaths = filterPaths(mockLearningPaths, activeSearch);

  const pageCount = Math.max(Math.ceil(filteredPaths.length / PATHS_PER_PAGE), 1);
  const activePage = Math.min(currentPage, pageCount);
  const startIndex = (activePage - 1) * PATHS_PER_PAGE;
  const learningPaths = filteredPaths.slice(startIndex, startIndex + PATHS_PER_PAGE).map(toCatalogPath);

  const canonicalUrl = new URL(url.pathname, url.origin).href;
  const orgTitle = `${org.name} – Learning Paths`;
  const orgDescription = `Browse all learning paths offered by ${org.name}`;

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
    activeSearch,
    pagination: {
      page: activePage,
      perPage: PATHS_PER_PAGE,
      total: filteredPaths.length,
      totalPages: pageCount
    },
    pageMetaTags
  };
};
