import { beforeEach, describe, expect, it, vi } from 'vitest';

const { env, getOrCreateInstance, getInstanceUsageCounts, markInstanceFirstReported, isFeatureLicensed } = vi.hoisted(
  () => ({
    env: {} as Record<string, string | undefined>,
    getOrCreateInstance: vi.fn(),
    getInstanceUsageCounts: vi.fn(),
    markInstanceFirstReported: vi.fn(),
    isFeatureLicensed: vi.fn()
  })
);

vi.mock('@cio/core/config/env', () => ({ env }));
vi.mock('@cio/db/queries/instance', () => ({
  getOrCreateInstance,
  getInstanceUsageCounts,
  markInstanceFirstReported
}));
vi.mock('@cio/core/services/license', () => ({ isFeatureLicensed }));

import { sendInstanceTelemetry } from '@cio/core/services/instance-telemetry';

const fetchMock = vi.fn();

function sentBody() {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('sendInstanceTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(env)) delete env[key];
    env.PUBLIC_IS_SELFHOSTED = 'true';
    env.CIO_VERSION = '1.4.2';
    env.CIO_DEPLOYMENT_METHOD = 'docker';

    getOrCreateInstance.mockResolvedValue({ id: 'instance-1', firstReportedAt: null });
    getInstanceUsageCounts.mockResolvedValue({
      orgCount: 1,
      studentCount: 240,
      publishedCourseCount: 12,
      activeStudentCount: 85
    });
    isFeatureLicensed.mockResolvedValue(false);
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends nothing on cloud', async () => {
    env.PUBLIC_IS_SELFHOSTED = undefined;

    await expect(sendInstanceTelemetry()).resolves.toEqual({ sent: false, reason: 'not-selfhosted' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends nothing when the user opts out', async () => {
    env.CIO_TELEMETRY_DISABLED = 'true';

    await expect(sendInstanceTelemetry()).resolves.toEqual({ sent: false, reason: 'disabled' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends nothing when the license includes no-tracking', async () => {
    env.LICENSE_KEY = 'key';
    isFeatureLicensed.mockResolvedValue(true);

    await expect(sendInstanceTelemetry()).resolves.toEqual({ sent: false, reason: 'no-tracking-license' });
    expect(isFeatureLicensed).toHaveBeenCalledWith('no-tracking');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the license server when no key is set', async () => {
    await sendInstanceTelemetry();

    expect(isFeatureLicensed).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('sends first_start once and marks the instance as reported', async () => {
    await expect(sendInstanceTelemetry()).resolves.toEqual({ sent: true, trigger: 'first_start' });

    expect(sentBody()).toMatchObject({
      event: 'instance_started',
      distinct_id: 'instance-1',
      properties: {
        instance_id: 'instance-1',
        trigger: 'first_start',
        deployment_method: 'docker',
        version: '1.4.2',
        org_count: 1,
        student_count: 240,
        published_course_count: 12,
        active_student_count: 85
      }
    });
    expect(markInstanceFirstReported).toHaveBeenCalledWith('instance-1');
  });

  it('sends weekly once the first start was reported', async () => {
    getOrCreateInstance.mockResolvedValue({ id: 'instance-1', firstReportedAt: '2026-10-01T00:00:00.000Z' });

    await expect(sendInstanceTelemetry()).resolves.toEqual({ sent: true, trigger: 'weekly' });
    expect(sentBody().properties.trigger).toBe('weekly');
    expect(markInstanceFirstReported).not.toHaveBeenCalled();
  });

  it('keeps first_start pending when PostHog rejects the event', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    await expect(sendInstanceTelemetry()).rejects.toThrow('503');
    expect(markInstanceFirstReported).not.toHaveBeenCalled();
  });

  it('falls back to other when no deployment method is set', async () => {
    env.CIO_DEPLOYMENT_METHOD = undefined;

    await sendInstanceTelemetry();

    expect(sentBody().properties.deployment_method).toBe('other');
  });
});
