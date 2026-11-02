import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type ComplianceResponse = Extract<
  InferResponseType<ApiClient['account']['compliance']['$get'], 200>,
  { success: true }
>;

export type ComplianceOverview = ComplianceResponse['data'];

export type ComplianceRequirement = ComplianceOverview['requirements'][number];

export type ComplianceStanding = ComplianceRequirement['standing'];

export type ComplianceOverallStatus = ComplianceOverview['status'];
