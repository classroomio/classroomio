import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
});

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();

  return { ...actual, randomBytes: () => Buffer.alloc(24, 0xfb) };
});

import { generateWebhookSecret } from '@cio/core/services/webhook/secret';

describe('generated webhook secret format', () => {
  it('uses standard base64, not url-safe base64, even when the bytes produce + and /', () => {
    const secret = generateWebhookSecret();

    expect(secret).toMatch(/^whsec_[A-Za-z0-9+/]{32}$/);
    expect(secret).toContain('+');
    expect(secret).toContain('/');
    expect(secret.slice('whsec_'.length)).not.toMatch(/[-_]/);
  });
});
