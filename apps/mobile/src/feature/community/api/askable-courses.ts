import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { communityCatalog } from '@/feature/community/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import type { CourseOption } from '@/feature/community/types/community';

/** Courses the user can ask in: the team's courses for tutors and admins, enrolled courses for students. */
export function useAskableCoursesQuery() {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const { isStaff } = useActiveOrg();
  const t = useTranslations(communityCatalog);

  return useQuery({
    queryKey: ['community', 'askable-courses', userId, orgId, isStaff],
    queryFn: async () => {
      if (isStaff) {
        const response = await request(api.organization.courses.$get({ query: { limit: '100' } }));

        return response.data.map((course) => ({ id: course.id, title: course.title }));
      }

      const response = await request(api.organization.courses.enrolled.$get());

      return response.data.map((course) => ({ id: course.id, title: course.title }));
    },
    select: (courses): CourseOption[] =>
      courses.map((course) => ({ id: course.id, title: course.title ?? t('untitledCourse') })),
    enabled: Boolean(userId && orgId),
    staleTime: 5 * 60 * 1000
  });
}
