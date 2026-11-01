export const cohortsQueryKey = (userId: string | null, orgId: string | null) =>
  ['cohorts', 'mine', userId, orgId] as const;

export const cohortQueryKey = (userId: string | null, orgId: string | null, cohortId: string) =>
  ['cohorts', 'detail', userId, orgId, cohortId] as const;

export const cohortCoursesQueryKey = (userId: string | null, orgId: string | null, cohortId: string) =>
  ['cohorts', 'courses', userId, orgId, cohortId] as const;

export const cohortPeopleCountQueryKey = (userId: string | null, orgId: string | null, cohortId: string) =>
  ['cohorts', 'people-count', userId, orgId, cohortId] as const;

export const cohortMembersQueryKey = (userId: string | null, orgId: string | null, cohortId: string) =>
  ['cohorts', 'members', userId, orgId, cohortId] as const;

export const myCohortGoalsQueryKey = (userId: string | null, orgId: string | null) =>
  ['cohorts', 'my-goals', userId, orgId] as const;

export const cohortPostsQueryKey = (userId: string | null, orgId: string | null, cohortId: string) =>
  ['cohorts', 'posts', userId, orgId, cohortId] as const;

export const cohortCommentsQueryKey = (userId: string | null, orgId: string | null, cohortId: string, postId: string) =>
  ['cohorts', 'comments', userId, orgId, cohortId, postId] as const;
