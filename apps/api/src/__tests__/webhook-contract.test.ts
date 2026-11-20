import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { WEBHOOK_EVENT_TYPES } from '@cio/utils/constants/webhook';
import { ZWebhookEventData } from '@cio/utils/validation/webhook';

const docs = readFileSync(
  fileURLToPath(new URL('../../../docs/content/docs/developers/webhooks.mdx', import.meta.url)),
  'utf8'
);

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
    expect(() => ZWebhookEventData[eventType].parse(example)).not.toThrow();
  });
});
