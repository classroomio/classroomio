import type { TCancelOrgPlan, TCreateOrgPlan, TUpdateOrgPlan } from '@cio/utils/validation/organization';

import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

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
    try {
      const response = await classroomio.organization.plan.$post(
        {
          json: params
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating org plan (server):', error);
      return null;
    }
  }

  /**
   * Updates an organization plan (server-side)
   * @param params Update parameters (subscriptionId, payload)
   * @returns Response data or null on error
   */
  static async updateOrgPlan(params: TUpdateOrgPlan) {
    try {
      const response = await classroomio.organization.plan.$put(
        {
          json: params
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error updating org plan (server):', error);
      return null;
    }
  }

  /**
   * Cancels an organization plan (server-side)
   * @param params Cancel parameters (subscriptionId, payload)
   * @returns Response data or null on error
   */
  static async cancelOrgPlan(params: TCancelOrgPlan) {
    try {
      const response = await classroomio.organization.plan.cancel.$post(
        {
          json: params
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error canceling org plan (server):', error);
      return null;
    }
  }
}
