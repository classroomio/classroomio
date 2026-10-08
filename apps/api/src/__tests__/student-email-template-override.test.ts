import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationStudentEmailTemplate: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

import { getStudentEmailDeliveryLocale, getStudentEmailSendContext } from '@cio/core/services/email/localization';
import { getActiveOrganizationPlan, getOrganizationStudentEmailTemplate } from '@cio/db/queries/organization';

const savedTemplate = { content: '<p>Bienvenue</p>', subject: 'Bienvenue' };

describe('getStudentEmailSendContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationStudentEmailTemplate).mockResolvedValue(savedTemplate);
  });

  it('keeps the queued locale and saved template for a paid organization', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'EARLY_ADOPTER' } as never);

    await expect(getStudentEmailSendContext('org-1', 'studentCourseWelcome', 'fr')).resolves.toEqual({
      locale: 'fr',
      templateOverride: savedTemplate
    });
  });

  it('sends the English default once the organization is back on the free plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'BASIC' } as never);

    await expect(getStudentEmailSendContext('org-1', 'studentCourseWelcome', 'fr')).resolves.toEqual({
      locale: 'en',
      templateOverride: undefined
    });
    expect(getOrganizationStudentEmailTemplate).not.toHaveBeenCalled();
  });

  it('sends the English default when a send-time lookup fails', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'EARLY_ADOPTER' } as never);
    vi.mocked(getOrganizationStudentEmailTemplate).mockRejectedValue(new Error('database unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getStudentEmailSendContext('org-1', 'studentCourseWelcome', 'fr')).resolves.toEqual({
      locale: 'en',
      templateOverride: undefined
    });
  });

  it('ignores emails that are not student templates', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'EARLY_ADOPTER' } as never);

    await expect(getStudentEmailSendContext('org-1', 'teacherStudentJoined', 'fr')).resolves.toEqual({
      locale: 'en',
      templateOverride: undefined
    });
  });
});

describe('getStudentEmailDeliveryLocale', () => {
  it('falls back to English when the plan lookup fails', async () => {
    vi.mocked(getActiveOrganizationPlan).mockRejectedValue(new Error('database unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getStudentEmailDeliveryLocale('org-1', 'studentOrgInvite')).resolves.toBe('en');
  });
});
