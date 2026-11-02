import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions } from '@/feature/common/helpers/query-snapshot';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';
import { useServer } from '@/feature/server/components/server-provider';

/** Signed master playlist URL for an uploaded HLS video; refreshed well before the token expires. */
export function useHlsPlaybackUrlQuery(assetId: string | null) {
  const api = useApi();
  const { serverUrl } = useServer();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    queryKey: ['media', 'hls-playback', userId, orgId, assetId],
    queryFn: async () => {
      const response = await request(api.hls[':assetId']['playback-token'].$get({ param: { assetId: assetId! } }));

      return { uri: new URL(response.data.url, serverUrl).toString(), expiresIn: response.data.expiresIn };
    },
    enabled: Boolean(userId && orgId && assetId),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
}

export const transcriptQueryKey = (userId: string | null, orgId: string | null, assetId: string | null) =>
  ['media', 'transcript', userId, orgId, assetId] as const;

export function useTranscriptQuery(assetId: string | null) {
  const api = useApi();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return useQuery({
    ...snapshotQueryOptions(transcriptQueryKey(userId, orgId, assetId), async () => {
      const response = await request(
        api.organization.assets[':assetId'].transcript.$get({ param: { assetId: assetId! } })
      );

      return response.data;
    }),
    enabled: Boolean(userId && orgId && assetId),
    staleTime: 10 * 60 * 1000
  });
}
