import {
  searchLmsCohorts,
  searchLmsCourses,
  searchLmsLearningPaths,
  searchOrgAudience,
  searchOrgCohorts,
  searchOrgCourses,
  searchOrgLearningPaths,
  searchOrgTagsAndGroups,
  searchOrgWidgets
} from '@cio/db/queries';

export async function searchOrganization(orgId: string, search: string, limit: number, includeAudience: boolean) {
  const audiencePromise = includeAudience ? searchOrgAudience(orgId, search, limit) : Promise.resolve([]);
  const [courses, cohorts, paths, widgets, tags, audience] = await Promise.all([
    searchOrgCourses(orgId, search, limit),
    searchOrgCohorts(orgId, search, limit),
    searchOrgLearningPaths(orgId, search, limit),
    searchOrgWidgets(orgId, search, limit),
    searchOrgTagsAndGroups(orgId, search, limit),
    audiencePromise
  ]);

  return {
    courses,
    cohorts,
    paths,
    widgets,
    tags,
    audience
  };
}

export async function searchLmsOrganization(orgId: string, profileId: string, search: string, limit: number) {
  const [courses, cohorts, paths] = await Promise.all([
    searchLmsCourses(orgId, profileId, search, limit),
    searchLmsCohorts(orgId, profileId, search, limit),
    searchLmsLearningPaths(orgId, profileId, search, limit)
  ]);

  return {
    courses,
    cohorts,
    paths
  };
}
