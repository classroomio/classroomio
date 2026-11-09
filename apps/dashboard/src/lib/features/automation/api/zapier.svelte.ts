import type {
  GetZapierOverviewRequest,
  RedeliverZapierTriggerRequest,
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

  /** Loads the overview at most once at a time, for surfaces that only need the connection list. */
  async loadOnce() {
    if (this.overview) return;
    if (this.loadInFlight) return this.loadInFlight;

    this.loadInFlight = this.load().finally(() => {
      this.loadInFlight = null;
    });

    return this.loadInFlight;
  }

  async redeliverFailed(triggerId: string) {
    return this.execute<RedeliverZapierTriggerRequest>({
      requestFn: () =>
        classroomio.organization.automation.zapier.triggers[':triggerId'].redeliver.$post({
          param: { triggerId }
        }),
      logContext: 'redelivering Zapier trigger events',
      onSuccess: (response) => {
        snackbar.success(t.get('snackbar.zapier.redelivered', { count: response.data.redelivered }));
        void this.load();
      },
      onError: () => {
        snackbar.error('snackbar.zapier.redeliver_failed');
      }
    });
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
