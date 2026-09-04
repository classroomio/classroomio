import type { MetaTagsProps } from 'svelte-meta-tags';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';
import { error } from '@sveltejs/kit';

type GetPublicDocRequest = (typeof classroomio)['org-site']['note'][':docSlug']['$get'];
type GetPublicDocSuccess = Extract<InferResponseType<GetPublicDocRequest>, { success: true }>;

export const load = async ({ params, parent, url }) => {
  const { isOrgSite, orgSiteName, org } = await parent();
  const siteName = orgSiteName || org?.siteName;

  if (!isOrgSite || !siteName) {
    throw error(404, 'Note not found');
  }

  const noteResult = await safeServerApi<GetPublicDocSuccess>(() =>
    classroomio['org-site'].note[':docSlug'].$get(
      {
        param: { docSlug: params.slug },
        query: { siteName }
      },
      getApiKeyHeaders()
    )
  );

  if (!noteResult.ok || !noteResult.body.data) {
    throw error(404, 'Note not found');
  }

  const note = noteResult.body.data;
  const canonicalUrl = new URL(url.pathname, url.origin).href;
  const pageTitle = note.title.trim() || 'Shared note';

  const pageMetaTags = Object.freeze({
    title: pageTitle,
    description: note.plainText?.slice(0, 160) || `Shared note from ${note.org.name}`,
    canonical: canonicalUrl,
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: pageTitle,
      description: note.plainText?.slice(0, 160) || `Shared note from ${note.org.name}`
    }
  } satisfies MetaTagsProps);

  return {
    note,
    pageMetaTags
  };
};
