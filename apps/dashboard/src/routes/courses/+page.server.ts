import { classroomio } from '$lib/utils/services/api';
import { redirect } from '@sveltejs/kit';

function normalizeTagsParam(rawTags: string | null): string[] {
  const normalized = rawTags
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return normalized ?? [];
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

  const normalizedTags = normalizeTagsParam(url.searchParams.get('tags'));
  const normalizedTagsQuery = normalizedTags.length > 0 ? normalizedTags.join(',') : undefined;

  const [coursesResponse, tagsResponse] = await Promise.all([
    classroomio.organization.courses.public.$get({
      query: {
        siteName,
        ...(normalizedTagsQuery ? { tags: normalizedTagsQuery } : {})
      }
    }),
    classroomio.organization.tags.public.$get({
      query: {
        siteName
      }
    })
  ]);

  const [coursesPayload, tagsPayload] = await Promise.all([coursesResponse.json(), tagsResponse.json()]);

  return {
    org,
    courses: coursesPayload.success ? coursesPayload.data : [],
    tagGroups: tagsPayload.success ? tagsPayload.data : [],
    activeTags: normalizedTags
  };
};
