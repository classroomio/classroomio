import { classroomio, getApiHeaders } from '$lib/utils/services/api';

import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

export const load = async ({ parent, locals, cookies, url }) => {
  const loadStart = performance.now();

  const tagsParam = url.searchParams.get('tags');
  const { orgId } = await parent();

  if (!orgId || !locals.user?.id) {
    const loadMs = Math.round((performance.now() - loadStart) * 100) / 100;
    console.log(
      `[org/[slug]/courses +page.server] load: ${loadMs}ms (skipped: no orgId or user) | PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED}`
    );

    return {
      courses: []
    };
  }

  const normalizedTags = tagsParam
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalizedTagsQuery = normalizedTags && normalizedTags.length > 0 ? normalizedTags.join(',') : undefined;

  const apiStart = performance.now();
  const [coursesResponse, tagsResponse] = await Promise.all([
    classroomio.organization.courses.$get(
      normalizedTagsQuery
        ? {
            query: {
              tags: normalizedTagsQuery
            }
          }
        : { query: {} },
      getApiHeaders(cookies, orgId)
    ),
    classroomio.organization.tags.$get({}, getApiHeaders(cookies, orgId))
  ]);

  const [coursesData, tagsData] = await Promise.all([coursesResponse.json(), tagsResponse.json()]);
  const apiMs = Math.round((performance.now() - apiStart) * 100) / 100;

  const courses = coursesData.success ? coursesData.data : [];
  const tagGroups = tagsData.success ? tagsData.data : [];

  const loadMs = Math.round((performance.now() - loadStart) * 100) / 100;
  console.log(
    `[org/[slug]/courses +page.server] load: ${loadMs}ms (organization courses + tags API: ${apiMs}ms) | PUBLIC_IS_SELFHOSTED=${PUBLIC_IS_SELFHOSTED}`
  );

  return {
    courses: courses || [],
    activeTags: normalizedTags ?? [],
    tagGroups
  };
};
