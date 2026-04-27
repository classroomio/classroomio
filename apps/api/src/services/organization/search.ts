import {
  searchLmsCourses,
  searchLmsPrograms,
  searchOrgAudience,
  searchOrgCourses,
  searchOrgPrograms,
  searchOrgTagsAndGroups,
  searchOrgWidgets
} from '@cio/db/queries';

export async function searchOrganization(orgId: string, search: string, limit: number) {
  const [courses, programs, widgets, tags, audience] = await Promise.all([
    searchOrgCourses(orgId, search, limit),
    searchOrgPrograms(orgId, search, limit),
    searchOrgWidgets(orgId, search, limit),
    searchOrgTagsAndGroups(orgId, search, limit),
    searchOrgAudience(orgId, search, limit)
  ]);

  return {
    courses,
    programs,
    widgets,
    tags,
    audience
  };
}

export async function searchLmsOrganization(orgId: string, profileId: string, search: string, limit: number) {
  const [courses, programs] = await Promise.all([
    searchLmsCourses(orgId, profileId, search, limit),
    searchLmsPrograms(orgId, profileId, search, limit)
  ]);

  return {
    courses,
    programs
  };
}
