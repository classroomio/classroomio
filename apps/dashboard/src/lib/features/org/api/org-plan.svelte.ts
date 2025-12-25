import { BaseApi, classroomio } from '$lib/utils/services/api';
import type { TCancelOrgPlan, TCreateOrgPlan, TUpdateOrgPlan } from '@cio/utils/validation/organization';

/**
 * API class for organization plan operations (client-side)
 * For server-side operations, use OrgPlanApiServer from './org-plan.server.ts'
 */
class OrgPlanApi extends BaseApi {
  /**
   * Creates a new organization plan
   * @param params Organization plan creation parameters
   * @returns Created organization plan
   */
  async createOrgPlan(params: TCreateOrgPlan) {
    return this.execute({
      requestFn: () => classroomio.organization.plan.$post({ json: params }),
      logContext: 'creating organization plan'
    });
  }

  /**
   * Updates an organization plan
   * @param params Update parameters (subscriptionId, payload)
   * @returns Updated organization plan
   */
  async updateOrgPlan(params: TUpdateOrgPlan) {
    return this.execute({
      requestFn: () => classroomio.organization.plan.$put({ json: params }),
      logContext: 'updating organization plan'
    });
  }

  /**
   * Cancels an organization plan
   * @param params Cancel parameters (subscriptionId, payload)
   * @returns Updated organization plan
   */
  async cancelOrgPlan(params: TCancelOrgPlan) {
    return this.execute({
      requestFn: () => classroomio.organization.plan.cancel.$post({ json: params }),
      logContext: 'canceling organization plan'
    });
  }
}

export const orgPlanApi = new OrgPlanApi();
