import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { WEBHOOK_API_VERSION, WEBHOOK_EVENT_TYPES } from '@cio/utils/constants/webhook';
import { ZWebhookEventData } from '@cio/utils/validation/webhook';

const docs = readFileSync(
  fileURLToPath(new URL('../../../docs/content/docs/developers/webhooks.mdx', import.meta.url)),
  'utf8'
);

const ZDocumentedEnvelope = z
  .object({
    id: z.string().regex(/^evt_[0-9a-f]{32}$/),
    type: z.string(),
    createdAt: z.string().datetime(),
    apiVersion: z.literal(WEBHOOK_API_VERSION),
    organization: z.object({ id: z.string(), name: z.string().nullable(), siteName: z.string().nullable() }).strict(),
    data: z.record(z.string(), z.unknown())
  })
  .strict();

function extractExample(eventType: string): unknown {
  const sectionStart = docs.indexOf(`#### \`${eventType}\``);

  if (sectionStart === -1) return undefined;

  const fenceStart = docs.indexOf('```json', sectionStart);
  const bodyStart = docs.indexOf('\n', fenceStart) + 1;
  const bodyEnd = docs.indexOf('```', bodyStart);

  return JSON.parse(docs.slice(bodyStart, bodyEnd));
}

describe('webhook event contract', () => {
  it('defines a data schema for every event type and nothing else', () => {
    expect(Object.keys(ZWebhookEventData).sort()).toEqual([...WEBHOOK_EVENT_TYPES].sort());
  });

  it.each([...WEBHOOK_EVENT_TYPES])('documents %s with an example that matches its schema', (eventType) => {
    const example = extractExample(eventType);

    expect(example, `${eventType} is missing from the event reference`).toBeDefined();

    const envelope = ZDocumentedEnvelope.parse(example);

    expect(envelope.type).toBe(eventType);
    expect(() => ZWebhookEventData[eventType].parse(envelope.data)).not.toThrow();
  });
});
