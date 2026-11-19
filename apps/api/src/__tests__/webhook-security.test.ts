import { createHmac } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
});

import { redactSensitiveText, truncateText } from '@cio/core/services/webhook/redact';
import { decryptWebhookSecret, encryptWebhookSecret, generateWebhookSecret } from '@cio/core/services/webhook/secret';
import {
  signStandardWebhookPayload,
  signWebhookPayload,
  verifyWebhookSignature
} from '@cio/core/services/webhook/signature';
import {
  assertWebhookUrlShape,
  isPrivateAddress,
  resolveWebhookTarget,
  WebhookUrlError
} from '@cio/core/services/webhook/url-guard';

const cloudPolicy = { allowPrivateNetworks: false };
const selfHostedPolicy = { allowPrivateNetworks: true };

describe('webhook secrets', () => {
  it('round-trips an encrypted secret and never stores plaintext', () => {
    const secret = generateWebhookSecret();
    const encrypted = encryptWebhookSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(decryptWebhookSecret(encrypted)).toBe(secret);
  });

  it('produces a different ciphertext each time', () => {
    expect(encryptWebhookSecret('same-secret')).not.toBe(encryptWebhookSecret('same-secret'));
  });

  it('rejects tampered ciphertext', () => {
    const [version, iv, tag, ciphertext] = encryptWebhookSecret('top-secret').split('.');
    const flipped = `${ciphertext![0] === 'A' ? 'B' : 'A'}${ciphertext!.slice(1)}`;

    expect(() => decryptWebhookSecret([version, iv, tag, flipped].join('.'))).toThrow();
  });
});

describe('webhook signatures', () => {
  it('signs `<timestamp>.<body>` with HMAC-SHA256', () => {
    const expected = createHmac('sha256', 'secret').update('1700000000.{"a":1}').digest('hex');

    expect(signWebhookPayload('secret', 1700000000, '{"a":1}')).toBe(`sha256=${expected}`);
  });

  it('verifies a valid signature and rejects a changed body, timestamp, or secret', () => {
    const signature = signWebhookPayload('secret', 100, 'body');

    expect(verifyWebhookSignature('secret', 100, 'body', signature)).toBe(true);
    expect(verifyWebhookSignature('secret', 100, 'body!', signature)).toBe(false);
    expect(verifyWebhookSignature('secret', 101, 'body', signature)).toBe(false);
    expect(verifyWebhookSignature('other', 100, 'body', signature)).toBe(false);
  });
});

describe('standard webhooks signatures', () => {
  it('matches the published Standard Webhooks test vector', () => {
    const signature = signStandardWebhookPayload(
      'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
      'msg_p5jXN8AQM9LWM0D4loKWxJek',
      1614265330,
      '{"test": 2432232314}'
    );

    expect(signature).toBe('v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=');
  });

  it('uses a secret that is not whsec_ plus base64 as plain text', () => {
    const expected = createHmac('sha256', 'plain secret!').update('msg_1.100.body').digest('base64');

    expect(signStandardWebhookPayload('plain secret!', 'msg_1', 100, 'body')).toBe(`v1,${expected}`);
  });

  it('changes when the message id, timestamp, body or secret changes', () => {
    const secret = generateWebhookSecret();
    const signature = signStandardWebhookPayload(secret, 'msg_1', 100, 'body');

    expect(signStandardWebhookPayload(secret, 'msg_2', 100, 'body')).not.toBe(signature);
    expect(signStandardWebhookPayload(secret, 'msg_1', 101, 'body')).not.toBe(signature);
    expect(signStandardWebhookPayload(secret, 'msg_1', 100, 'body!')).not.toBe(signature);
    expect(signStandardWebhookPayload(generateWebhookSecret(), 'msg_1', 100, 'body')).not.toBe(signature);
  });
});

describe('webhook url guard', () => {
  it.each([
    ['10.0.0.1', true],
    ['127.0.0.1', true],
    ['169.254.169.254', true],
    ['172.16.5.4', true],
    ['172.32.0.1', false],
    ['192.168.1.1', true],
    ['100.64.0.1', true],
    ['8.8.8.8', false],
    ['::1', true],
    ['fd00::1', true],
    ['::ffff:127.0.0.1', true],
    ['::ffff:7f00:1', true],
    ['::ffff:a9fe:a9fe', true],
    ['::ffff:808:808', false],
    ['::7f00:1', true],
    ['64:ff9b::7f00:1', true],
    ['64:ff9b::808:808', false],
    ['2002:7f00:1::', true],
    ['fe80::1', true],
    ['ff02::1', true],
    ['::', true],
    ['2606:4700:4700::1111', false]
  ])('classifies %s as private=%s', (address, expected) => {
    expect(isPrivateAddress(address)).toBe(expected);
  });

  it.each([
    'https://localhost/hook',
    'https://app.localhost/hook',
    'https://service.internal/hook',
    'https://127.0.0.1/hook',
    'https://[::1]/hook',
    'https://[::ffff:127.0.0.1]/hook',
    'https://[::ffff:169.254.169.254]/hook',
    'https://169.254.169.254/latest/meta-data',
    'http://example.com/hook',
    'ftp://example.com/hook',
    'https://user:pass@example.com/hook',
    'not a url'
  ])('rejects %s in cloud mode', (url) => {
    expect(() => assertWebhookUrlShape(url, cloudPolicy)).toThrow(WebhookUrlError);
  });

  it('accepts a public https URL in cloud mode', () => {
    expect(assertWebhookUrlShape('https://hooks.example.com/cio', cloudPolicy).hostname).toBe('hooks.example.com');
  });

  it('allows private and http targets only when private networks are enabled', () => {
    expect(() => assertWebhookUrlShape('http://localhost:8080/hook', selfHostedPolicy)).not.toThrow();
    expect(() => assertWebhookUrlShape('http://10.0.0.5/hook', selfHostedPolicy)).not.toThrow();
  });

  it('refuses to resolve a private literal address in cloud mode', async () => {
    await expect(resolveWebhookTarget(new URL('https://10.1.2.3/hook'), cloudPolicy)).rejects.toThrow(WebhookUrlError);
  });

  it('resolves a private literal address when private networks are enabled', async () => {
    await expect(resolveWebhookTarget(new URL('http://127.0.0.1:9/hook'), selfHostedPolicy)).resolves.toEqual({
      address: '127.0.0.1',
      family: 4
    });
  });
});

describe('webhook redaction', () => {
  it('masks bearer tokens and sensitive JSON values but keeps the rest', () => {
    const redacted = redactSensitiveText(
      '{"ok":false,"api_key":"abc123","token":"t","message":"Authorization: Bearer abc.def-ghi"}'
    );

    expect(redacted).toContain('"api_key":"[redacted]"');
    expect(redacted).toContain('"token":"[redacted]"');
    expect(redacted).toContain('"ok":false');
    expect(redacted).toContain('Bearer [redacted]');
    expect(redacted).not.toContain('abc123');
    expect(redacted).not.toContain('abc.def-ghi');
  });

  it('truncates long text with an ellipsis', () => {
    expect(truncateText('abcdef', 3)).toBe('abc…');
    expect(truncateText('abc', 3)).toBe('abc');
  });
});
