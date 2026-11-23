import { useMutation, useQueryClient } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import type { CourseUpdateInput } from '@/feature/staff/types/staff';
import { teachKeys, useTeachScope } from '@/feature/teach/api/teach-scope';

import { staffKeys } from './staff-keys';

export type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

/** Uploads an image to the org's media storage and returns its public URL. */
export function useUploadImageMutation() {
  const api = useApi();

  return useMutation({
    mutationFn: async (image: PickedImage) => {
      const form = new FormData();
      const type = image.mimeType ?? 'image/jpeg';
      const name = image.fileName ?? `course-image.${type.split('/')[1] ?? 'jpg'}`;
      // React Native's FormData takes a { uri, name, type } descriptor in place of a Blob.
      form.append('file', { uri: image.uri, name, type } as unknown as Blob);

      const response = await request(api.media.image.$post(undefined, { init: { body: form } }));

      return response.url;
    }
  });
}

export function useUpdateCourseMutation(courseId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();

  return useMutation({
    mutationFn: async (json: CourseUpdateInput) =>
      (await request(api.course[':courseId'].$put({ param: { courseId }, json }))).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: teachKeys.course(userId, orgId, courseId) }),
        queryClient.invalidateQueries({ queryKey: teachKeys.courses(userId, orgId) }),
        queryClient.invalidateQueries({ queryKey: staffKeys.health(userId, orgId) })
      ])
  });
}
