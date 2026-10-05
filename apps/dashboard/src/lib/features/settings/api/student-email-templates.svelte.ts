import { isEmailLocale, isStudentEmailId } from '@cio/utils/email';
import type { EmailLocale, StudentEmailId, StudentEmailTemplateOverrides } from '@cio/utils/email';
import { orgApi } from '$features/org/api/org.svelte';
import type { StudentEmailTemplateRecord, StudentEmailTemplateTestDraft } from '$features/org/utils/types';
import { snackbar } from '$features/ui/snackbar/store';

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
    const templateOverrides = { ...this.drafts[emailId] };
    delete templateOverrides[locale];

    if (Object.keys(templateOverrides).length === 0) {
      delete this.drafts[emailId];
    } else {
      this.drafts[emailId] = templateOverrides;
    }

    this.drafts = { ...this.drafts };
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

      if (nextOverride === undefined) {
        this.editedTemplateIds = this.editedTemplateIds.filter((savedId) => savedId !== emailId);
      } else {
        const savedTemplate = result.data;
        this.drafts[emailId] = {
          ...this.drafts[emailId],
          [locale]: { content: savedTemplate.content, subject: savedTemplate.subject ?? undefined }
        };
        this.editedTemplateIds = savedTemplate.isCustomized
          ? [...new Set([...this.editedTemplateIds, emailId])]
          : this.editedTemplateIds.filter((savedId) => savedId !== emailId);
      }

      this.drafts = { ...this.drafts };
      this.saved = this.clone(this.drafts);
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
