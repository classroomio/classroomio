import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getWebhookEventContext: vi.fn() }));

vi.mock('@cio/db/queries/webhook', () => ({ getWebhookEventContext: mocks.getWebhookEventContext }));

import { enrichWebhookEventData } from '@cio/core/services/webhook/enrich';
import { ZWebhookEventData, ZWebhookEventInput } from '@cio/utils/validation/webhook/events';
import { WEBHOOK_EVENT_TYPES } from '@cio/utils/constants/webhook';

const ids = {
  course: '000000c1-0000-4000-8000-0000000000c1',
  profile: '000000b1-0000-4000-8000-0000000000b1',
  actor: '000000b2-0000-4000-8000-0000000000b2',
  member: '000000d1-0000-4000-8000-0000000000d1',
  invite: '000000e1-0000-4000-8000-0000000000e1',
  submission: '000000f1-0000-4000-8000-0000000000f1',
  exercise: '000000f2-0000-4000-8000-0000000000f2',
  lesson: '000000f3-0000-4000-8000-0000000000f3'
};

const inputs: Record<string, Record<string, unknown>> = {
  'organization.invite.created': { inviteId: ids.invite, email: 'a@b.co', actorProfileId: ids.actor, reason: null },
  'organization.invite.accepted': { inviteId: ids.invite, email: 'a@b.co', actorProfileId: null, reason: null },
  'organization.invite.revoked': { inviteId: ids.invite, email: null, actorProfileId: ids.actor, reason: 'revoked' },
  'course.invite.created': { courseId: ids.course, inviteId: ids.invite, email: null, actorProfileId: ids.actor },
  'course.invite.accepted': {
    courseId: ids.course,
    inviteId: ids.invite,
    email: 'a@b.co',
    actorProfileId: ids.profile
  },
  'course.invite.revoked': { courseId: ids.course, inviteId: ids.invite, email: null, actorProfileId: null },
  'course.member.added': { courseId: ids.course, memberId: ids.member, profileId: ids.profile, email: null, roleId: 3 },
  'course.member.removed': { courseId: ids.course, memberId: ids.member, profileId: null, email: 'p@b.co', roleId: 2 },
  'course.completed': { courseId: ids.course, memberId: ids.member, profileId: ids.profile, completedAt: 'now' },
  'course.certificate.issued': {
    courseId: ids.course,
    memberId: ids.member,
    profileId: ids.profile,
    completedAt: 'now'
  },
  'course.submission.created': {
    courseId: ids.course,
    submissionId: ids.submission,
    exerciseId: ids.exercise,
    memberId: ids.member,
    profileId: ids.profile,
    statusId: 1,
    gradingState: 'queued',
    total: null
  },
  'course.submission.status_changed': {
    courseId: ids.course,
    submissionId: ids.submission,
    exerciseId: null,
    memberId: ids.member,
    profileId: ids.profile,
    statusId: 3,
    gradingState: 'completed',
    total: 8,
    previousStatusId: 2,
    previousGradingState: 'awaiting_manual'
  },
  'lesson.completion.updated': { courseId: ids.course, lessonId: ids.lesson, profileId: ids.profile, isComplete: true },
  'exercise.completion.updated': {
    courseId: ids.course,
    exerciseId: ids.exercise,
    memberId: null,
    profileId: null,
    isComplete: false
  }
};

const fullContext = () => ({
  profiles: new Map([
    [ids.profile, { name: 'Alex Johnson', email: 'alex@example.com' }],
    [ids.actor, { name: 'Sam Rivera', email: 'sam@example.com' }]
  ]),
  course: { title: 'Intro to Data Science', slug: 'intro-to-data-science' },
  exercise: { title: 'Week 1 quiz' },
  lesson: { title: 'Getting started' }
});

describe('webhook event enrichment', () => {
  beforeEach(() => {
    mocks.getWebhookEventContext.mockReset();
    mocks.getWebhookEventContext.mockResolvedValue(fullContext());
  });

  it('has a sample input for every event type', () => {
    expect(Object.keys(inputs).sort()).toEqual([...WEBHOOK_EVENT_TYPES].sort());
  });

  it.each(Object.keys(inputs))('%s enriches into its delivered schema', async (eventType) => {
    const key = eventType as keyof typeof ZWebhookEventData;
    const input = ZWebhookEventInput[key].parse(inputs[eventType]);
    const enriched = await enrichWebhookEventData(input);

    expect(() => ZWebhookEventData[key].parse(enriched)).not.toThrow();
    expect(enriched).toMatchObject(input);
  });

  it('adds readable learner, course and exercise details', async () => {
    const enriched = await enrichWebhookEventData(inputs['course.submission.created']);

    expect(enriched.learner).toEqual({ id: ids.profile, name: 'Alex Johnson', email: 'alex@example.com' });
    expect(enriched.course).toEqual({ id: ids.course, title: 'Intro to Data Science', slug: 'intro-to-data-science' });
    expect(enriched.exercise).toEqual({ id: ids.exercise, title: 'Week 1 quiz' });
  });

  it('prefers the email recorded on the event over the profile email', async () => {
    const enriched = await enrichWebhookEventData({ ...inputs['course.member.added'], email: 'invited@example.com' });

    expect(enriched.learner).toMatchObject({ email: 'invited@example.com' });
  });

  it('labels the role next to roleId', async () => {
    const admin = await enrichWebhookEventData({ ...inputs['course.member.added'], roleId: 1 });
    const tutor = await enrichWebhookEventData({ ...inputs['course.member.added'], roleId: 2 });
    const student = await enrichWebhookEventData({ ...inputs['course.member.added'], roleId: 3 });

    expect([admin.role, tutor.role, student.role]).toEqual(['admin', 'tutor', 'student']);
  });

  it('sets actor to null when nobody triggered the event', async () => {
    const enriched = await enrichWebhookEventData(inputs['organization.invite.accepted']);

    expect(enriched.actor).toBeNull();
  });

  it('sets exercise to null when the submission has no exercise', async () => {
    const enriched = await enrichWebhookEventData(inputs['course.submission.status_changed']);

    expect(enriched.exercise).toBeNull();
  });

  it('returns null names and titles when the records no longer exist', async () => {
    mocks.getWebhookEventContext.mockResolvedValue({ profiles: new Map(), course: null, exercise: null, lesson: null });
    const enriched = await enrichWebhookEventData(inputs['lesson.completion.updated']);

    expect(enriched.learner).toEqual({ id: ids.profile, name: null, email: null });
    expect(enriched.course).toEqual({ id: ids.course, title: null, slug: null });
    expect(enriched.lesson).toEqual({ id: ids.lesson, title: null });
  });

  it('still returns the event when loading the details fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getWebhookEventContext.mockRejectedValue(new Error('db down'));
    const enriched = await enrichWebhookEventData(inputs['course.completed']);

    expect(enriched).toMatchObject(inputs['course.completed']);
    expect(enriched.learner).toEqual({ id: ids.profile, name: null, email: null });
  });
});
