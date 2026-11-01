import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type HomeDigestResponse = Extract<
  InferResponseType<ApiClient['account']['home-digest']['$get'], 200>,
  { success: true }
>;

export type HomeDigest = HomeDigestResponse['data'];

export type DueSoonItem = HomeDigest['dueSoon'][number];

export type NextLiveClass = NonNullable<HomeDigest['nextLiveClass']>;
