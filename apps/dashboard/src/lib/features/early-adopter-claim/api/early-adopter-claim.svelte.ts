import { appInitApi } from '$features/app/init.svelte';
import { snackbar } from '$features/ui/snackbar/store';
import { BaseApi, classroomio } from '$lib/utils/services/api';
import { clearStoredClaimToken, getTerminalClaimErrorKey, readStoredClaimToken } from '../utils/claim-utils';
import type { ClaimEarlyAdopterPlanRequest, EarlyAdopterClaimStatus } from '../utils/types';

class EarlyAdopterClaimApi extends BaseApi {
  status = $state<EarlyAdopterClaimStatus>('idle');
  private attemptedOrgId: string | null = null;

  /**
   * Marks the claim as pending when a token is waiting, so dialogs can hold back until the claim resolves.
   */
  hydrate() {
    if (this.status === 'idle' && readStoredClaimToken()) {
      this.status = 'pending';
    }
  }

  acknowledge() {
    if (this.status === 'claimed') {
      this.status = 'idle';
    }
  }

  async claimStoredToken(orgId: string) {
    const token = readStoredClaimToken();

    if (!token || this.attemptedOrgId === orgId) return;

    this.attemptedOrgId = orgId;
    this.status = 'pending';

    await this.execute<ClaimEarlyAdopterPlanRequest>({
      requestFn: () => classroomio.organization.plan.claim.$post({ json: { token } }),
      logContext: 'claiming early adopter plan',
      onSuccess: async () => {
        clearStoredClaimToken();
        await appInitApi.refreshAccountData();
        this.status = 'claimed';
      },
      onError: (result) => {
        this.status = 'failed';

        if (typeof result === 'string' || !('code' in result)) return;

        const terminalKey = getTerminalClaimErrorKey(result.code);

        if (!terminalKey) return;

        clearStoredClaimToken();
        snackbar.error(terminalKey);
      }
    });

    if (this.status === 'pending') {
      this.status = 'failed';
    }
  }
}

export const earlyAdopterClaimApi = new EarlyAdopterClaimApi();
