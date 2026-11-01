import type { ApiClient } from '@/feature/common/api/api-client';
import { request } from '@/feature/common/api/request';

export async function fetchOfflineManifest(api: ApiClient, courseId: string, lessonId?: string) {
  const response = await request(
    api.course[':courseId']['offline-manifest'].$get({ param: { courseId }, query: lessonId ? { lessonId } : {} })
  );

  return response.data;
}

export async function fetchCourseDetail(api: ApiClient, courseId: string) {
  const response = await request(api.course[':courseId'].$get({ param: { courseId }, query: {} }));

  return response.data;
}
