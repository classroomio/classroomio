import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/notifications/notification', () => ({ insertNotifications: vi.fn() }));
vi.mock('@cio/db/queries/notifications/notification-recipients', () => ({ filterActiveOrganizationMembers: vi.fn() }));
vi.mock('@cio/jobs', () => ({ enqueueSendPush: vi.fn() }));
vi.mock('@cio/core/services/notification/push-config', () => ({ isPushConfigured: vi.fn() }));

import { insertNotifications } from '@cio/db/queries/notifications/notification';
import { filterActiveOrganizationMembers } from '@cio/db/queries/notifications/notification-recipients';
import { enqueueSendPush } from '@cio/jobs';
import { isPushConfigured } from '@cio/core/services/notification/push-config';
import { notify } from '@cio/core/services/notification/notify';

const base = {
  organizationId: 'org-1',
  type: 'newsfeed_post' as const,
  entityId: 'feed-1',
  courseId: 'course-1',
  actorProfileId: 'teacher',
  dedupeKey: 'newsfeed_post:feed-1'
};

function insertedRows(profileIds: string[]) {
  return profileIds.map((profileId) => ({ id: `n-${profileId}`, profileId })) as Awaited<
    ReturnType<typeof insertNotifications>
  >;
}

describe('notify', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isPushConfigured).mockReturnValue(true);
    vi.mocked(enqueueSendPush).mockResolvedValue('job-1');
  });

  it('writes one row per active member, never the actor, and queues push', async () => {
    vi.mocked(filterActiveOrganizationMembers).mockResolvedValue(['student-a', 'student-b']);
    vi.mocked(insertNotifications).mockImplementation(async (rows) => insertedRows(rows.map((row) => row.profileId)));

    const result = await notify({
      ...base,
      recipientProfileIds: ['student-a', 'teacher', 'student-b', 'student-a', 'outsider']
    });

    expect(filterActiveOrganizationMembers).toHaveBeenCalledWith('org-1', ['student-a', 'student-b', 'outsider']);
    const rows = vi.mocked(insertNotifications).mock.calls[0]![0];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      profileId: 'student-a',
      organizationId: 'org-1',
      type: 'newsfeed_post',
      entityType: 'newsfeed_post',
      entityId: 'feed-1',
      courseId: 'course-1',
      actorProfileId: 'teacher',
      dedupeKey: 'newsfeed_post:feed-1'
    });
    expect(enqueueSendPush).toHaveBeenCalledWith({ notificationIds: ['n-student-a', 'n-student-b'] });
    expect(result).toEqual({ notificationIds: ['n-student-a', 'n-student-b'], pushJobId: 'job-1' });
  });

  it('writes nothing when no recipient belongs to the organization', async () => {
    vi.mocked(filterActiveOrganizationMembers).mockResolvedValue([]);

    const result = await notify({ ...base, recipientProfileIds: ['outsider'] });

    expect(insertNotifications).not.toHaveBeenCalled();
    expect(enqueueSendPush).not.toHaveBeenCalled();
    expect(result.notificationIds).toEqual([]);
  });

  it('does not push again when the dedupe key already exists', async () => {
    vi.mocked(filterActiveOrganizationMembers).mockResolvedValue(['student-a']);
    vi.mocked(insertNotifications).mockResolvedValue([]);

    await notify({ ...base, recipientProfileIds: ['student-a'] });

    expect(enqueueSendPush).not.toHaveBeenCalled();
  });

  it('keeps the in-app row and skips push when push is not configured', async () => {
    vi.mocked(isPushConfigured).mockReturnValue(false);
    vi.mocked(filterActiveOrganizationMembers).mockResolvedValue(['student-a']);
    vi.mocked(insertNotifications).mockResolvedValue(insertedRows(['student-a']));

    const result = await notify({ ...base, recipientProfileIds: ['student-a'] });

    expect(enqueueSendPush).not.toHaveBeenCalled();
    expect(result).toEqual({ notificationIds: ['n-student-a'], pushJobId: null });
  });

  it('never throws', async () => {
    vi.mocked(filterActiveOrganizationMembers).mockRejectedValue(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(notify({ ...base, recipientProfileIds: ['student-a'] })).resolves.toEqual({
      notificationIds: [],
      pushJobId: null
    });
  });
});
