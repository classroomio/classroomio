import { describe, expect, it } from 'vitest';

import { getRunQueuedSince, isRunQueueStalled } from './run-state';

const CREATED_AT = '2026-01-01T00:00:00.000Z';

function runWithCursor(executionCursor: Record<string, unknown>) {
  return { createdAt: CREATED_AT, executionCursor };
}

describe('getRunQueuedSince', () => {
  it('prefers the job enqueue time from the queue cursor', () => {
    const run = runWithCursor({ bullmq: { enqueuedAt: '2026-01-01T00:05:00.000Z' } });

    expect(getRunQueuedSince(run)).toBe('2026-01-01T00:05:00.000Z');
  });

  it('falls back to row creation when the cursor has no enqueue time', () => {
    const run = runWithCursor({ bullmq: { jobId: 'job-1' } });

    expect(getRunQueuedSince(run)).toBe(CREATED_AT);
  });

  it('returns null without a run', () => {
    expect(getRunQueuedSince(null)).toBeNull();
  });
});

describe('isRunQueueStalled', () => {
  it('flags a missing or failed job and an unreachable queue', () => {
    expect(isRunQueueStalled({ state: 'missing', activeJobs: 0 })).toBe(true);
    expect(isRunQueueStalled({ state: 'failed', activeJobs: 0 })).toBe(true);
    expect(isRunQueueStalled({ state: 'unavailable', activeJobs: 0 })).toBe(true);
  });

  it('flags a waiting job only when the queue is processing nothing', () => {
    expect(isRunQueueStalled({ state: 'waiting', activeJobs: 0 })).toBe(true);
    expect(isRunQueueStalled({ state: 'waiting', activeJobs: 2 })).toBe(false);
  });

  it('never flags a job the queue is processing, retrying, or already finished', () => {
    expect(isRunQueueStalled({ state: 'active', activeJobs: 1 })).toBe(false);
    expect(isRunQueueStalled({ state: 'delayed', activeJobs: 0 })).toBe(false);
    expect(isRunQueueStalled({ state: 'completed', activeJobs: 0 })).toBe(false);
  });

  it('never flags without queue data', () => {
    expect(isRunQueueStalled(null)).toBe(false);
    expect(isRunQueueStalled(undefined)).toBe(false);
  });
});
