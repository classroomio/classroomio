import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type CheckInResponse = Extract<InferResponseType<ApiClient['account']['check-in']['$post'], 200>, { success: true }>;

export type CheckInResult = CheckInResponse['data'];
