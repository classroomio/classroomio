import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMember: vi.fn(),
  getCourseMembers: vi.fn(),
  addCourseMember: vi.fn(),
  deleteCourseMember: vi.fn(),
  updateCourseMember: vi.fn(),
  getCourseTeachers: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn().mockResolvedValue('org-1')
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({ getProfileById: vi.fn() }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@api/services/course/session-invite', () => ({ getWelcomeSessionIcs: vi.fn() }));
vi.mock('@api/services/product-events', () => ({ captureLearnersEnrolled: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getDashboardBaseUrl: vi.fn(() => 'https://acme.classroomio.com') }));
vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitCourseMemberRemovedWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { addCourseMember, getCourseMember, updateCourseMember } from '@cio/db/queries/course/people';
import { getCourseWithOrgData } from '@cio/db/queries/course';
import { getProfileById } from '@cio/db/queries/auth';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { emitCourseMemberAddedWebhookEvent } from '@cio/core/services/webhook/emit';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { addMembers, updateMember } from '@api/services/course/people';

const uniqueViolation = new Error('Failed to add course member: duplicate key', {
  cause: { name: 'DrizzleQueryError', cause: { code: '23505', constraint_name: 'unique_group_email' } }
});

const mockCourseOrgData = () =>
  vi.mocked(getCourseWithOrgData).mockResolvedValue({
    orgId: 'org-1',
    orgName: 'Acme',
    orgSiteName: 'acme',
    groupId: 'group-1',
    courseTitle: 'Intro',
    welcomeEmailMessage: null
  } as Awaited<ReturnType<typeof getCourseWithOrgData>>);

const sentEmails = () =>
  vi.mocked(enqueueTransactionalEmail).mock.calls.map(([emailId, payload]) => ({ emailId, ...payload }));

describe('changing a member email to one already in the course', () => {
  it('updateMember returns 409 instead of a 500', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({ id: 'member-1', roleId: ROLE.STUDENT } as Awaited<
      ReturnType<typeof getCourseMember>
    >);
    vi.mocked(updateCourseMember).mockRejectedValue(uniqueViolation);

    await expect(updateMember('course-1', 'member-1', { email: 'taken@example.com' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'COURSE_MEMBER_EXISTS'
    });
  });
});

describe('adding a course member who is already in the course', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseOrgData();
    vi.mocked(addCourseMember).mockRejectedValue(uniqueViolation);
  });

  it('addMembers returns 409 instead of a 500', async () => {
    await expect(
      addMembers('course-1', [{ roleId: ROLE.TUTOR, email: 'tutor@example.com', name: 'Tutor' }])
    ).rejects.toMatchObject({ statusCode: 409, code: 'COURSE_MEMBER_EXISTS' });
  });

  it('addMembers rejects a student without a profileId instead of writing an email-only row', async () => {
    await expect(
      addMembers('course-1', [{ roleId: ROLE.STUDENT, email: 'student@example.com' }])
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(addCourseMember).not.toHaveBeenCalled();
  });
});

describe('adding a course member who already has a different role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseOrgData();
    vi.mocked(addCourseMember).mockResolvedValue({
      member: { id: 'member-1', groupId: 'group-1', roleId: ROLE.TUTOR },
      created: false
    } as never);
  });

  it('addMembers returns 409 instead of keeping the old role silently', async () => {
    await expect(
      addMembers('course-1', [{ roleId: ROLE.STUDENT, profileId: 'profile-1', email: 'student@example.com' }])
    ).rejects.toMatchObject({ statusCode: 409, code: 'COURSE_MEMBER_EXISTS' });
    expect(emitCourseMemberAddedWebhookEvent).not.toHaveBeenCalled();
  });
});

describe('adding a course member who is already in the course with the same role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseOrgData();
    vi.mocked(addCourseMember).mockImplementation(
      async (_courseId, member) =>
        ({ member: { id: 'member-1', groupId: 'group-1', ...member }, created: false }) as never
    );
    vi.mocked(enqueueTransactionalEmail).mockResolvedValue([] as never);
  });

  it('addMembers skips the existing membership without a webhook or welcome email but still ensures compliance', async () => {
    const addedMembers = await addMembers('course-1', [
      { roleId: ROLE.STUDENT, profileId: 'profile-1', email: 'student@example.com' }
    ]);

    expect(addedMembers).toEqual([]);
    expect(emitCourseMemberAddedWebhookEvent).not.toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    expect(ensureComplianceEnrollmentRecordsForProfiles).toHaveBeenCalledWith(['course-1'], ['profile-1']);
  });

  it('addMembers with rejectExisting returns 409 COURSE_MEMBER_EXISTS', async () => {
    await expect(
      addMembers(
        'course-1',
        [{ roleId: ROLE.STUDENT, profileId: 'profile-1', email: 'student@example.com' }],
        'public_api',
        {},
        { rejectExisting: true }
      )
    ).rejects.toMatchObject({ statusCode: 409, code: 'COURSE_MEMBER_EXISTS' });
    expect(emitCourseMemberAddedWebhookEvent).not.toHaveBeenCalled();
  });

  it('addMembers with rejectExisting still adds a new member', async () => {
    vi.mocked(addCourseMember).mockImplementation(
      async (_courseId, member) =>
        ({ member: { id: 'member-2', groupId: 'group-1', ...member }, created: true }) as never
    );

    const addedMembers = await addMembers(
      'course-1',
      [{ roleId: ROLE.STUDENT, profileId: 'profile-2' }],
      'public_api',
      {},
      { rejectExisting: true, sendEmail: false }
    );

    expect(addedMembers.map((member) => member.id)).toEqual(['member-2']);
    expect(emitCourseMemberAddedWebhookEvent).toHaveBeenCalledTimes(1);
  });
});

describe('welcome emails when adding course members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseOrgData();
    vi.mocked(addCourseMember).mockImplementation(
      async (_courseId, member) =>
        ({ member: { id: 'member-1', groupId: 'group-1', ...member }, created: true }) as never
    );
    vi.mocked(enqueueTransactionalEmail).mockResolvedValue([] as never);
    vi.mocked(getProfileById).mockResolvedValue({ email: 'ada@example.com', fullname: 'Ada' } as never);
  });

  it('sends a student the course welcome with the same key as Audience → Assign courses', async () => {
    await addMembers('course-1', [{ roleId: ROLE.STUDENT, profileId: 'profile-1' }]);

    expect(sentEmails()).toEqual([
      expect.objectContaining({
        emailId: 'studentCourseWelcome',
        to: 'ada@example.com',
        idempotencyKey: 'audience-course-welcome:group-1:profile-1',
        fields: expect.objectContaining({ orgName: 'Acme', courseName: 'Intro' }),
        preference: { organizationId: 'org-1', recipientProfileId: 'profile-1' }
      })
    ]);
  });

  it("sends to the profile's email when the given email belongs to someone else", async () => {
    await addMembers('course-1', [{ roleId: ROLE.STUDENT, profileId: 'profile-1', email: 'someone-else@example.com' }]);

    expect(sentEmails()).toEqual([expect.objectContaining({ to: 'ada@example.com' })]);
  });

  it('rejects the whole batch before inserting anything when a student has no profile', async () => {
    await expect(
      addMembers('course-1', [
        { roleId: ROLE.STUDENT, profileId: 'profile-1' },
        { roleId: ROLE.STUDENT, email: 'pending@example.com' }
      ])
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });

    expect(addCourseMember).not.toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('sends no email when sendEmail is false', async () => {
    await addMembers(
      'course-1',
      [
        { roleId: ROLE.STUDENT, profileId: 'profile-1' },
        { roleId: ROLE.TUTOR, email: 'tutor@example.com', name: 'Tutor' }
      ],
      'public_api',
      {},
      { sendEmail: false }
    );

    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('still sends a tutor the teacher welcome and not the student one', async () => {
    await addMembers('course-1', [{ roleId: ROLE.TUTOR, email: 'tutor@example.com', name: 'Tutor' }]);

    expect(sentEmails()).toEqual([
      expect.objectContaining({ emailId: 'teacherCourseWelcome', to: 'tutor@example.com' })
    ]);
  });

  it('keeps the member added when the email fails to queue', async () => {
    vi.mocked(enqueueTransactionalEmail).mockRejectedValue(new Error('queue down'));

    await expect(addMembers('course-1', [{ roleId: ROLE.STUDENT, profileId: 'profile-1' }])).resolves.toHaveLength(1);
  });
});
