import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createWebhookSignature,
  getInstallationWebhookSecret,
  verifyWebhookSignature
} from '@api/services/plugin/events';

describe('Plugin Webhook Signature & Event Delivery', () => {
  const secret = 'test-secret-key-1234567890';
  const samplePayload = JSON.stringify({
    id: 'del_123',
    eventId: 'evt_456',
    type: 'course.published',
    organizationId: 'org_789',
    data: { courseId: 'c_1' }
  });

  it('generates a valid webhook signature header with t and v1', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createWebhookSignature(secret, timestamp, samplePayload);

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    expect(signature.startsWith(`t=${timestamp},v1=`)).toBe(true);
  });

  it('verifies a freshly generated signature with correct secret and payload', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createWebhookSignature(secret, timestamp, samplePayload);

    const isValid = verifyWebhookSignature(secret, signature, samplePayload, 300);
    expect(isValid).toBe(true);
  });

  it('rejects a signature if payload has been tampered with', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createWebhookSignature(secret, timestamp, samplePayload);

    const tamperedPayload = JSON.stringify({
      id: 'del_123',
      eventId: 'evt_456',
      type: 'course.published',
      organizationId: 'org_attacker',
      data: { courseId: 'c_1' }
    });

    const isValid = verifyWebhookSignature(secret, signature, tamperedPayload, 300);
    expect(isValid).toBe(false);
  });

  it('rejects a signature if secret does not match', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createWebhookSignature(secret, timestamp, samplePayload);

    const isValid = verifyWebhookSignature('wrong-secret-key', signature, samplePayload, 300);
    expect(isValid).toBe(false);
  });

  it('rejects a signature if timestamp is outside tolerance window', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400s ago (> 300s tolerance)
    const signature = createWebhookSignature(secret, oldTimestamp, samplePayload);

    const isValid = verifyWebhookSignature(secret, signature, samplePayload, 300);
    expect(isValid).toBe(false);
  });

  it('rejects malformed signature headers', () => {
    expect(verifyWebhookSignature(secret, 'invalid-header', samplePayload)).toBe(false);
    expect(verifyWebhookSignature(secret, 't=abc,v1=123', samplePayload)).toBe(false);
    expect(verifyWebhookSignature(secret, 't=123456', samplePayload)).toBe(false);
  });

  it('derives consistent installation webhook secrets', () => {
    const instId = 'inst-uuid-1111';
    const secret1 = getInstallationWebhookSecret(instId, 'com.example.plugin');
    const secret2 = getInstallationWebhookSecret(instId, 'com.example.plugin');

    expect(secret1).toBe(secret2);
    expect(secret1).toMatch(/^[a-f0-9]{64}$/);
    expect(getInstallationWebhookSecret('inst-uuid-2222', 'com.example.plugin')).not.toBe(secret1);
  });
});
