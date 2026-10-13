import { WEBHOOK_DEFAULT_EVENT_TYPES, WEBHOOK_EVENT_TYPES } from '@cio/utils/constants/webhook';
import type { BadgeVariant } from '@cio/ui/base/badge';

import type { Webhook, WebhookDeliveryStatus, WebhookFormFields, WebhookHealth } from './types';

export const WEBHOOK_DELIVERIES_PAGE_SIZE = 10;

export const WEBHOOK_EVENT_GROUPS = [
  { key: 'organization', eventTypes: WEBHOOK_EVENT_TYPES.filter((type) => type.startsWith('organization.')) },
  { key: 'course', eventTypes: WEBHOOK_EVENT_TYPES.filter((type) => type.startsWith('course.')) },
  {
    key: 'learning',
    eventTypes: WEBHOOK_EVENT_TYPES.filter((type) => type.startsWith('lesson.') || type.startsWith('exercise.'))
  }
] as const;

export const WEBHOOK_DELIVERY_STATUS_BADGE: Record<WebhookDeliveryStatus, BadgeVariant> = {
  PENDING: 'secondary',
  SUCCESS: 'success',
  FAILED: 'destructive',
  GAVE_UP: 'destructive'
};

export const WEBHOOK_HEALTH_BADGE: Record<WebhookHealth, BadgeVariant> = {
  healthy: 'success',
  degraded: 'warning',
  disabled: 'destructive'
};

export function toWebhookEventTranslationKey(eventType: string): string {
  return eventType.replaceAll('.', '_');
}

export function getDefaultWebhookFormFields(): WebhookFormFields {
  return {
    name: '',
    payloadUrl: '',
    secret: '',
    verifySsl: true,
    eventMode: 'selected',
    eventTypes: [...WEBHOOK_DEFAULT_EVENT_TYPES],
    isActive: true
  };
}

export function toWebhookFormFields(webhook: Webhook): WebhookFormFields {
  return {
    name: webhook.name,
    payloadUrl: webhook.payloadUrl,
    secret: '',
    verifySsl: webhook.verifySsl,
    eventMode: webhook.eventMode,
    eventTypes: webhook.eventMode === 'all' ? [...WEBHOOK_DEFAULT_EVENT_TYPES] : [...webhook.eventTypes],
    isActive: webhook.isActive
  };
}

export function getWebhookEventsLabelCount(webhook: Webhook): number {
  return webhook.eventMode === 'all' ? WEBHOOK_EVENT_TYPES.length : webhook.eventTypes.length;
}

export function getWebhookEventsCountKey(webhook: Webhook): string {
  return getWebhookEventsLabelCount(webhook) === 1
    ? 'automation.webhooks.events_count_one'
    : 'automation.webhooks.events_count_other';
}

export function formatWebhookTimestamp(value: string | null | undefined): string {
  if (!value) return '';

  return new Date(value).toLocaleString();
}
