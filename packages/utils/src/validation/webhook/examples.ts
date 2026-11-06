import { WEBHOOK_API_VERSION, type TWebhookEventType } from '../../constants/webhook';
import type { TWebhookEventData } from './events';

export type TWebhookExampleOrganization = { id: string; name: string | null; siteName: string | null };

export const WEBHOOK_EXAMPLE_CREATED_AT = '2026-10-01T09:00:00.000Z';

export const WEBHOOK_EVENT_DATA_EXAMPLES: { [TEvent in TWebhookEventType]: TWebhookEventData<TEvent> } = {
  'organization.invite.created': {
    inviteId: '000000e1-0000-4000-8000-0000000000e1',
    email: 'tutor@example.com',
    actorProfileId: '000000b1-0000-4000-8000-0000000000b1',
    reason: null,
    actor: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    roleId: 2,
    role: 'tutor',
    expiresAt: '2026-11-01T00:00:00.000Z',
    acceptedBy: null,
    links: {
      dashboard: 'https://app.classroomio.com/org/acme/settings/teams',
      student: null
    }
  },
  'organization.invite.accepted': {
    inviteId: '000000e1-0000-4000-8000-0000000000e1',
    email: 'tutor@example.com',
    actorProfileId: '000000b1-0000-4000-8000-0000000000b1',
    reason: null,
    actor: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    roleId: 2,
    role: 'tutor',
    expiresAt: '2026-11-01T00:00:00.000Z',
    acceptedBy: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'tutor@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/org/acme/settings/teams',
      student: null
    }
  },
  'organization.invite.revoked': {
    inviteId: '000000e1-0000-4000-8000-0000000000e1',
    email: 'tutor@example.com',
    actorProfileId: '000000b1-0000-4000-8000-0000000000b1',
    reason: 'revoked',
    actor: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    roleId: 2,
    role: 'tutor',
    expiresAt: '2026-11-01T00:00:00.000Z',
    acceptedBy: null,
    links: {
      dashboard: 'https://app.classroomio.com/org/acme/settings/teams',
      student: null
    }
  },
  'course.invite.created': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    inviteId: '000000e1-0000-4000-8000-0000000000e1',
    email: 'student@example.com',
    actorProfileId: '000000b1-0000-4000-8000-0000000000b1',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    actor: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    roleId: 3,
    role: 'student',
    expiresAt: '2026-11-01T00:00:00.000Z',
    maxUses: 10,
    usedCount: 0,
    allowedDomains: ['example.com'],
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.invite.accepted': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    inviteId: '000000e1-0000-4000-8000-0000000000e1',
    email: 'student@example.com',
    actorProfileId: '000000b1-0000-4000-8000-0000000000b1',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    actor: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: null
    },
    roleId: 3,
    role: 'student',
    expiresAt: '2026-11-01T00:00:00.000Z',
    maxUses: 10,
    usedCount: 1,
    allowedDomains: ['example.com'],
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.invite.revoked': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    inviteId: '000000e1-0000-4000-8000-0000000000e1',
    email: 'student@example.com',
    actorProfileId: '000000b1-0000-4000-8000-0000000000b1',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    actor: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    roleId: 3,
    role: 'student',
    expiresAt: '2026-11-01T00:00:00.000Z',
    maxUses: 10,
    usedCount: 1,
    allowedDomains: ['example.com'],
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.member.added': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'student@example.com',
    roleId: 3,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    role: 'student',
    enrolledAt: '2026-10-01T09:00:00.000Z',
    source: {
      method: 'invite',
      inviteId: '000000e1-0000-4000-8000-0000000000e1',
      inviteLinkId: null,
      cohortId: null,
      programId: null,
      apiKeyId: null,
      oauthClientId: null
    },
    actorProfileId: null,
    actor: null,
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/people',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.member.removed': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'student@example.com',
    roleId: 3,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    role: 'student',
    enrolledAt: '2026-10-01T09:00:00.000Z',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    reason: null,
    progressAtRemoval: {
      percent: 83,
      completed: false,
      lastActiveAt: '2026-10-12T08:30:00.000Z'
    },
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/people',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.completed': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    completedAt: '2026-10-13T12:15:30.000Z',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    enrolledAt: '2026-10-01T09:00:00.000Z',
    startedAt: null,
    score: null,
    attempts: null,
    timeSpentMinutes: null,
    progress: {
      lessonsCompleted: 10,
      lessonsTotal: 10,
      exercisesCompleted: 2,
      exercisesTotal: 2,
      percent: 100
    },
    compliance: null,
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/people',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.certificate.issued': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    completedAt: '2026-10-13T12:15:30.000Z',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    enrolledAt: '2026-10-01T09:00:00.000Z',
    startedAt: null,
    score: null,
    attempts: null,
    timeSpentMinutes: null,
    progress: {
      lessonsCompleted: 10,
      lessonsTotal: 10,
      exercisesCompleted: 2,
      exercisesTotal: 2,
      percent: 100
    },
    compliance: null,
    certificate: {
      id: null,
      displayId: 'N\u00b0 0042',
      issuedAt: '2026-10-13T12:15:30.000Z',
      expiresAt: null,
      cycleNumber: null,
      status: 'valid',
      downloadUrl: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/certificates'
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/people',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.submission.created': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    submissionId: '000000f1-0000-4000-8000-0000000000f1',
    exerciseId: '000000f2-0000-4000-8000-0000000000f2',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    statusId: 1,
    status: 'Submitted',
    gradingState: 'queued',
    total: null,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    exercise: {
      id: '000000f2-0000-4000-8000-0000000000f2',
      title: 'Week 1 quiz',
      maxScore: 10,
      passThreshold: 70,
      dueBy: '2026-10-15T23:59:00.000Z',
      allowMultipleAttempts: true
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    percentage: null,
    passed: null,
    attemptNumber: 1,
    overallStatus: 'manual_required',
    submittedAt: '2026-10-13T11:58:02.000Z',
    gradedAt: null,
    isLate: false,
    links: {
      dashboard:
        'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/submissions?id=000000f1-0000-4000-8000-0000000000f1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    },
    reviewer: null
  },
  'course.submission.status_changed': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    submissionId: '000000f1-0000-4000-8000-0000000000f1',
    exerciseId: '000000f2-0000-4000-8000-0000000000f2',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    statusId: 3,
    status: 'Graded',
    gradingState: 'completed',
    total: 8,
    previousStatusId: 2,
    previousStatus: 'In Progress',
    previousGradingState: 'awaiting_manual',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    exercise: {
      id: '000000f2-0000-4000-8000-0000000000f2',
      title: 'Week 1 quiz',
      maxScore: 10,
      passThreshold: 70,
      dueBy: '2026-10-15T23:59:00.000Z',
      allowMultipleAttempts: true
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    percentage: 80,
    passed: true,
    attemptNumber: 2,
    overallStatus: 'passed',
    submittedAt: '2026-10-13T11:58:02.000Z',
    gradedAt: '2026-10-13T12:10:44.000Z',
    isLate: false,
    links: {
      dashboard:
        'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/submissions?id=000000f1-0000-4000-8000-0000000000f1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    },
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    reviewer: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    }
  },
  'lesson.completion.updated': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    lessonId: '000000f3-0000-4000-8000-0000000000f3',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    isComplete: true,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    lesson: {
      id: '000000f3-0000-4000-8000-0000000000f3',
      title: 'Getting started',
      section: {
        id: '000000a9-0000-4000-8000-0000000000a9',
        title: 'Week 1'
      }
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    courseProgress: {
      lessonsCompleted: 8,
      lessonsTotal: 10,
      exercisesCompleted: 2,
      exercisesTotal: 2,
      percent: 83
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'exercise.completion.updated': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    exerciseId: '000000f2-0000-4000-8000-0000000000f2',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    isComplete: true,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    exercise: {
      id: '000000f2-0000-4000-8000-0000000000f2',
      title: 'Week 1 quiz',
      section: {
        id: '000000a9-0000-4000-8000-0000000000a9',
        title: 'Week 1'
      }
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    score: 8,
    passed: true,
    courseProgress: {
      lessonsCompleted: 8,
      lessonsTotal: 10,
      exercisesCompleted: 2,
      exercisesTotal: 2,
      percent: 83
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'compliance.record.status_changed': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    recordId: '000000a1-0000-4000-8000-0000000000a1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    cycleNumber: 2,
    actorProfileId: null,
    status: 'in_grace_period',
    previousStatus: 'expiring_soon',
    trigger: 'expiry_scan',
    dueDate: '2026-10-31T00:00:00.000Z',
    validUntil: null,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'COMPLIANCE',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    actor: null,
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/compliance',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'compliance.record.waived': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    recordId: '000000a1-0000-4000-8000-0000000000a1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    cycleNumber: 2,
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    reason: 'Medical leave',
    waiverExpiresAt: '2027-01-31T00:00:00.000Z',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'COMPLIANCE',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/compliance',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'organization.member.added': {
    memberId: '12',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'tutor@example.com',
    roleId: 2,
    status: 'ACTIVE',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    member: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'tutor@example.com',
      externalId: null
    },
    role: 'tutor',
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/org/acme/settings/teams',
      student: null
    }
  },
  'organization.member.removed': {
    memberId: '12',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'tutor@example.com',
    roleId: 2,
    status: 'ACTIVE',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    member: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'tutor@example.com',
      externalId: null
    },
    role: 'tutor',
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/org/acme/settings/teams',
      student: null
    }
  },
  'organization.member.updated': {
    memberId: '12',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'tutor@example.com',
    roleId: 2,
    status: 'ACTIVE',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    changes: {
      roleId: {
        from: 3,
        to: 2
      }
    },
    member: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'tutor@example.com',
      externalId: null
    },
    role: 'tutor',
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/org/acme/settings/teams',
      student: null
    }
  },
  'course.published': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.unpublished': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: false,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'course.payment_request.created': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    profileId: null,
    email: 'new@example.com',
    studentName: 'New Student',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 49,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: null,
      name: 'New Student',
      email: 'new@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/people',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  },
  'cohort.member.added': {
    cohortId: '000000a5-0000-4000-8000-0000000000a5',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'student@example.com',
    roleId: 3,
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    cohort: {
      id: '000000a5-0000-4000-8000-0000000000a5',
      name: 'Fall 2026'
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    role: 'student',
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/cohorts/000000a5-0000-4000-8000-0000000000a5',
      student: 'https://acme.myclassroomio.com/cohorts/000000a5-0000-4000-8000-0000000000a5'
    }
  },
  'cohort.member.removed': {
    cohortId: '000000a5-0000-4000-8000-0000000000a5',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'student@example.com',
    roleId: 3,
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    cohort: {
      id: '000000a5-0000-4000-8000-0000000000a5',
      name: 'Fall 2026'
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    role: 'student',
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/cohorts/000000a5-0000-4000-8000-0000000000a5',
      student: 'https://acme.myclassroomio.com/cohorts/000000a5-0000-4000-8000-0000000000a5'
    }
  },
  'lesson.session.scheduled': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    lessonId: '000000f3-0000-4000-8000-0000000000f3',
    startsAt: '2026-11-01T10:00:00.000Z',
    previousStartsAt: '2026-10-25T10:00:00.000Z',
    callUrl: 'https://meet.example.com/abc',
    actorProfileId: '000000b2-0000-4000-8000-0000000000b2',
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    lesson: {
      id: '000000f3-0000-4000-8000-0000000000f3',
      title: 'Getting started'
    },
    actor: {
      id: '000000b2-0000-4000-8000-0000000000b2',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      externalId: null
    },
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  }
};

/**
 * A complete envelope for `eventType` built from its example data, shaped exactly like a live delivery.
 */
export function buildWebhookExampleEnvelope<TEvent extends TWebhookEventType>(
  eventType: TEvent,
  organization: TWebhookExampleOrganization
) {
  return {
    id: `evt_example_${eventType.replace(/\./g, '_')}`,
    type: eventType,
    createdAt: WEBHOOK_EXAMPLE_CREATED_AT,
    apiVersion: WEBHOOK_API_VERSION,
    organization,
    data: WEBHOOK_EVENT_DATA_EXAMPLES[eventType]
  };
}
