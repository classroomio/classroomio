import { gzipSync } from 'node:zlib';
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
import { env } from '@cio/core/config/env';
import { mintLaunchToken } from '@cio/activity-packages';

env.ACTIVITY_SIGNING_SECRET = 'test-activity-signing-secret-0123456789';

const mockedState = vi.mocked(getScormRuntimeState);
const mockedCommit = vi.mocked(commitScormAttempt);
const mockedEvent = vi.mocked(reportScormRuntimeEvent);

function app() {
  return new Hono().route('/activity/scorm/runtime', runtimeScormRouter);
}

async function testToken(): Promise<string> {
  return mintLaunchToken(
    {
      org: 'org-key',
      act: 'activity-id',
      sub: 'profile-id',
      unit: 'unit-id',
      fmt: 'scorm12',
      mode: 'normal',
      anc: []
    },
    'test-activity-signing-secret-0123456789'
  );
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
      commitSeq: 0,
      mode: 'normal',
      debug: false
    });
    const launchToken = await testToken();

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/state`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ format: 'scorm12', launchPath: 'sco.html' });
    expect(mockedState).toHaveBeenCalledWith(launchToken, null);
  });

  it('accepts beacon commits sent as text/plain', async () => {
    mockedCommit.mockResolvedValue({ saved: true, completedActivity: false, progressChanged: true });
    const launchToken = await testToken();

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ commitSequence: 3, cmi: { suspend_data: 'x' }, terminate: true })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: true,
      errorCode: 0,
      completedActivity: false,
      progressChanged: true
    });
    expect(mockedCommit).toHaveBeenCalledWith(
      launchToken,
      expect.objectContaining({ commitSequence: 3, terminate: true }),
      true,
      null
    );
  });

  it('reports stale commits as failures instead of success', async () => {
    mockedCommit.mockResolvedValue({ saved: false, completedActivity: false, progressChanged: false, rejected: true });
    const launchToken = await testToken();

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitSequence: 1, cmi: { suspend_data: 'x' } })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: false,
      errorCode: 101,
      completedActivity: false,
      progressChanged: false
    });
  });

  it('passes non-beacon commits without the beacon flag', async () => {
    mockedCommit.mockResolvedValue({ saved: true, completedActivity: false, progressChanged: true });
    const launchToken = await testToken();

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitSequence: 1, cmi: { suspend_data: 'x' } })
    });

    expect(response.status).toBe(200);
    expect(mockedCommit).toHaveBeenCalledWith(launchToken, expect.objectContaining({ commitSequence: 1 }), false, null);
  });

  it('decodes a gzipped exit save as a beacon commit', async () => {
    mockedCommit.mockResolvedValue({ saved: true, completedActivity: true, progressChanged: true });
    const launchToken = await testToken();
    const suspendData = 'a'.repeat(200_000);
    const compressed = gzipSync(
      JSON.stringify({ commitSequence: 4, terminate: true, cmi: { suspend_data: suspendData } })
    );

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'X-Cio-Body-Encoding': 'gzip' },
      body: compressed
    });

    expect(response.status).toBe(200);
    expect(mockedCommit).toHaveBeenLastCalledWith(
      launchToken,
      expect.objectContaining({ commitSequence: 4, cmi: { suspend_data: suspendData } }),
      true,
      null
    );
  });

  it('rejects a gzipped commit that inflates past the commit limit', async () => {
    mockedCommit.mockClear();
    const launchToken = await testToken();
    const compressed = gzipSync(JSON.stringify({ commitSequence: 5, cmi: { suspend_data: 'a'.repeat(600_000) } }));

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'X-Cio-Body-Encoding': 'gzip' },
      body: compressed
    });

    expect(response.status).toBe(413);
    expect(mockedCommit).not.toHaveBeenCalled();
  });

  it('rejects a commit marked gzip that is not gzip', async () => {
    const launchToken = await testToken();

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'X-Cio-Body-Encoding': 'gzip' },
      body: '{"commitSequence":6,"cmi":{}}'
    });

    expect(response.status).toBe(400);
  });

  it('rejects malformed commits and expired tokens with status codes', async () => {
    const launchToken = await testToken();
    const bad = await app().request(`/activity/scorm/runtime/${launchToken}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmi: {} })
    });
    expect(bad.status).toBe(400);

    mockedState.mockRejectedValueOnce(new AppError('Launch token expired', ErrorCodes.UNAUTHORIZED, 401));
    const expired = await app().request(`/activity/scorm/runtime/${launchToken}/state`);
    expect(expired.status).toBe(401);
  });

  it('rejects forged tokens before touching the service', async () => {
    mockedState.mockClear();
    const response = await app().request('/activity/scorm/runtime/forged-token/state');

    expect(response.status).toBe(401);
    expect(mockedState).not.toHaveBeenCalled();
  });

  it('records player events and rejects unknown kinds', async () => {
    mockedEvent.mockResolvedValue({ recorded: true });
    const launchToken = await testToken();

    const response = await app().request(`/activity/scorm/runtime/${launchToken}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'not_initialized', detail: { elapsedMs: 30000 } })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: true, errorCode: 0, recorded: true });
    expect(mockedEvent).toHaveBeenCalledWith(launchToken, 'not_initialized', { elapsedMs: 30000 }, null);

    const unknown = await app().request(`/activity/scorm/runtime/${launchToken}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'commit', detail: {} })
    });
    expect(unknown.status).toBe(400);
    expect(mockedEvent).toHaveBeenCalledTimes(1);
  });
});
