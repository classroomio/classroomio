import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/organization/student-email-templates', () => ({
  listStudentEmailTemplates: vi.fn(),
  saveStudentEmailTemplate: vi.fn(),
  resetStudentEmailTemplate: vi.fn(),
  sendStudentEmailTemplateTest: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { STUDENT_EMAIL_CATALOG, STUDENT_EMAIL_IDS } from '@cio/utils/email';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import {
  listStudentEmailTemplates,
  resetStudentEmailTemplate,
  saveStudentEmailTemplate,
  sendStudentEmailTemplateTest
} from '@api/services/organization/student-email-templates';
import {
  getEmailTemplateService,
  listEmailTemplatesService,
  resetEmailTemplateService,
  saveEmailTemplateService,
  sendTestEmailTemplateService
} from '@api/services/v1/organization/email-templates';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const PARAMS = { emailId: 'studentCourseWelcome', locale: 'fr' } as const;
const FR_WELCOME = STUDENT_EMAIL_CATALOG.fr.templates.studentCourseWelcome;

const savedFrWelcome = {
  organizationId: ORG_ID,
  emailId: 'studentCourseWelcome',
  locale: 'fr',
  content: '<p>Salut {{course_name}}</p>',
  subject: null,
  updatedAt: '2026-10-25T10:00:00.000Z',
  isCustomized: true
};
const savedEnWelcome = { ...savedFrWelcome, locale: 'en', subject: 'Welcome!' };

describe('services/v1/organization/email-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(listStudentEmailTemplates).mockResolvedValue([savedFrWelcome, savedEnWelcome] as never);
    vi.mocked(saveStudentEmailTemplate).mockResolvedValue(savedFrWelcome as never);
    vi.mocked(resetStudentEmailTemplate).mockResolvedValue(true);
    vi.mocked(sendStudentEmailTemplateTest).mockResolvedValue({ queued: true });
  });

  describe('who may call it', () => {
    const calls = {
      list: (actorId: string | null) =>
        listEmailTemplatesService(ORG_ID, actorId, { page: 1, limit: 20, locale: 'fr' }),
      get: (actorId: string | null) => getEmailTemplateService(ORG_ID, actorId, PARAMS),
      save: (actorId: string | null) => saveEmailTemplateService(ORG_ID, actorId, PARAMS, { content: '<p>x</p>' }),
      reset: (actorId: string | null) => resetEmailTemplateService(ORG_ID, actorId, PARAMS),
      test: (actorId: string | null) =>
        sendTestEmailTemplateService(ORG_ID, actorId, PARAMS, { recipientEmails: ['a@example.com'] })
    };

    it.each(Object.entries(calls))('%s rejects a key with no actor with 401', async (_name, call) => {
      await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
    });

    it.each(Object.entries(calls))('%s rejects a tutor with 403, like orgAdminMiddleware', async (_name, call) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(saveStudentEmailTemplate).not.toHaveBeenCalled();
      expect(resetStudentEmailTemplate).not.toHaveBeenCalled();
      expect(sendStudentEmailTemplateTest).not.toHaveBeenCalled();
    });

    it('checks the role in the key organization', async () => {
      await calls.get(ACTOR_ID);

      expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
    });
  });

  it('lists every student email in the locale, filling in defaults and leaving bodies out', async () => {
    const { items, pagination } = await listEmailTemplatesService(ORG_ID, ACTOR_ID, {
      page: 1,
      limit: 20,
      locale: 'fr'
    });

    expect(items.map((item) => item.emailId)).toEqual([...STUDENT_EMAIL_IDS]);
    expect(pagination).toEqual({ page: 1, limit: 20, total: STUDENT_EMAIL_IDS.length, totalPages: 1 });
    expect(items[0]).toEqual({
      emailId: 'studentCourseInvite',
      locale: 'fr',
      subject: STUDENT_EMAIL_CATALOG.fr.templates.studentCourseInvite.subject,
      isCustomized: false,
      updatedAt: null
    });
    expect(items.find((item) => item.emailId === 'studentCourseWelcome')).toEqual({
      emailId: 'studentCourseWelcome',
      locale: 'fr',
      subject: FR_WELCOME.subject,
      isCustomized: true,
      updatedAt: savedFrWelcome.updatedAt
    });
  });

  it('gets the saved body, the default subject when none is saved, and the allowed placeholders', async () => {
    expect(await getEmailTemplateService(ORG_ID, ACTOR_ID, PARAMS)).toEqual({
      emailId: 'studentCourseWelcome',
      locale: 'fr',
      subject: FR_WELCOME.subject,
      isCustomized: true,
      updatedAt: savedFrWelcome.updatedAt,
      content: savedFrWelcome.content,
      variables: ['org_name', 'course_name'],
      hasActionLink: true
    });
  });

  it('gets the default template when nothing is saved', async () => {
    vi.mocked(listStudentEmailTemplates).mockResolvedValue([]);

    expect(await getEmailTemplateService(ORG_ID, ACTOR_ID, { emailId: 'studentProvePayment', locale: 'en' })).toEqual(
      expect.objectContaining({
        content: STUDENT_EMAIL_CATALOG.en.templates.studentProvePayment.body,
        isCustomized: false,
        updatedAt: null,
        hasActionLink: false
      })
    );
  });

  it('saves through the dashboard service, so validation, sanitizing and the plan gate are the same', async () => {
    await saveEmailTemplateService(ORG_ID, ACTOR_ID, PARAMS, { content: '<p>x</p>', subject: null });

    expect(saveStudentEmailTemplate).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      emailId: 'studentCourseWelcome',
      locale: 'fr',
      content: '<p>x</p>',
      subject: null
    });
  });

  it('returns the default after a reset, even when nothing was saved', async () => {
    vi.mocked(resetStudentEmailTemplate).mockResolvedValue(false);

    const template = await resetEmailTemplateService(ORG_ID, ACTOR_ID, PARAMS);

    expect(resetStudentEmailTemplate).toHaveBeenCalledWith(ORG_ID, 'studentCourseWelcome', 'fr');
    expect(template).toMatchObject({ content: FR_WELCOME.body, subject: FR_WELCOME.subject, isCustomized: false });
  });

  it('tests the current template when no draft is sent', async () => {
    await sendTestEmailTemplateService(ORG_ID, ACTOR_ID, PARAMS, { recipientEmails: ['a@example.com'] });

    expect(sendStudentEmailTemplateTest).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      emailId: 'studentCourseWelcome',
      locale: 'fr',
      content: savedFrWelcome.content,
      subject: FR_WELCOME.subject,
      recipientEmails: ['a@example.com']
    });
  });

  it('tests a draft when one is sent', async () => {
    await sendTestEmailTemplateService(ORG_ID, ACTOR_ID, PARAMS, {
      recipientEmails: ['a@example.com'],
      content: '<p>Draft</p>',
      subject: 'Draft subject'
    });

    expect(sendStudentEmailTemplateTest).toHaveBeenCalledWith(
      expect.objectContaining({ content: '<p>Draft</p>', subject: 'Draft subject' })
    );
  });

  it('passes plan-gate errors through unchanged', async () => {
    const upgradeRequired = Object.assign(new Error('paid plan'), { statusCode: 403, code: 'UPGRADE_REQUIRED' });
    vi.mocked(saveStudentEmailTemplate).mockRejectedValue(upgradeRequired);

    await expect(saveEmailTemplateService(ORG_ID, ACTOR_ID, PARAMS, { content: '<p>x</p>' })).rejects.toBe(
      upgradeRequired
    );
  });
});
