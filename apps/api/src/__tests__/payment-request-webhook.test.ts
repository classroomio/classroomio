import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseWithOrgData: vi.fn(),
  getCourseTeachers: vi.fn(),
  getProfileByEmail: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  emitCourseWebhookEvent: vi.fn(),
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({ getCourseTeachers: mocks.getCourseTeachers }));
vi.mock('@cio/db/queries/course', () => ({ getCourseWithOrgData: mocks.getCourseWithOrgData }));
vi.mock('@cio/db/queries/auth', () => ({ getProfileByEmail: mocks.getProfileByEmail }));
vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: mocks.getOrganizationMemberIdByOrgAndProfile
}));
vi.mock('@cio/core/services/webhook/emit', () => ({ emitCourseWebhookEvent: mocks.emitCourseWebhookEvent }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getAppBaseUrl: () => 'https://app.test' }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: mocks.enqueueTransactionalEmail }));
vi.mock('@cio/analytics', () => ({ trackServerEvent: vi.fn(), SERVER_EVENTS: { ENROLLMENT_STARTED: 'x' } }));
vi.mock('@cio/email', () => ({
  buildEmailFromName: (name: string) => name,
  buildEmailBranding: () => ({})
}));

import { createPaymentRequest } from '@api/services/course/payment-request';

const request = { courseId: 'course-1', studentEmail: ' Ada@Example.com ', studentFullname: 'Ada' };

describe('createPaymentRequest webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseWithOrgData.mockResolvedValue({
      courseTitle: 'Course',
      orgName: 'Acme',
      orgId: 'org-1',
      groupId: 'group-1'
    });
    mocks.getCourseTeachers.mockResolvedValue([{ email: 'teacher@example.com' }]);
    mocks.enqueueTransactionalEmail.mockResolvedValue(undefined);
    mocks.emitCourseWebhookEvent.mockResolvedValue(undefined);
  });

  it('reports the profile only when the requester belongs to the organization', async () => {
    mocks.getProfileByEmail.mockResolvedValue({ id: 'profile-1' });
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(7);

    await createPaymentRequest(request);

    expect(mocks.getProfileByEmail).toHaveBeenCalledWith('ada@example.com');
    expect(mocks.emitCourseWebhookEvent).toHaveBeenCalledWith(
      'course-1',
      'course.payment_request.created',
      expect.objectContaining({ profileId: 'profile-1' })
    );
  });

  it('hides the profile of someone outside the organization', async () => {
    mocks.getProfileByEmail.mockResolvedValue({ id: 'profile-1' });
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);

    await createPaymentRequest(request);

    expect(mocks.emitCourseWebhookEvent).toHaveBeenCalledWith(
      'course-1',
      'course.payment_request.created',
      expect.objectContaining({ profileId: null })
    );
  });

  it('still succeeds when the requester lookup fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.getProfileByEmail.mockRejectedValue(new Error('db down'));

    await expect(createPaymentRequest(request)).resolves.toMatchObject({ success: true });
    expect(mocks.emitCourseWebhookEvent).not.toHaveBeenCalled();
  });
});
