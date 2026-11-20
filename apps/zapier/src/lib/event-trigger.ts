import { defineInputFields, defineTrigger, type Bundle, type ZObject } from 'zapier-platform-core';
import type { TZapierTrigger } from '@cio/utils/constants/zapier';
import { buildWebhookExampleEnvelope } from '@cio/utils/validation/webhook';

import { apiUrl } from './config';
import { readString, toEventRecord, type EventEnvelope, type EventRecord } from './records';
import { throwApiErrors } from './http';
import { isValidWebhookSignature } from './signature';

type SubscribeData = { id: string; secret: string };
type InputFields = ReturnType<typeof defineInputFields>;

export type EventMatcher = (data: Record<string, unknown>, inputData: Record<string, unknown>) => boolean;
export type EventTransform = (z: ZObject, record: EventRecord) => EventRecord;

export type EventTriggerOptions = {
  trigger: TZapierTrigger;
  inputFields?: InputFields;
  matches?: EventMatcher;
  transform?: EventTransform;
};

const SAMPLE_ORGANIZATION = { id: '000000a1-0000-4000-8000-0000000000a1', name: 'Acme Academy', siteName: 'acme' };
const keepRecord: EventTransform = (_z, record) => record;
const matchesAll: EventMatcher = () => true;

function isAuthenticDelivery(bundle: Bundle): boolean {
  const subscribeData = bundle.subscribeData as SubscribeData | undefined;
  const headers = bundle.rawRequest?.headers;
  const body = bundle.rawRequest?.content;

  if (!subscribeData?.secret || !headers || body === undefined) return false;

  return isValidWebhookSignature(subscribeData.secret, headers, body);
}

export function createEventTrigger(options: EventTriggerOptions) {
  const { trigger } = options;
  const matches = options.matches ?? matchesAll;
  const transform = options.transform ?? keepRecord;
  const sample = toEventRecord(buildWebhookExampleEnvelope(trigger.eventType, SAMPLE_ORGANIZATION));

  return defineTrigger({
    key: trigger.key,
    noun: trigger.noun,
    display: { label: trigger.label, description: trigger.description },
    operation: {
      type: 'hook',
      inputFields: options.inputFields ?? [],
      performSubscribe: async (z, bundle: Bundle<Record<string, any>>) => {
        const response = await z.request({
          url: apiUrl('/webhooks/subscriptions'),
          method: 'POST',
          body: {
            targetUrl: bundle.targetUrl,
            eventType: trigger.eventType,
            courseId: readString(bundle.inputData.courseId),
            cohortId: readString(bundle.inputData.cohortId)
          }
        });
        const subscription = response.data.data as SubscribeData;

        return { id: subscription.id, secret: subscription.secret };
      },
      performUnsubscribe: async (z, bundle) => {
        const response = await z.request({
          url: apiUrl(`/webhooks/subscriptions/${bundle.subscribeData?.id}`),
          method: 'DELETE',
          skipThrowForStatus: true
        });

        if (response.status !== 404) throwApiErrors(response, z);

        return {};
      },
      perform: async (z, bundle) => {
        const envelope = bundle.cleanedRequest as EventEnvelope | undefined;

        if (!envelope || envelope.type !== trigger.eventType || !isAuthenticDelivery(bundle)) return [];
        if (!matches(envelope.data, bundle.inputData)) return [];

        return [transform(z, toEventRecord(envelope))];
      },
      performList: async (z, bundle: Bundle<Record<string, any>>) => {
        const response = await z.request({
          url: apiUrl('/webhooks/samples'),
          params: {
            eventType: trigger.eventType,
            ...(readString(bundle.inputData.courseId) ? { courseId: String(bundle.inputData.courseId) } : {}),
            ...(readString(bundle.inputData.cohortId) ? { cohortId: String(bundle.inputData.cohortId) } : {})
          }
        });
        const envelopes = response.data.data as EventEnvelope[];
        const records = envelopes
          .filter((envelope) => matches(envelope.data, bundle.inputData))
          .map((envelope) => transform(z, toEventRecord(envelope)));

        // Zapier's trigger test shows an error or an empty result when every real sample is filtered out.
        // Fall back to the static sample so field mapping can still be completed.
        return records.length > 0 ? records : [sample];
      },
      sample
    }
  });
}
