import { ZCreateWebhook, ZUpdateWebhook } from '@cio/utils/validation/webhook';

import type {
  CreateWebhookRequest,
  DeleteWebhookRequest,
  GetWebhookDeliveryRequest,
  ListWebhookDeliveriesRequest,
  ListWebhooksRequest,
  RedeliverWebhookRequest,
  RegenerateWebhookSecretRequest,
  SendTestWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
  WebhookDeliveryDetail,
  WebhookDeliveryPagination,
  WebhookDeliveryStatus,
  WebhookDeliverySummary,
  WebhookFormFields
} from '$features/automation/utils/types';
import { WEBHOOK_DELIVERIES_PAGE_SIZE } from '$features/automation/utils/webhook-utils';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';

import { snackbar } from '$features/ui/snackbar/store';

function toRequestBody(fields: WebhookFormFields) {
  return {
    name: fields.name,
    payloadUrl: fields.payloadUrl,
    ...(fields.secret.trim() ? { secret: fields.secret.trim() } : {}),
    verifySsl: fields.verifySsl,
    eventMode: fields.eventMode,
    eventTypes: fields.eventMode === 'all' ? [] : fields.eventTypes,
    isActive: fields.isActive
  };
}

class WebhookApi extends BaseApiWithErrors {
  webhooks = $state<Webhook[] | null>(null);
  revealedSecret = $state<string | null>(null);
  deliveries = $state<WebhookDeliverySummary[] | null>(null);
  deliveryPagination = $state<WebhookDeliveryPagination | null>(null);
  selectedDelivery = $state<WebhookDeliveryDetail | null>(null);
  isDeliveryLoading = $state(false);
  isTesting = $state(false);
  private deliveriesRequestSeq = 0;

  async list() {
    return this.execute<ListWebhooksRequest>({
      requestFn: () => classroomio.organization.webhooks.$get(),
      logContext: 'listing webhooks',
      onSuccess: (response) => {
        this.webhooks = response.data;
      },
      onError: () => {
        this.webhooks ??= [];
      }
    });
  }

  async create(fields: WebhookFormFields) {
    const body = toRequestBody(fields);
    const validation = ZCreateWebhook.safeParse(body);

    if (!validation.success) {
      this.errors = mapZodErrorsToTranslations(validation.error);
      return;
    }

    return this.execute<CreateWebhookRequest>({
      requestFn: () => classroomio.organization.webhooks.$post({ json: validation.data }),
      logContext: 'creating webhook',
      onSuccess: (response) => {
        this.webhooks = [response.data.webhook, ...(this.webhooks ?? [])];
        this.revealedSecret = response.data.secret;
        snackbar.success('snackbar.webhooks.created');
      },
      onError: (result) => this.applyServerError(result)
    });
  }

  async update(webhookId: string, fields: WebhookFormFields) {
    const body = toRequestBody(fields);
    const validation = ZUpdateWebhook.safeParse(body);

    if (!validation.success) {
      this.errors = mapZodErrorsToTranslations(validation.error);
      return;
    }

    return this.execute<UpdateWebhookRequest>({
      requestFn: () =>
        classroomio.organization.webhooks[':webhookId'].$put({ param: { webhookId }, json: validation.data }),
      logContext: 'updating webhook',
      onSuccess: (response) => {
        this.replaceWebhook(response.data);
        snackbar.success('snackbar.webhooks.updated');
      },
      onError: (result) => this.applyServerError(result)
    });
  }

  async setActive(webhookId: string, isActive: boolean) {
    return this.execute<UpdateWebhookRequest>({
      requestFn: () =>
        classroomio.organization.webhooks[':webhookId'].$put({ param: { webhookId }, json: { isActive } }),
      logContext: 'toggling webhook',
      onSuccess: (response) => {
        this.replaceWebhook(response.data);
        snackbar.success(isActive ? 'snackbar.webhooks.enabled' : 'snackbar.webhooks.disabled');
      }
    });
  }

  async remove(webhookId: string) {
    return this.execute<DeleteWebhookRequest>({
      requestFn: () => classroomio.organization.webhooks[':webhookId'].$delete({ param: { webhookId } }),
      logContext: 'deleting webhook',
      onSuccess: () => {
        this.webhooks = (this.webhooks ?? []).filter((webhook) => webhook.id !== webhookId);
        snackbar.success('snackbar.webhooks.deleted');
      }
    });
  }

  async regenerateSecret(webhookId: string) {
    return this.execute<RegenerateWebhookSecretRequest>({
      requestFn: () => classroomio.organization.webhooks[':webhookId'].secret.$post({ param: { webhookId } }),
      logContext: 'regenerating webhook secret',
      onSuccess: (response) => {
        this.replaceWebhook(response.data.webhook);
        this.revealedSecret = response.data.secret;
        snackbar.success('snackbar.webhooks.secret_regenerated');
      }
    });
  }

  async sendTest(webhookId: string) {
    this.isTesting = true;

    const result = await this.execute<SendTestWebhookRequest>({
      requestFn: () => classroomio.organization.webhooks[':webhookId'].test.$post({ param: { webhookId } }),
      logContext: 'sending test webhook',
      onSuccess: (response) => {
        snackbar[response.data.status === 'SUCCESS' ? 'success' : 'error'](
          response.data.status === 'SUCCESS' ? 'snackbar.webhooks.test_success' : 'snackbar.webhooks.test_failed'
        );
      }
    });

    this.isTesting = false;

    return result;
  }

  async listDeliveries(webhookId: string, options: { status?: WebhookDeliveryStatus; page?: number } = {}) {
    const requestSeq = ++this.deliveriesRequestSeq;

    await this.execute<ListWebhookDeliveriesRequest>({
      requestFn: () =>
        classroomio.organization.webhooks[':webhookId'].deliveries.$get({
          param: { webhookId },
          query: {
            page: String(options.page ?? 1),
            limit: String(WEBHOOK_DELIVERIES_PAGE_SIZE),
            ...(options.status ? { status: options.status } : {})
          }
        }),
      logContext: 'listing webhook deliveries',
      onSuccess: (response) => {
        if (requestSeq !== this.deliveriesRequestSeq) return;

        this.deliveries = response.data;
        this.deliveryPagination = response.pagination;
      },
      onError: () => {
        if (requestSeq !== this.deliveriesRequestSeq) return;

        this.deliveries ??= [];
        snackbar.error('automation.webhooks.deliveries.load_error');
      }
    });
  }

  async loadDelivery(webhookId: string, deliveryId: string) {
    this.isDeliveryLoading = true;

    await this.execute<GetWebhookDeliveryRequest>({
      requestFn: () =>
        classroomio.organization.webhooks[':webhookId'].deliveries[':deliveryId'].$get({
          param: { webhookId, deliveryId }
        }),
      logContext: 'loading webhook delivery',
      onSuccess: (response) => {
        this.selectedDelivery = response.data;
      }
    });

    this.isDeliveryLoading = false;
  }

  async redeliver(webhookId: string, deliveryId: string) {
    return this.execute<RedeliverWebhookRequest>({
      requestFn: () =>
        classroomio.organization.webhooks[':webhookId'].deliveries[':deliveryId'].redeliver.$post({
          param: { webhookId, deliveryId }
        }),
      logContext: 'redelivering webhook event',
      onSuccess: () => {
        snackbar.success('snackbar.webhooks.redelivered');
      }
    });
  }

  clearRevealedSecret() {
    this.revealedSecret = null;
  }

  clearDeliveries() {
    this.deliveriesRequestSeq += 1;
    this.deliveries = null;
    this.deliveryPagination = null;
    this.selectedDelivery = null;
  }

  private replaceWebhook(updated: Webhook) {
    this.webhooks = (this.webhooks ?? []).map((webhook) => (webhook.id === updated.id ? updated : webhook));
  }

  private applyServerError(result: Parameters<BaseApiWithErrors['handleValidationError']>[0] | string) {
    if (typeof result === 'string') return;

    this.handleValidationError(result);

    if ('field' in result && result.field) {
      this.errors[result.field] = result.error;
    }
  }
}

export const webhookApi = new WebhookApi();
