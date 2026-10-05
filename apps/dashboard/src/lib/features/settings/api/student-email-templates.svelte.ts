import { isEmailLocale, isStudentEmailId } from '@cio/utils/email';
import type {
  EmailLocale,
  StudentEmailId,
  StudentEmailTemplateOverride,
  StudentEmailTemplateOverrides
} from '@cio/utils/email';
import { orgApi } from '$features/org/api/org.svelte';
import type { StudentEmailTemplateRecord, StudentEmailTemplateTestDraft } from '$features/org/utils/types';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * Returns a copy of `overrides` with one email/locale entry set, or removed when `override` is undefined.
 */
function withOverride(
  overrides: StudentEmailTemplateOverrides,
  emailId: StudentEmailId,
  locale: EmailLocale,
  override: StudentEmailTemplateOverride | undefined
): StudentEmailTemplateOverrides {
  const localeOverrides = { ...overrides[emailId], [locale]: override };
  if (!override) delete localeOverrides[locale];

  const next = { ...overrides, [emailId]: localeOverrides };
  if (Object.keys(localeOverrides).length === 0) delete next[emailId];

  return next;
}

class StudentEmailTemplatesApi {
  drafts = $state<StudentEmailTemplateOverrides>({});
  saved = $state<StudentEmailTemplateOverrides>({});
  editedTemplateIds = $state<StudentEmailId[]>([]);
  isSaving = $state(false);
  isSendingTest = $state(false);

  private organizationId = '';

  async load(organizationId: string, locale: EmailLocale) {
    this.organizationId = organizationId;
    this.drafts = {};
    this.saved = {};
    this.editedTemplateIds = [];

    const result = await orgApi.listStudentEmailTemplates();
    if (!result || this.organizationId !== organizationId) return;

    const draftsEditedWhileLoading = this.drafts;
    this.saved = this.mapRecords(result.data);
    this.drafts = this.clone(this.saved);
    for (const emailId of Object.keys(draftsEditedWhileLoading).filter(isStudentEmailId)) {
      this.drafts[emailId] = { ...this.drafts[emailId], ...draftsEditedWhileLoading[emailId] };
    }
    this.editedTemplateIds = result.data
      .filter((record) => record.locale === locale && record.isCustomized)
      .map((record) => record.emailId)
      .filter(isStudentEmailId);
  }

  hasChanges(emailId: StudentEmailId, locale: EmailLocale) {
    return JSON.stringify(this.drafts[emailId]?.[locale]) !== JSON.stringify(this.saved[emailId]?.[locale]);
  }

  isEdited(emailId: StudentEmailId) {
    return this.editedTemplateIds.includes(emailId);
  }

  updateContent(emailId: StudentEmailId, locale: EmailLocale, content: string) {
    this.drafts[emailId] = {
      ...this.drafts[emailId],
      [locale]: { ...this.drafts[emailId]?.[locale], content }
    };
  }

  updateSubject(emailId: StudentEmailId, locale: EmailLocale, subject: string, defaultContent: string) {
    this.drafts[emailId] = {
      ...this.drafts[emailId],
      [locale]: {
        ...this.drafts[emailId]?.[locale],
        content: this.drafts[emailId]?.[locale]?.content ?? defaultContent,
        subject
      }
    };
  }

  resetDraft(emailId: StudentEmailId, locale: EmailLocale) {
    this.drafts = withOverride(this.drafts, emailId, locale, undefined);
  }

  discard() {
    this.drafts = this.clone(this.saved);
  }

  async save(emailId: StudentEmailId, locale: EmailLocale, defaultSubject: string) {
    if (this.isSaving) return;

    const previousOverride = this.saved[emailId]?.[locale];
    const nextOverride = this.drafts[emailId]?.[locale];
    if (JSON.stringify(previousOverride) === JSON.stringify(nextOverride)) return;

    const organizationId = this.organizationId;
    this.isSaving = true;
    try {
      const result =
        nextOverride === undefined
          ? await orgApi.resetStudentEmailTemplate(emailId, locale)
          : await orgApi.saveStudentEmailTemplate(
              emailId,
              locale,
              nextOverride.content,
              nextOverride.subject === defaultSubject ? null : nextOverride.subject
            );
      if (!result || this.organizationId !== organizationId) return;

      const savedTemplate = 'content' in result.data ? result.data : undefined;
      const savedOverride = savedTemplate
        ? { content: savedTemplate.content, subject: savedTemplate.subject ?? undefined }
        : undefined;
      const draftUnchangedDuringSave = JSON.stringify(this.drafts[emailId]?.[locale]) === JSON.stringify(nextOverride);

      this.saved = withOverride(this.saved, emailId, locale, savedOverride);
      if (draftUnchangedDuringSave) this.drafts = withOverride(this.drafts, emailId, locale, savedOverride);
      this.editedTemplateIds = savedTemplate?.isCustomized
        ? [...new Set([...this.editedTemplateIds, emailId])]
        : this.editedTemplateIds.filter((savedId) => savedId !== emailId);
    } finally {
      this.isSaving = false;
    }
  }

  async sendTest(emailId: StudentEmailId, locale: EmailLocale, draft: StudentEmailTemplateTestDraft) {
    if (this.isSendingTest) return;

    this.isSendingTest = true;
    try {
      const result = await orgApi.sendStudentEmailTemplateTest(emailId, locale, draft);
      if (result) snackbar.success('settings.emails.test_sent');
    } finally {
      this.isSendingTest = false;
    }
  }

  private mapRecords(records: StudentEmailTemplateRecord[]): StudentEmailTemplateOverrides {
    return records.reduce<StudentEmailTemplateOverrides>((overrides, record) => {
      const emailId = record.emailId;
      const locale = record.locale;
      if (!isStudentEmailId(emailId) || !isEmailLocale(locale)) return overrides;

      overrides[emailId] = {
        ...overrides[emailId],
        [locale]: { content: record.content, subject: record.subject ?? undefined }
      };
      return overrides;
    }, {});
  }

  private clone(overrides: StudentEmailTemplateOverrides): StudentEmailTemplateOverrides {
    return JSON.parse(JSON.stringify(overrides)) as StudentEmailTemplateOverrides;
  }
}

export const studentEmailTemplatesApi = new StudentEmailTemplatesApi();
