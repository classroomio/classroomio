import { beforeEach, describe, expect, it, vi } from 'vitest';

const { env, getCourseOrganizationId } = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>,
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({ env }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId }));

import { captureCourseEvent, captureServerEvent, recordServerEvents } from '@cio/core/services/posthog';

const fetchMock = vi.fn();

function sentBatch() {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

describe('PostHog server events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(env)) delete env[key];
    env.POSTHOG_SERVER_KEY = 'phc_test';
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends nothing without a key', async () => {
    env.POSTHOG_SERVER_KEY = undefined;

    await recordServerEvents([{ event: 'course_created', distinctId: 'user-1', orgId: 'org-1' }]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends nothing from a self-hosted instance, even with a key', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';

    await recordServerEvents([{ event: 'course_created', distinctId: 'user-1', orgId: 'org-1' }]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the user as the person and the org as the group', async () => {
    await recordServerEvents([
      { event: 'course_created', distinctId: 'user-1', orgId: 'org-1', properties: { course_id: 'course-1' } }
    ]);

    expect(fetchMock.mock.calls[0][0]).toBe('https://eu.i.posthog.com/batch/');
    expect(sentBatch()).toMatchObject({
      api_key: 'phc_test',
      batch: [
        {
          event: 'course_created',
          distinct_id: 'user-1',
          properties: { course_id: 'course-1', $groups: { organization: 'org-1' } }
        }
      ]
    });
    expect(sentBatch().batch[0].properties).not.toHaveProperty('$process_person_profile');
  });

  it('attributes an event without a user to the org and creates no person', async () => {
    await recordServerEvents([{ event: 'plan_limit_reached', orgId: 'org-1' }]);

    expect(sentBatch().batch[0]).toMatchObject({
      distinct_id: 'org_org-1',
      properties: { $groups: { organization: 'org-1' }, $process_person_profile: false }
    });
  });

  it('drops an event with neither a user nor an org', async () => {
    await recordServerEvents([{ event: 'course_created' }]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('splits large sends into batches of 500', async () => {
    const events = Array.from({ length: 501 }, (_, index) => ({
      event: 'learner_enrolled',
      distinctId: `student-${index}`,
      orgId: 'org-1'
    }));

    await recordServerEvents(events);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).batch).toHaveLength(1);
  });

  it('never throws when PostHog is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      recordServerEvents([{ event: 'course_created', distinctId: 'user-1', orgId: 'org-1' }])
    ).resolves.toBeUndefined();
    expect(() => captureServerEvent({ event: 'course_created', distinctId: 'user-1' })).not.toThrow();
  });

  it('looks up the org for a course event and adds the course id', async () => {
    getCourseOrganizationId.mockResolvedValue('org-9');

    captureCourseEvent('course-1', { event: 'lesson_completed', distinctId: 'student-1' });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBatch().batch[0]).toMatchObject({
      event: 'lesson_completed',
      distinct_id: 'student-1',
      properties: { course_id: 'course-1', $groups: { organization: 'org-9' } }
    });
  });
});
