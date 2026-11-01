import { useQuery } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useCohortKeys } from '@/feature/cohort/helpers/use-cohort-keys';
import type { CohortGoal } from '@/feature/cohort/types/cohort';

export function useCohortQuery(cohortId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useQuery({
    ...snapshotQueryOptions(keys.cohort, async () => {
      const response = await request(api.cohort[':cohortId'].$get({ param: { cohortId } }));

      return response.data;
    }),
    enabled: keys.enabled
  });
}

export function useCohortCoursesQuery(cohortId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useQuery({
    ...snapshotQueryOptions(keys.courses, async () => {
      const response = await request(api.cohort[':cohortId'].courses.$get({ param: { cohortId } }));

      return response.data;
    }),
    enabled: keys.enabled
  });
}

/** Everyone in the cohort, learners and staff, as counted by the roster. */
export function useCohortPeopleCountQuery(cohortId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useQuery({
    ...snapshotQueryOptions(keys.peopleCount, async () => {
      const response = await request(
        api.cohort[':cohortId'].people.$get({ param: { cohortId }, query: { limit: '1' } })
      );

      return response.pagination.total;
    }),
    enabled: keys.enabled
  });
}

/** The learner's goal assignments in one cohort, with their due dates and progress. */
export function useCohortGoalsQuery(cohortId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useQuery({
    ...snapshotQueryOptions(keys.myGoals, async () => {
      const response = await request(api.cohort.my.goals.$get());

      return response.data;
    }),
    select: (goals: CohortGoal[]) => goals.filter((goal) => goal.cohortId === cohortId),
    enabled: keys.enabled
  });
}

/** The signed-in user's membership id in the cohort, which the newsfeed records reactions under. */
export function useCohortMemberIdQuery(cohortId: string) {
  const api = useApi();
  const keys = useCohortKeys(cohortId);

  return useQuery({
    ...snapshotQueryOptions(keys.members, async () => {
      const response = await request(api.cohort[':cohortId'].members.$get({ param: { cohortId } }));

      return response.data.find((member) => member.profileId === keys.userId)?.id ?? null;
    }),
    enabled: keys.enabled
  });
}
