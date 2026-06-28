import {
  searchLmsCourses,
  searchLmsCohorts,
  searchOrgAudience,
  searchOrgCourses,
  searchOrgCohorts,
  searchOrgTagsAndGroups,
  searchOrgWidgets
} from '@cio/db/queries';

export async function searchOrganization(orgId: string, search: string, limit: number) {
  const [courses, cohorts, widgets, tags, audience] = await Promise.all([
    searchOrgCourses(orgId, search, limit),
    searchOrgCohorts(orgId, search, limit),
    searchOrgWidgets(orgId, search, limit),
    searchOrgTagsAndGroups(orgId, search, limit),
    searchOrgAudience(orgId, search, limit)
  ]);

  return {
    courses,
    cohorts,
    widgets,
    tags,
    audience
  };
}

export async function searchLmsOrganization(orgId: string, profileId: string, search: string, limit: number) {
  const [courses, cohorts] = await Promise.all([
    searchLmsCourses(orgId, profileId, search, limit),
    searchLmsCohorts(orgId, profileId, search, limit)
  ]);

  return {
    courses,
    cohorts
  };
}
