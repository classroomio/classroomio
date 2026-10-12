import { describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/activity/runtime-scorm', () => ({
  getScormRuntimeState: vi.fn(),
  commitScormAttempt: vi.fn(),
  reportScormRuntimeEvent: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  commitScormAttempt,
  getScormRuntimeState,
  reportScormRuntimeEvent
} from '@api/services/activity/runtime-scorm';
import { runtimeScormRouter } from '@api/routes/activity/runtime-scorm';

const mockedState = vi.mocked(getScormRuntimeState);
const mockedCommit = vi.mocked(commitScormAttempt);
const mockedEvent = vi.mocked(reportScormRuntimeEvent);

function app() {
  return new Hono().route('/activity/scorm/runtime', runtimeScormRouter);
}

describe('runtime-scorm routes', () => {
  it('returns the bare launch state for the player', async () => {
    mockedState.mockResolvedValue({
      format: 'scorm12',
      cmi: {},
      contentToken: 'content-token',
      launchPath: 'sco.html',
      parentOrigin: 'https://org.example.com',
      entry: 'ab-initio',
      debug: false
    });

    const response = await app().request('/activity/scorm/runtime/launch-token/state');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ format: 'scorm12', launchPath: 'sco.html' });
    expect(mockedState).toHaveBeenCalledWith('launch-token', null);
  });

  it('accepts beacon commits sent as text/plain', async () => {
    mockedCommit.mockResolvedValue({ saved: true, completedActivity: false });

    const response = await app().request('/activity/scorm/runtime/launch-token/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ commitSequence: 3, cmi: { suspend_data: 'x' }, terminate: true })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: true, errorCode: 0 });
    expect(mockedCommit).toHaveBeenCalledWith(
      'launch-token',
      expect.objectContaining({ commitSequence: 3, terminate: true }),
      true,
      null
    );
  });

  it('passes non-beacon commits without the beacon flag', async () => {
    mockedCommit.mockResolvedValue({ saved: true, completedActivity: false });

    const response = await app().request('/activity/scorm/runtime/launch-token/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitSequence: 1, cmi: { suspend_data: 'x' } })
    });

    expect(response.status).toBe(200);
    expect(mockedCommit).toHaveBeenCalledWith(
      'launch-token',
      expect.objectContaining({ commitSequence: 1 }),
      false,
      null
    );
  });

  it('rejects malformed commits and expired tokens with status codes', async () => {
    const bad = await app().request('/activity/scorm/runtime/launch-token/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmi: {} })
    });
    expect(bad.status).toBe(400);

    mockedState.mockRejectedValueOnce(new AppError('Launch token expired', ErrorCodes.UNAUTHORIZED, 401));
    const expired = await app().request('/activity/scorm/runtime/launch-token/state');
    expect(expired.status).toBe(401);
  });

  it('records player events and rejects unknown kinds', async () => {
    mockedEvent.mockResolvedValue({ recorded: true });

    const response = await app().request('/activity/scorm/runtime/launch-token/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'not_initialized', detail: { elapsedMs: 30000 } })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: true, errorCode: 0, recorded: true });
    expect(mockedEvent).toHaveBeenCalledWith('launch-token', 'not_initialized', { elapsedMs: 30000 }, null);

    const unknown = await app().request('/activity/scorm/runtime/launch-token/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'commit', detail: {} })
    });
    expect(unknown.status).toBe(400);
    expect(mockedEvent).toHaveBeenCalledTimes(1);
  });
});
