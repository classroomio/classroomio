import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ROLE } from '@cio/utils/constants/roles';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { InvitePreset } from '@/feature/staff/types/staff';
import { teachKeys, useTeachScope } from '@/feature/teach/api/teach-scope';

import { staffKeys } from './staff-keys';

const PAGE_SIZE = 20;

export function useCourseStudentsQuery(courseId: string, search: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useInfiniteQuery({
    queryKey: staffKeys.members(userId, orgId, courseId, search),
    queryFn: async ({ pageParam }) => {
      const base = {
        roleId: String(ROLE.STUDENT),
        page: String(pageParam),
        limit: String(PAGE_SIZE),
        sortBy: 'name' as const
      };
      const query = search ? { ...base, search } : base;

      return request(api.course[':courseId'].members.$get({ param: { courseId }, query }));
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled: enabled && Boolean(courseId)
  });
}

function useInvalidateCoursePeople(courseId: string) {
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: staffKeys.membersAll(userId, orgId, courseId) }),
      queryClient.invalidateQueries({ queryKey: teachKeys.courses(userId, orgId) }),
      queryClient.invalidateQueries({ queryKey: teachKeys.course(userId, orgId, courseId) }),
      queryClient.invalidateQueries({ queryKey: staffKeys.learnersAll(userId, orgId) }),
      queryClient.invalidateQueries({ queryKey: staffKeys.capacity(userId, orgId) })
    ]);
}

export function useRemoveCourseMemberMutation(courseId: string) {
  const api = useApi();
  const invalidate = useInvalidateCoursePeople(courseId);

  return useMutation({
    mutationFn: async (memberId: string) =>
      (await request(api.course[':courseId'].members[':memberId'].$delete({ param: { courseId, memberId } }))).data,
    onSuccess: () => invalidate()
  });
}

export function useInviteByEmailMutation(courseId: string) {
  const api = useApi();
  const invalidate = useInvalidateCoursePeople(courseId);

  return useMutation({
    mutationFn: async ({ emails, preset }: { emails: string[]; preset: InvitePreset }) =>
      (
        await request(
          api.course[':courseId'].invites.$post({
            param: { courseId },
            json: { recipientEmails: emails, preset, sendEmail: true }
          })
        )
      ).data,
    onSuccess: () => invalidate()
  });
}

/** The course's shareable join link, created on first request. */
export function useCourseInviteLinkQuery(courseId: string) {
  const api = useApi();
  const { userId, orgId, enabled } = useTeachScope();

  return useQuery({
    queryKey: staffKeys.inviteLink(userId, orgId, courseId),
    queryFn: async () => (await request(api.course[':courseId'].invites.link.$post({ param: { courseId } }))).data,
    enabled: enabled && Boolean(courseId),
    staleTime: Infinity
  });
}
