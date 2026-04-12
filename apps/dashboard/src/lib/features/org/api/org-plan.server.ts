import type { TCancelOrgPlan, TCreateOrgPlan, TUpdateOrgPlan } from '@cio/utils/validation/organization';

import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';

type CreateOrgPlanRequest = typeof classroomio.organization.plan.$post;
type CreateOrgPlanSuccess = Extract<InferResponseType<CreateOrgPlanRequest>, { success: true }>;
type UpdateOrgPlanRequest = typeof classroomio.organization.plan.$put;
type UpdateOrgPlanSuccess = Extract<InferResponseType<UpdateOrgPlanRequest>, { success: true }>;
type CancelOrgPlanRequest = typeof classroomio.organization.plan.cancel.$post;
type CancelOrgPlanSuccess = Extract<InferResponseType<CancelOrgPlanRequest>, { success: true }>;

/**
 * Server-side API methods for organization plan operations
 * These methods use API key authentication and should only be used in server-side files
 * (+server.ts, +layout.server.ts) to prevent API keys from being exposed to the client.
 */
export class OrgPlanApiServer {
  /**
   * Creates a new organization plan (server-side)
   * @param params Organization plan creation parameters
   * @returns Response data or null on error
   */
  static async createOrgPlan(params: TCreateOrgPlan) {
    const result = await safeServerApi<CreateOrgPlanSuccess>(() =>
      classroomio.organization.plan.$post(
        {
          json: params
        },
        getApiKeyHeaders()
      )
    );

    if (!result.ok) {
      console.error('Error creating org plan (server):', result);
      return null;
    }

    return result.body.data;
  }

  /**
   * Updates an organization plan (server-side)
   * @param params Update parameters (subscriptionId, payload)
   * @returns Response data or null on error
   */
  static async updateOrgPlan(params: TUpdateOrgPlan) {
    const result = await safeServerApi<UpdateOrgPlanSuccess>(() =>
      classroomio.organization.plan.$put(
        {
          json: params
        },
        getApiKeyHeaders()
      )
    );

    if (!result.ok) {
      console.error('Error updating org plan (server):', result);
      return null;
    }

    return result.body.data;
  }

  /**
   * Cancels an organization plan (server-side)
   * @param params Cancel parameters (subscriptionId, payload)
   * @returns Response data or null on error
   */
  static async cancelOrgPlan(params: TCancelOrgPlan) {
    const result = await safeServerApi<CancelOrgPlanSuccess>(() =>
      classroomio.organization.plan.cancel.$post(
        {
          json: params
        },
        getApiKeyHeaders()
      )
    );

    if (!result.ok) {
      console.error('Error canceling org plan (server):', result);
      return null;
    }

    return result.body.data;
  }
}
