import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type SsoDiscoveryResponse = Extract<InferResponseType<ApiClient['sso']['discover']['$get'], 200>, { success: true }>;

export type SsoDiscovery = SsoDiscoveryResponse['data'];
