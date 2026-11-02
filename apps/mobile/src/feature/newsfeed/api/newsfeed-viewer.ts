import { useQuery } from '@tanstack/react-query';

import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { useNewsfeedKeys } from '@/feature/newsfeed/helpers/use-newsfeed-keys';
import type { NewsfeedViewer } from '@/feature/newsfeed/types/newsfeed';

/** The signed-in user's group member id in the course, which reactions are keyed by, and whether they can moderate. */
export function useNewsfeedViewerQuery(courseId: string) {
  const api = useApi();
  const keys = useNewsfeedKeys(courseId);

  return useQuery({
    queryKey: keys.viewer,
    queryFn: async () => {
      const response = await request(api.course[':courseId']['newsfeed-viewer'].$get({ param: { courseId } }));
      writeQuerySnapshot(keys.viewer, response.data);

      return response.data;
    },
    initialData: () => readQuerySnapshot<NewsfeedViewer>(keys.viewer),
    initialDataUpdatedAt: 0,
    enabled: keys.enabled,
    staleTime: 10 * 60 * 1000
  });
}
