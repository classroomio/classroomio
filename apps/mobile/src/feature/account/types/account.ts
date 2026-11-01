import type { InferRequestType, InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

export type AccountResponse = Extract<InferResponseType<ApiClient['account']['$get'], 200>, { success: true }>;

export type AccountProfile = AccountResponse['profile'];

export type AccountOrganization = AccountResponse['organizations'][number];

export type UpdateProfileInput = InferRequestType<ApiClient['account']['profile']['$put']>['json'];

export type LearningStats = { inProgress: number; completed: number; certificates: number };

export type InviteKind = 'organization' | 'link' | 'resource';
