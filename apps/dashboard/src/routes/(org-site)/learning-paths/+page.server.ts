import type { MetaTagsProps } from 'svelte-meta-tags';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { redirect } from '@sveltejs/kit';
import type { LearningPathItem } from '@cio/ui/custom/org-landing-page';

const PATHS_PER_PAGE = 9;

type ListPublicLearningPathsRequest = (typeof classroomio.organization)['learning-paths']['public']['$get'];
type ListPublicLearningPathsSuccess = Extract<InferResponseType<ListPublicLearningPathsRequest>, { success: true }>;
type PublicLearningPath = ListPublicLearningPathsSuccess['data']['learningPaths'][number];

function toCatalogPath(path: PublicLearningPath): LearningPathItem {
  return {
    id: path.id,
    slug: path.slug ?? path.publicId ?? path.id,
    logo: path.coverImage,
    title: path.name,
    description: path.description ?? '',
    cost: path.cost ?? 0,
    currency: path.currency ?? 'USD',
    courseCount: path.courseCount ?? 0,
    link: `/learning-paths/${path.slug ?? path.publicId ?? path.id}`
  };
}

export const load = async ({ parent, url }) => {
  const { isOrgSite, orgSiteName, org } = await parent();

  if (!isOrgSite || !org) {
    throw redirect(307, '/');
  }

  const siteName = orgSiteName || org.siteName;
  if (!siteName) {
    throw redirect(307, '/');
  }

  const activeSearch = url.searchParams.get('search')?.trim() ?? '';

  const requestedPage = Number(url.searchParams.get('page'));
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const pathsResult = await safeServerApi<ListPublicLearningPathsSuccess>(() =>
    classroomio.organization['learning-paths'].public.$get({
      query: {
        siteName,
        page: String(currentPage),
        limit: String(PATHS_PER_PAGE),
        ...(activeSearch ? { search: activeSearch } : {})
      }
    })
  );
  const pathData = pathsResult.ok
    ? pathsResult.body.data
    : { learningPaths: [], hasMoreLearningPaths: false, total: 0, page: currentPage, limit: 0, totalPages: 0 };

  const learningPaths = pathData.learningPaths.map(toCatalogPath);

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
      page: pathData.page,
      perPage: pathData.limit,
      total: pathData.total,
      totalPages: pathData.totalPages
    },
    pageMetaTags
  };
};
