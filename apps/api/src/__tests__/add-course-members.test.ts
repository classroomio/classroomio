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
      code: 'CONFLICT'
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
      addMembers('course-1', [{ roleId: ROLE.STUDENT, email: 'student@example.com' }])
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });
});

describe('welcome emails when adding course members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCourseOrgData();
    vi.mocked(addCourseMember).mockImplementation(
      async (_courseId, member) => ({ id: 'member-1', groupId: 'group-1', ...member }) as never
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

  it('sends to the given email when there is no profile yet', async () => {
    await addMembers('course-1', [{ roleId: ROLE.STUDENT, email: 'pending@example.com' }]);

    expect(getProfileById).not.toHaveBeenCalled();
    expect(sentEmails()).toEqual([
      expect.objectContaining({
        to: 'pending@example.com',
        idempotencyKey: 'course-people-student-welcome:course-1:pending@example.com'
      })
    ]);
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
