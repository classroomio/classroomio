import { describe, expect, it } from 'vitest';

import { ANSWER_TIME_MAX_SECONDS, clampAnswerTiming, createAnswerTimingTracker } from '../src/answer-timing';

const now = new Date('2026-11-16T12:00:00.000Z');

describe('clampAnswerTiming', () => {
  it('keeps a valid span as ISO strings', () => {
    expect(clampAnswerTiming({ startedAt: '2026-11-16T11:59:00Z', answeredAt: '2026-11-16T11:59:30Z' }, now)).toEqual({
      startedAt: '2026-11-16T11:59:00.000Z',
      answeredAt: '2026-11-16T11:59:30.000Z'
    });
  });

  it('rejects missing or invalid values', () => {
    expect(clampAnswerTiming({ startedAt: 'nope', answeredAt: '2026-11-16T11:59:30Z' }, now)).toBeNull();
    expect(clampAnswerTiming({ answeredAt: '2026-11-16T11:59:30Z' }, now)).toBeNull();
    expect(clampAnswerTiming({ startedAt: 5, answeredAt: 7 }, now)).toBeNull();
  });

  it('never lets the answer be in the future', () => {
    const result = clampAnswerTiming({ startedAt: '2026-11-16T11:59:00Z', answeredAt: '2027-01-01T00:00:00Z' }, now);

    expect(result?.answeredAt).toBe(now.toISOString());
  });

  it('never lets the start follow the answer', () => {
    const result = clampAnswerTiming({ startedAt: '2026-11-16T11:59:50Z', answeredAt: '2026-11-16T11:59:10Z' }, now);

    expect(result?.startedAt).toBe(result?.answeredAt);
  });

  it('caps the span', () => {
    const result = clampAnswerTiming({ startedAt: '2020-01-01T00:00:00Z', answeredAt: '2026-11-16T11:00:00Z' }, now)!;
    const seconds = (Date.parse(result.answeredAt) - Date.parse(result.startedAt)) / 1000;

    expect(seconds).toBe(ANSWER_TIME_MAX_SECONDS);
  });
});

describe('createAnswerTimingTracker', () => {
  it('times each question from the previous answer', () => {
    let clock = Date.parse('2026-11-16T10:00:00Z');
    const tracker = createAnswerTimingTracker(() => clock);

    clock += 10_000;
    tracker.observe({ q1: 'a' });
    clock += 20_000;
    tracker.observe({ q1: 'a', q2: 'b' });

    expect(tracker.timingFor('q1')).toEqual({
      startedAt: '2026-11-16T10:00:00.000Z',
      answeredAt: '2026-11-16T10:00:10.000Z'
    });
    expect(tracker.timingFor('q2')).toEqual({
      startedAt: '2026-11-16T10:00:10.000Z',
      answeredAt: '2026-11-16T10:00:30.000Z'
    });
  });

  it('keeps the original start when an answer changes again', () => {
    let clock = Date.parse('2026-11-16T10:00:00Z');
    const tracker = createAnswerTimingTracker(() => clock);

    clock += 5_000;
    tracker.observe({ q1: 'a' });
    clock += 5_000;
    tracker.observe({ q1: 'b' });

    expect(tracker.timingFor('q1')).toEqual({
      startedAt: '2026-11-16T10:00:00.000Z',
      answeredAt: '2026-11-16T10:00:10.000Z'
    });
  });

  it('does not time a restored draft of several answers', () => {
    const tracker = createAnswerTimingTracker(() => 1);

    tracker.observe({ q1: 'a', q2: 'b' });

    expect(tracker.timingFor('q1')).toBeUndefined();
  });

  it('clears everything on reset', () => {
    const tracker = createAnswerTimingTracker(() => 1);

    tracker.observe({ q1: 'a' });
    tracker.reset();

    expect(tracker.timingFor('q1')).toBeUndefined();
  });
});
