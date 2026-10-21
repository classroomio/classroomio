import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getWebhookEventContext: vi.fn(),
  getCourseProgress: vi.fn(),
  getOrganizationById: vi.fn(),
  getWebhookCourseInviteDetails: vi.fn(),
  getWebhookOrganizationInviteDetails: vi.fn(),
  getWebhookMemberDetails: vi.fn(),
  getWebhookMemberIdForProfile: vi.fn(),
  getWebhookCompletionRecord: vi.fn(),
  getWebhookCertificateIssue: vi.fn(),
  getWebhookExerciseDetails: vi.fn(),
  getWebhookLessonSection: vi.fn(),
  getWebhookSubmissionDetails: vi.fn(),
  getWebhookLatestSubmissionScore: vi.fn(),
  getWebhookCohortName: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => ({
  getWebhookEventContext: mocks.getWebhookEventContext,
  getWebhookCourseInviteDetails: mocks.getWebhookCourseInviteDetails,
  getWebhookOrganizationInviteDetails: mocks.getWebhookOrganizationInviteDetails,
  getWebhookMemberDetails: mocks.getWebhookMemberDetails,
  getWebhookMemberIdForProfile: mocks.getWebhookMemberIdForProfile,
  getWebhookCompletionRecord: mocks.getWebhookCompletionRecord,
  getWebhookCertificateIssue: mocks.getWebhookCertificateIssue,
  getWebhookExerciseDetails: mocks.getWebhookExerciseDetails,
  getWebhookLessonSection: mocks.getWebhookLessonSection,
  getWebhookSubmissionDetails: mocks.getWebhookSubmissionDetails,
  getWebhookLatestSubmissionScore: mocks.getWebhookLatestSubmissionScore,
  getWebhookCohortName: mocks.getWebhookCohortName
}));

vi.mock('@cio/db/queries/course/course', () => ({ getCourseProgress: mocks.getCourseProgress }));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationById: mocks.getOrganizationById }));
vi.mock('@cio/core/config/env', () => ({ env: { DASHBOARD_ORIGIN: undefined, NODE_ENV: 'production' } }));

import { enrichWebhookEventData } from '@cio/core/services/webhook/enrich';
import { ZWebhookEventData, ZWebhookEventInput } from '@cio/utils/validation/webhook/events';
import { WEBHOOK_EVENT_TYPES, type TWebhookEventType } from '@cio/utils/constants/webhook';

const ids = {
  org: '1a1dcddd-1abc-4f72-b644-0bd18191a289',
  course: '000000c1-0000-4000-8000-0000000000c1',
  profile: '000000b1-0000-4000-8000-0000000000b1',
  actor: '000000b2-0000-4000-8000-0000000000b2',
  member: '000000d1-0000-4000-8000-0000000000d1',
  invite: '000000e1-0000-4000-8000-0000000000e1',
  submission: '000000f1-0000-4000-8000-0000000000f1',
  exercise: '000000f2-0000-4000-8000-0000000000f2',
  lesson: '000000f3-0000-4000-8000-0000000000f3',
  cohort: '000000a5-0000-4000-8000-0000000000a5',
  record: '000000a1-0000-4000-8000-0000000000a1'
};

const memberSource = {
  method: 'invite',
  inviteId: ids.invite,
  inviteLinkId: null,
  cohortId: null,
  programId: null,
  apiKeyId: null
};

const certificate = {
  id: null,
  displayId: 'ACME-2026-0042',
  issuedAt: '2026-10-13T12:15:30.000Z',
  expiresAt: null,
  cycleNumber: null,
  status: 'valid'
};

const submissionInput = {
  courseId: ids.course,
  submissionId: ids.submission,
  exerciseId: ids.exercise,
  memberId: ids.member,
  profileId: ids.profile,
  statusId: 3,
  gradingState: 'completed',
  total: 8
};

const organizationMemberInput = {
  memberId: '12',
  profileId: ids.profile,
  email: 'alex@example.com',
  roleId: 2,
  status: 'ACTIVE',
  actorProfileId: ids.actor
};

const cohortMemberInput = {
  cohortId: ids.cohort,
  memberId: ids.member,
  profileId: ids.profile,
  email: null,
  roleId: 3,
  actorProfileId: ids.actor
};

const inputs: Record<TWebhookEventType, Record<string, unknown>> = {
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
  'course.member.added': {
    courseId: ids.course,
    memberId: ids.member,
    profileId: ids.profile,
    email: null,
    roleId: 3,
    enrolledAt: '2026-10-01T09:00:00.000Z',
    source: memberSource,
    actorProfileId: null
  },
  'course.member.removed': {
    courseId: ids.course,
    memberId: ids.member,
    profileId: null,
    email: 'p@b.co',
    roleId: 2,
    enrolledAt: null,
    actorProfileId: ids.actor,
    reason: null,
    progressAtRemoval: { percent: 40, completed: false, lastActiveAt: null }
  },
  'course.completed': { courseId: ids.course, memberId: ids.member, profileId: ids.profile, completedAt: 'now' },
  'course.certificate.issued': {
    courseId: ids.course,
    memberId: ids.member,
    profileId: ids.profile,
    completedAt: 'now',
    certificate
  },
  'course.submission.created': { ...submissionInput, statusId: 1, gradingState: 'queued', total: null },
  'course.submission.status_changed': {
    ...submissionInput,
    exerciseId: null,
    previousStatusId: 2,
    previousGradingState: 'awaiting_manual',
    actorProfileId: ids.actor
  },
  'lesson.completion.updated': { courseId: ids.course, lessonId: ids.lesson, profileId: ids.profile, isComplete: true },
  'exercise.completion.updated': {
    courseId: ids.course,
    exerciseId: ids.exercise,
    memberId: ids.member,
    profileId: null,
    isComplete: false
  },
  'compliance.record.status_changed': {
    courseId: ids.course,
    recordId: ids.record,
    memberId: ids.member,
    profileId: ids.profile,
    cycleNumber: 2,
    actorProfileId: null,
    status: 'in_grace_period',
    previousStatus: 'expiring_soon',
    trigger: 'expiry_scan',
    dueDate: '2026-10-31T00:00:00.000Z',
    validUntil: null
  },
  'compliance.record.waived': {
    courseId: ids.course,
    recordId: ids.record,
    memberId: ids.member,
    profileId: ids.profile,
    cycleNumber: 1,
    actorProfileId: ids.actor,
    reason: 'Medical leave',
    waiverExpiresAt: null
  },
  'organization.member.added': organizationMemberInput,
  'organization.member.removed': organizationMemberInput,
  'organization.member.updated': {
    ...organizationMemberInput,
    changes: { roleId: { from: 3, to: 2 } }
  },
  'course.published': { courseId: ids.course, actorProfileId: ids.actor },
  'course.unpublished': { courseId: ids.course, actorProfileId: null },
  'cohort.member.added': cohortMemberInput,
  'cohort.member.removed': cohortMemberInput,
  'lesson.session.scheduled': {
    courseId: ids.course,
    lessonId: ids.lesson,
    startsAt: '2026-11-01T10:00:00.000Z',
    previousStartsAt: '2026-10-25T10:00:00.000Z',
    callUrl: 'https://meet.example.com/abc',
    actorProfileId: ids.actor
  },
  'course.payment_request.created': {
    courseId: ids.course,
    profileId: null,
    email: 'new@example.com',
    studentName: 'New Student'
  }
};

const fullContext = () => ({
  profiles: new Map([
    [ids.profile, { name: 'Alex Johnson', email: 'alex@example.com', externalId: 'EMP-10482' }],
    [ids.actor, { name: 'Sam Rivera', email: 'sam@example.com', externalId: null }]
  ]),
  statusLabels: new Map([
    [1, 'queued'],
    [2, 'in_progress'],
    [3, 'graded']
  ]),
  course: {
    title: 'Intro to Data Science',
    slug: 'intro-to-data-science',
    type: 'SELF_PACED',
    isPublished: true,
    cost: 0,
    currency: 'USD',
    tags: ['data']
  },
  exercise: { title: 'Week 1 quiz' },
  lesson: { title: 'Getting started' }
});

const exerciseDetails = {
  maxScore: 10,
  passThreshold: 70,
  dueBy: '2026-10-15T23:59:00.000Z',
  allowMultipleAttempts: true,
  sectionId: 'section-1',
  sectionTitle: 'Week 1'
};

function stubDetails() {
  mocks.getOrganizationById.mockResolvedValue({
    siteName: 'acme',
    customDomain: null,
    isCustomDomainVerified: false
  });
  mocks.getCourseProgress.mockResolvedValue({
    groupMemberId: ids.member,
    lessonsCount: 4,
    lessonsCompleted: 2,
    exercisesCount: 1,
    exercisesCompleted: 1
  });
  mocks.getWebhookCourseInviteDetails.mockResolvedValue({
    roleId: 3,
    expiresAt: '2026-11-01T00:00:00.000Z',
    maxUses: 10,
    usedCount: 2,
    allowedDomains: ['example.com'],
    acceptedByProfileId: null
  });
  mocks.getWebhookOrganizationInviteDetails.mockResolvedValue({
    roleId: 2,
    expiresAt: '2026-11-01T00:00:00.000Z',
    maxUses: null,
    usedCount: null,
    allowedDomains: null,
    acceptedByProfileId: ids.actor
  });
  mocks.getWebhookMemberDetails.mockResolvedValue({
    memberId: ids.member,
    enrolledAt: '2026-10-01T09:00:00.000Z',
    profileId: ids.profile
  });
  mocks.getWebhookMemberIdForProfile.mockResolvedValue(ids.member);
  mocks.getWebhookCompletionRecord.mockResolvedValue({
    cycleNumber: 2,
    startedAt: '2026-10-02T09:00:00.000Z',
    completedAt: '2026-10-13T12:15:30.000Z',
    dueDate: '2026-10-31T00:00:00.000Z',
    validUntil: '2027-10-13T12:15:30.000Z',
    score: 92,
    attempts: 1,
    timeSpentMinutes: 45
  });
  mocks.getWebhookCertificateIssue.mockResolvedValue(null);
  mocks.getWebhookExerciseDetails.mockResolvedValue(exerciseDetails);
  mocks.getWebhookLessonSection.mockResolvedValue({ id: 'section-1', title: 'Week 1' });
  mocks.getWebhookSubmissionDetails.mockResolvedValue({
    overallStatus: 'passed',
    gradingState: 'completed',
    gradedBy: ids.actor,
    submittedAt: '2026-10-13T11:58:02.000Z',
    updatedAt: '2026-10-13T12:10:44.000Z',
    attemptNumber: 2
  });
  mocks.getWebhookLatestSubmissionScore.mockResolvedValue(8);
  mocks.getWebhookCohortName.mockResolvedValue('Fall 2026');
}

describe('webhook event enrichment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getWebhookEventContext.mockResolvedValue(fullContext());
    stubDetails();
  });

  it('has a sample input for every event type', () => {
    expect(Object.keys(inputs).sort()).toEqual([...WEBHOOK_EVENT_TYPES].sort());
  });

  it.each([...WEBHOOK_EVENT_TYPES])('%s enriches into its delivered schema', async (eventType) => {
    const input = ZWebhookEventInput[eventType].parse(inputs[eventType]);
    const enriched = await enrichWebhookEventData(ids.org, eventType, input);

    expect(() => ZWebhookEventData[eventType].parse(enriched)).not.toThrow();
    expect(enriched).toMatchObject(input);
  });

  it('adds readable student, course and exercise details', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );

    expect(enriched.student).toEqual({
      id: ids.profile,
      name: 'Alex Johnson',
      email: 'alex@example.com',
      externalId: 'EMP-10482'
    });
    expect(enriched.course).toEqual({
      id: ids.course,
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    });
  });

  it('prefers the email recorded on the event over the profile email', async () => {
    const enriched = await enrichWebhookEventData(ids.org, 'course.member.added', {
      ...inputs['course.member.added'],
      email: 'invited@example.com'
    });

    expect(enriched.student).toMatchObject({ email: 'invited@example.com' });
  });

  it('labels the role next to roleId', async () => {
    const roles = await Promise.all(
      [1, 2, 3].map((roleId) =>
        enrichWebhookEventData(ids.org, 'course.member.added', { ...inputs['course.member.added'], roleId })
      )
    );

    expect(roles.map((enriched) => enriched.role)).toEqual(['admin', 'tutor', 'student']);
  });

  it('labels the submission status next to statusId and previousStatusId', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.status_changed',
      inputs['course.submission.status_changed']
    );

    expect(enriched).toMatchObject({ status: 'graded', previousStatus: 'in_progress' });
  });

  it('grades a submission against the exercise maximum and pass threshold', async () => {
    const enriched = await enrichWebhookEventData(ids.org, 'course.submission.status_changed', {
      ...inputs['course.submission.status_changed'],
      exerciseId: ids.exercise
    });

    expect(enriched).toMatchObject({
      percentage: 80,
      passed: true,
      attemptNumber: 2,
      overallStatus: 'passed',
      isLate: false,
      gradedAt: '2026-10-13T12:10:44.000Z'
    });
  });

  it('names the reviewer who graded the submission', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );

    expect(enriched.reviewer).toEqual({
      id: ids.actor,
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    });
  });

  it('sets the reviewer to null when nobody graded the submission', async () => {
    mocks.getWebhookSubmissionDetails.mockResolvedValue({
      overallStatus: 'manual_required',
      gradingState: 'queued',
      gradedBy: null,
      submittedAt: '2026-10-13T11:58:02.000Z',
      updatedAt: '2026-10-13T11:58:02.000Z',
      attemptNumber: 1
    });
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );

    expect(enriched).toMatchObject({ reviewer: null, gradedAt: null });
  });

  it('rounds the percentage to a whole number before comparing it with the threshold', async () => {
    mocks.getWebhookExerciseDetails.mockResolvedValue({ ...exerciseDetails, maxScore: 1000 });
    const enriched = await enrichWebhookEventData(ids.org, 'course.submission.created', {
      ...inputs['course.submission.created'],
      total: 696
    });

    expect(enriched).toMatchObject({ percentage: 69.6, passed: true });
  });

  it('adds the exercise grading settings to a submission', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );

    expect(enriched.exercise).toEqual({
      id: ids.exercise,
      title: 'Week 1 quiz',
      maxScore: 10,
      passThreshold: 70,
      dueBy: '2026-10-15T23:59:00.000Z',
      allowMultipleAttempts: true
    });
  });

  it('marks a submission made after the deadline as late', async () => {
    mocks.getWebhookExerciseDetails.mockResolvedValue({ ...exerciseDetails, dueBy: '2026-10-01T00:00:00.000Z' });
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );

    expect(enriched.isLate).toBe(true);
  });

  it('leaves percentage and passed empty when the exercise has no points', async () => {
    mocks.getWebhookExerciseDetails.mockResolvedValue({ ...exerciseDetails, maxScore: 0 });
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );

    expect(enriched).toMatchObject({ percentage: null, passed: null });
  });

  it('adds the invite grants and acceptor', async () => {
    const course = await enrichWebhookEventData(ids.org, 'course.invite.created', inputs['course.invite.created']);
    const organization = await enrichWebhookEventData(
      ids.org,
      'organization.invite.accepted',
      inputs['organization.invite.accepted']
    );

    expect(course).toMatchObject({ role: 'student', maxUses: 10, usedCount: 2, allowedDomains: ['example.com'] });
    expect(organization).toMatchObject({ role: 'tutor', acceptedBy: { id: ids.actor, name: 'Sam Rivera' } });
  });

  it('adds timing, score and progress to a completion', async () => {
    const enriched = await enrichWebhookEventData(ids.org, 'course.completed', inputs['course.completed']);

    expect(enriched).toMatchObject({
      enrolledAt: '2026-10-01T09:00:00.000Z',
      startedAt: '2026-10-02T09:00:00.000Z',
      score: 92,
      attempts: 1,
      timeSpentMinutes: 45,
      progress: { lessonsCompleted: 2, lessonsTotal: 4, exercisesCompleted: 1, exercisesTotal: 1, percent: 60 },
      compliance: { cycleNumber: 2, completedLate: false }
    });
  });

  it('sets compliance to null for a course without compliance cycles', async () => {
    mocks.getWebhookCompletionRecord.mockResolvedValue(null);
    const enriched = await enrichWebhookEventData(ids.org, 'course.completed', inputs['course.completed']);

    expect(enriched).toMatchObject({ compliance: null, startedAt: null, score: null });
  });

  it('adds the certificate download link', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.certificate.issued',
      inputs['course.certificate.issued']
    );

    expect(enriched.certificate).toMatchObject({
      displayId: 'ACME-2026-0042',
      downloadUrl: expect.stringContaining(`/courses/${ids.course}/certificates`)
    });
  });

  it('adds the section and course progress to lesson and exercise completions', async () => {
    const lesson = await enrichWebhookEventData(
      ids.org,
      'lesson.completion.updated',
      inputs['lesson.completion.updated']
    );
    const exercise = await enrichWebhookEventData(ids.org, 'exercise.completion.updated', {
      ...inputs['exercise.completion.updated'],
      profileId: ids.profile
    });

    expect(lesson).toMatchObject({
      memberId: ids.member,
      lesson: { id: ids.lesson, section: { id: 'section-1', title: 'Week 1' } },
      courseProgress: { percent: 60 }
    });
    expect(exercise).toMatchObject({ score: 8, passed: true, courseProgress: { percent: 60 } });
  });

  it('adds deep links for staff and students', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.submission.created',
      inputs['course.submission.created']
    );
    const links = enriched.links as { dashboard: string; student: string };

    expect(links.dashboard).toContain(`/courses/${ids.course}/submissions?id=${ids.submission}`);
    expect(links.student).toContain(`/courses/${ids.course}`);
  });

  it('names the person of an organization member event member', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'organization.member.updated',
      inputs['organization.member.updated']
    );

    expect(enriched).toMatchObject({ member: { id: ids.profile }, role: 'tutor', actor: { id: ids.actor } });
    expect(enriched).not.toHaveProperty('student');
  });

  it('names the cohort', async () => {
    const enriched = await enrichWebhookEventData(ids.org, 'cohort.member.added', inputs['cohort.member.added']);

    expect(enriched.cohort).toEqual({ id: ids.cohort, name: 'Fall 2026' });
  });

  it('uses the requester name when the payment request has no account', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'course.payment_request.created',
      inputs['course.payment_request.created']
    );

    expect(enriched.student).toEqual({ id: null, name: 'New Student', email: 'new@example.com', externalId: null });
  });

  it('sets actor to null when nobody triggered the event', async () => {
    const enriched = await enrichWebhookEventData(
      ids.org,
      'organization.invite.accepted',
      inputs['organization.invite.accepted']
    );

    expect(enriched.actor).toBeNull();
  });

  it('returns null names and titles when the records no longer exist', async () => {
    mocks.getWebhookEventContext.mockResolvedValue({
      profiles: new Map(),
      course: null,
      statusLabels: new Map(),
      exercise: null,
      lesson: null
    });
    const enriched = await enrichWebhookEventData(
      ids.org,
      'lesson.completion.updated',
      inputs['lesson.completion.updated']
    );

    expect(enriched.student).toEqual({ id: ids.profile, name: null, email: null, externalId: null });
    expect(enriched.course).toMatchObject({ id: ids.course, title: null, type: null, tags: [] });
    expect(enriched.lesson).toMatchObject({ id: ids.lesson, title: null });
  });

  it('still returns the event when loading the details fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.values(mocks).forEach((mock) => mock.mockRejectedValue(new Error('db down')));
    const enriched = await enrichWebhookEventData(ids.org, 'course.completed', inputs['course.completed']);

    expect(enriched).toMatchObject(inputs['course.completed']);
    expect(enriched.student).toEqual({ id: ids.profile, name: null, email: null, externalId: null });
    expect(enriched).toMatchObject({ progress: null, compliance: null, startedAt: null });
  });
});
