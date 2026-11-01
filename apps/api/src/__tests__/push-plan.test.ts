import { describe, expect, it } from 'vitest';

import { planPushDelivery, type PushPlanInput } from '@cio/core/services/notification/push-plan';
import type { TDeviceToken, TNotification } from '@cio/db/types';

const now = new Date('2026-10-31T12:00:00Z');

function notification(overrides: Partial<TNotification> = {}): TNotification {
  return {
    id: 'n-1',
    profileId: 'student-a',
    organizationId: 'org-1',
    type: 'exercise_graded',
    entityType: 'exercise',
    entityId: 'exercise-1',
    courseId: 'course-1',
    actorProfileId: null,
    dedupeKey: null,
    readAt: null,
    createdAt: now.toISOString(),
    ...overrides
  };
}

function token(profileId: string, value: string): TDeviceToken {
  return {
    id: value,
    profileId,
    token: value,
    platform: 'ios',
    provider: 'expo',
    appVersion: null,
    deviceName: null,
    locale: null,
    lastSeenAt: now.toISOString(),
    disabledAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

function input(overrides: Partial<PushPlanInput> = {}): PushPlanInput {
  return {
    notifications: [notification()],
    subjects: new Map([
      [
        'n-1',
        {
          courseTitle: 'React',
          courseImage: null,
          actorName: null,
          actorAvatarUrl: null,
          subjectTitle: 'Section 2 check',
          subjectSlug: null,
          dueAt: null,
          startsAt: null,
          completedCount: null,
          requiredCount: null
        }
      ]
    ]),
    preferences: [],
    quietHours: [],
    tokens: [token('student-a', 'ExponentPushToken[a1]'), token('student-a', 'ExponentPushToken[a2]')],
    unreadByProfile: new Map([['student-a', 3]]),
    deferred: false,
    now,
    ...overrides
  };
}

const workdayUtc = (profileId: string) => ({
  profileId,
  startMinute: 9 * 60,
  endMinute: 17 * 60,
  timezone: 'UTC',
  updatedAt: now.toISOString()
});

describe('planPushDelivery', () => {
  it('sends one message per active token with the routing payload and badge', () => {
    const plan = planPushDelivery(input());

    expect(plan.messages).toHaveLength(2);
    expect(plan.messages[0]).toEqual({
      to: 'ExponentPushToken[a1]',
      title: 'Section 2 check was graded',
      body: 'React',
      data: {
        notificationId: 'n-1',
        type: 'exercise_graded',
        entityId: 'exercise-1',
        deepLink: '/course/course-1/exercise/exercise-1',
        orgId: 'org-1'
      },
      badge: 3,
      sound: 'default',
      threadId: 'exercise_graded'
    });
  });

  it('skips a category whose push preference is off', () => {
    const plan = planPushDelivery(
      input({
        preferences: [
          {
            profileId: 'student-a',
            category: 'exercise_graded',
            push: false,
            inApp: true,
            updatedAt: now.toISOString()
          }
        ]
      })
    );

    expect(plan.messages).toHaveLength(0);
    expect(plan.skipped.preference).toBe(1);
  });

  it('ignores a push preference on a locked category', () => {
    const plan = planPushDelivery(
      input({
        notifications: [notification({ type: 'compliance_overdue', entityType: 'compliance_record' })],
        preferences: [
          { profileId: 'student-a', category: 'overdue', push: false, inApp: true, updatedAt: now.toISOString() }
        ]
      })
    );

    expect(plan.messages).toHaveLength(2);
  });

  it('defers inside quiet hours until they end', () => {
    const plan = planPushDelivery(input({ quietHours: [workdayUtc('student-a')] }));

    expect(plan.messages).toHaveLength(0);
    expect(plan.deferrals).toEqual([{ delayMs: 5 * 60 * 60_000, notificationIds: ['n-1'] }]);
  });

  it('drops time-sensitive categories and already-deferred runs inside quiet hours', () => {
    const live = planPushDelivery(
      input({
        notifications: [notification({ type: 'live_session_reminder', entityType: 'lesson' })],
        quietHours: [workdayUtc('student-a')]
      })
    );
    const second = planPushDelivery(input({ quietHours: [workdayUtc('student-a')], deferred: true }));

    expect(live.deferrals).toEqual([]);
    expect(live.skipped.quietHours).toBe(1);
    expect(second.deferrals).toEqual([]);
    expect(second.skipped.quietHours).toBe(1);
  });

  it('skips read notifications and recipients without tokens', () => {
    const plan = planPushDelivery(
      input({
        notifications: [
          notification({ readAt: now.toISOString() }),
          notification({ id: 'n-2', profileId: 'student-b' })
        ]
      })
    );

    expect(plan.messages).toHaveLength(0);
    expect(plan.skipped).toMatchObject({ read: 1, noToken: 1 });
  });
});
