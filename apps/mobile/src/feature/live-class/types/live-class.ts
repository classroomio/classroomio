import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type LiveClassesResponse = Extract<
  InferResponseType<ApiClient['account']['live-classes']['$get'], 200>,
  { success: true }
>;

export type LiveClass = LiveClassesResponse['data'][number];
