import { describe, expect, it } from 'vitest';

import { earlyAdopterReadyEmail } from '../src/emails/early-adopter-ready';
import { earlyAdopterReminderEmail } from '../src/emails/early-adopter-reminder';

const claimUrl = 'https://app.classroomio.com/claim/abc123';

describe('early adopter emails', () => {
  it('renders the claim link in the payment received email', () => {
    const html = earlyAdopterReadyEmail.template.render({ claimUrl });

    expect(html).toContain(`href="${claimUrl}"`);
    expect(html).toContain('We received your payment');
  });

  it('renders the claim link in the reminder email', () => {
    const html = earlyAdopterReminderEmail.template.render({ claimUrl });

    expect(html).toContain(`href="${claimUrl}"`);
  });

  it('rejects a claim url that is not a url', () => {
    expect(earlyAdopterReadyEmail.template.schema.safeParse({ claimUrl: 'not a url' }).success).toBe(false);
  });

  it('keeps em dashes and exclamation marks out of the copy', () => {
    const paragraphs = [
      earlyAdopterReadyEmail.template.render({ claimUrl }),
      earlyAdopterReminderEmail.template.render({ claimUrl })
    ].flatMap((html) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1]));

    expect(paragraphs.length).toBeGreaterThan(0);
    expect(paragraphs.join(' ')).not.toMatch(/[—–!]/);
  });
});
