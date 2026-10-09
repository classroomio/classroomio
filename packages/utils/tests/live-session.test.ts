import { describe, expect, it } from 'vitest';

import { getLiveSessionPhase, getReleasedRecordingUrl } from '../src/functions/live-session';

const start = '2026-10-09T10:00:00.000Z';
const startMs = new Date(start).getTime();
const minutes = (count: number) => count * 60_000;

describe('getLiveSessionPhase', () => {
  const session = { callUrl: 'https://zoom.us/j/1', lessonAt: start, sessionDurationMinutes: 30 };

  it('returns null without a call link or start time', () => {
    expect(getLiveSessionPhase({ ...session, callUrl: null }, startMs)).toBeNull();
    expect(getLiveSessionPhase({ ...session, lessonAt: null }, startMs)).toBeNull();
  });

  it('is upcoming before the start time', () => {
    expect(getLiveSessionPhase(session, startMs - 1)).toBe('upcoming');
  });

  it('is live from the start until the persisted duration elapses', () => {
    expect(getLiveSessionPhase(session, startMs)).toBe('live');
    expect(getLiveSessionPhase(session, startMs + minutes(30) - 1)).toBe('live');
  });

  it('is ended once the persisted duration elapses', () => {
    expect(getLiveSessionPhase(session, startMs + minutes(30))).toBe('ended');
  });

  it('falls back to 60 minutes when no duration is stored', () => {
    const legacy = { ...session, sessionDurationMinutes: null };

    expect(getLiveSessionPhase(legacy, startMs + minutes(59))).toBe('live');
    expect(getLiveSessionPhase(legacy, startMs + minutes(60))).toBe('ended');
  });
});

describe('getReleasedRecordingUrl', () => {
  const session = {
    callUrl: 'https://zoom.us/j/1',
    lessonAt: start,
    sessionDurationMinutes: 30,
    recordingUrl: 'https://zoom.us/rec/share/abc'
  };

  it('hides the recording until the session ends', () => {
    expect(getReleasedRecordingUrl(session, startMs - 1)).toBeNull();
    expect(getReleasedRecordingUrl(session, startMs + minutes(10))).toBeNull();
  });

  it('releases the recording once the session ends', () => {
    expect(getReleasedRecordingUrl(session, startMs + minutes(31))).toBe(session.recordingUrl);
  });
});
