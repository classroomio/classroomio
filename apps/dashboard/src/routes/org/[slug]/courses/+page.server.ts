import { classroomio, getApiHeaders } from '$lib/utils/services/api';

export const load = async ({ parent, locals, cookies, url }) => {
  const tagsParam = url.searchParams.get('tags');
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    return {
      courses: []
    };
  }

  const normalizedTags = tagsParam
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalizedTagsQuery = normalizedTags && normalizedTags.length > 0 ? normalizedTags.join(',') : undefined;

  const [coursesResponse, tagsResponse] = await Promise.all([
    classroomio.organization.courses.$get(
      normalizedTagsQuery
        ? {
            query: {
              tags: normalizedTagsQuery
            }
          }
        : {},
      getApiHeaders(cookies, orgId)
    ),
    classroomio.organization.tags.$get({}, getApiHeaders(cookies, orgId))
  ]);

  const [coursesData, tagsData] = await Promise.all([coursesResponse.json(), tagsResponse.json()]);
  const courses = coursesData.success ? coursesData.data : [];
  const tagGroups = tagsData.success ? tagsData.data : [];

  return {
    courses: courses || [],
    activeTags: normalizedTags ?? [],
    tagGroups
  };
};
