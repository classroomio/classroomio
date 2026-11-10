import type {
  GetZapierOverviewRequest,
  RedeliverZapierTriggersRequest,
  RevokeConnectedAppRequest,
  ZapierOverview
} from '$features/automation/utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

class ZapierApi extends BaseApiWithErrors {
  overview = $state<ZapierOverview | null>(null);
  private loadRequestSeq = 0;
  private loadInFlight: Promise<unknown> | null = null;

  async load() {
    const requestSeq = ++this.loadRequestSeq;

    return this.execute<GetZapierOverviewRequest>({
      requestFn: () => classroomio.organization.automation.zapier.$get(),
      logContext: 'loading Zapier connections',
      onSuccess: (response) => {
        if (requestSeq !== this.loadRequestSeq) return;

        this.overview = response.data;
      },
      onError: () => {
        if (requestSeq !== this.loadRequestSeq) return;

        this.overview = null;
      }
    });
  }

  /** Loads the overview, deduplicating concurrent requests. Always revalidates so admins returning from Zapier see new connections. */
  async loadOnce() {
    if (this.loadInFlight) return this.loadInFlight;

    this.loadInFlight = this.load().finally(() => {
      this.loadInFlight = null;
    });

    return this.loadInFlight;
  }

  /**
   * Requeues failed events from the last 24 hours for the given triggers in one
   * request, then reloads the overview.
   */
  async redeliverFailed(triggerIds: string[]) {
    if (triggerIds.length === 0) return;

    let redelivered = 0;
    let hasFailed = false;

    await this.execute<RedeliverZapierTriggersRequest>({
      requestFn: () =>
        classroomio.organization.automation.zapier.triggers.redeliver.$post({
          json: { triggerIds }
        }),
      logContext: 'redelivering Zapier trigger events',
      onSuccess: (response) => {
        redelivered = response.data.redelivered;
        hasFailed = response.data.failed.length > 0;
      },
      onError: () => {
        hasFailed = true;
      }
    });

    if (hasFailed) {
      snackbar.error('snackbar.zapier.redeliver_failed');
    } else {
      snackbar.success(t.get('snackbar.zapier.redelivered', { count: redelivered }));
    }

    await this.load();
  }

  async removeConnection(consentId: string) {
    return this.execute<RevokeConnectedAppRequest>({
      requestFn: () =>
        classroomio.organization.automation['connected-apps'][':consentId'].$delete({ param: { consentId } }),
      logContext: 'removing Zapier connection',
      onSuccess: () => {
        if (!this.overview) return;

        const removed = this.overview.connections.find((connection) => connection.consentId === consentId);

        this.overview.connections = this.overview.connections.filter(
          (connection) => connection.consentId !== consentId
        );
        this.overview.limits.activeTriggerSubscriptions -= removed?.triggers.length ?? 0;
        snackbar.success('snackbar.zapier.removed');
      },
      onError: () => {
        snackbar.error('snackbar.zapier.remove_failed');
      }
    });
  }

  resetOrganizationState() {
    this.loadRequestSeq += 1;
    this.loadInFlight = null;
    this.overview = null;
  }
}

export const zapierApi = new ZapierApi();
