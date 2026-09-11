import { describe, expect, it } from 'vitest';

import { ZCreateContentReport, ZUpdateContentReport } from '../src/validation/report';

describe('ZCreateContentReport', () => {
  it('accepts a valid report payload', () => {
    const result = ZCreateContentReport.safeParse({
      targetType: 'course_newsfeed_comment',
      targetId: '42',
      reason: 'spam',
      details: 'This looks like an ad'
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.details).toBe('This looks like an ad');
    }
  });

  it('treats blank details as omitted', () => {
    const result = ZCreateContentReport.safeParse({
      targetType: 'profile',
      targetId: '11111111-1111-1111-1111-111111111111',
      reason: 'other',
      details: '   '
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.details).toBeUndefined();
    }
  });

  it('rejects an unknown target type', () => {
    const result = ZCreateContentReport.safeParse({
      targetType: 'direct_message',
      targetId: '1',
      reason: 'spam'
    });

    expect(result.success).toBe(false);
  });

  it('rejects details longer than 1000 characters', () => {
    const result = ZCreateContentReport.safeParse({
      targetType: 'lesson_comment',
      targetId: '9',
      reason: 'harassment',
      details: 'a'.repeat(1001)
    });

    expect(result.success).toBe(false);
  });
});

describe('ZUpdateContentReport', () => {
  it('requires at least one field', () => {
    const result = ZUpdateContentReport.safeParse({});

    expect(result.success).toBe(false);
  });

  it('accepts a status change', () => {
    const result = ZUpdateContentReport.safeParse({
      status: 'dismissed',
      resolutionCode: 'no_action'
    });

    expect(result.success).toBe(true);
  });
});
