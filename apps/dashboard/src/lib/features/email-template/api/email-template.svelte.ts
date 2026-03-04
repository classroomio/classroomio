import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { DEFAULT_EMAIL_TEMPLATE_LOCALE, type TEmailTemplateId, type TEmailTemplateLocale } from '@cio/utils/constants';
import { ZPreviewEmailTemplate, ZUpsertEmailTemplate } from '@cio/utils/validation/email-template';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

import { snackbar } from '$features/ui/snackbar/store';
import type {
  DeleteEmailTemplateRequest,
  EmailTemplateCatalogItem,
  EmailTemplateDraft,
  EmailTemplateDetail,
  ListEmailTemplatesRequest,
  OrganizationEmailTemplateOverride,
  PreviewEmailTemplateRequest,
  UpsertEmailTemplateRequest,
  GetEmailTemplateRequest
} from '../utils/types';
const emailTemplateClient = classroomio.organization['email-templates'];

class EmailTemplateApi extends BaseApiWithErrors {
  catalog = $state<EmailTemplateCatalogItem[]>([]);
  templates = $state<OrganizationEmailTemplateOverride[]>([]);
  selectedEmailId = $state<TEmailTemplateId | null>(null);
  selectedLocale = $state<TEmailTemplateLocale>(DEFAULT_EMAIL_TEMPLATE_LOCALE);
  detail = $state<EmailTemplateDetail | null>(null);
  draft = $state<EmailTemplateDraft>({
    isEnabled: true,
    logoUrl: '',
    content: ''
  });
  previewHtml = $state('');
  isPreviewLoading = $state(false);

  private hydrateDraft(detail: EmailTemplateDetail | null) {
    const sourceTemplate = detail?.template ?? detail?.resolvedTemplate;
    this.draft = {
      isEnabled: sourceTemplate?.isEnabled ?? true,
      logoUrl: sourceTemplate?.logoUrl ?? '',
      content: detail?.template?.content ?? ''
    };
  }

  async loadTemplates() {
    return this.execute<ListEmailTemplatesRequest>({
      requestFn: () => emailTemplateClient.$get(),
      logContext: 'listing email templates',
      onSuccess: (response) => {
        this.catalog = response.data.catalog;
        this.templates = response.data.templates;
      },
      onError: () => {
        snackbar.error('snackbar.email_templates.fetch_failed');
      }
    });
  }

  async selectTemplate(emailId: TEmailTemplateId, locale: TEmailTemplateLocale = this.selectedLocale) {
    this.selectedEmailId = emailId;
    this.selectedLocale = locale;

    return this.execute<GetEmailTemplateRequest>({
      requestFn: () =>
        emailTemplateClient[':emailId'].$get({
          param: { emailId },
          query: { locale }
        }),
      logContext: 'fetching email template detail',
      onSuccess: (response) => {
        this.detail = response.data;
        this.hydrateDraft(response.data);
      },
      onError: () => {
        snackbar.error('snackbar.email_templates.fetch_failed');
      }
    });
  }

  async saveSelectedTemplate() {
    if (!this.selectedEmailId) {
      return false;
    }

    const payload = {
      locale: this.selectedLocale,
      isEnabled: this.draft.isEnabled,
      logoUrl: this.draft.logoUrl.trim().length > 0 ? this.draft.logoUrl.trim() : null,
      content: this.draft.content.trim().length > 0 ? this.draft.content : null
    };

    const parsed = ZUpsertEmailTemplate.safeParse(payload);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return false;
    }

    let isSaved = false;

    await this.execute<UpsertEmailTemplateRequest>({
      requestFn: () =>
        emailTemplateClient[':emailId'].$put({
          param: { emailId: this.selectedEmailId! },
          json: parsed.data
        }),
      logContext: 'saving email template',
      onSuccess: async () => {
        isSaved = true;
        snackbar.success('snackbar.email_templates.saved');
        await this.loadTemplates();
        await this.selectTemplate(this.selectedEmailId!, this.selectedLocale);
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
          return;
        }

        snackbar.error('snackbar.email_templates.save_failed');
      }
    });

    return isSaved;
  }

  async resetSelectedTemplate() {
    if (!this.selectedEmailId) {
      return false;
    }

    let isReset = false;

    await this.execute<DeleteEmailTemplateRequest>({
      requestFn: () =>
        emailTemplateClient[':emailId'].$delete({
          param: { emailId: this.selectedEmailId! },
          query: { locale: this.selectedLocale }
        }),
      logContext: 'resetting email template override',
      onSuccess: async () => {
        isReset = true;
        snackbar.success('snackbar.email_templates.reset');
        await this.loadTemplates();
        await this.selectTemplate(this.selectedEmailId!, this.selectedLocale);
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
          return;
        }

        snackbar.error('snackbar.email_templates.reset_failed');
      }
    });

    return isReset;
  }

  async previewSelectedTemplate() {
    if (!this.selectedEmailId) {
      return;
    }

    const payload = {
      locale: this.selectedLocale,
      logoUrl: this.draft.logoUrl.trim().length > 0 ? this.draft.logoUrl.trim() : null,
      content: this.draft.content.trim().length > 0 ? this.draft.content : null
    };

    const parsed = ZPreviewEmailTemplate.safeParse(payload);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return;
    }

    this.isPreviewLoading = true;
    await this.execute<PreviewEmailTemplateRequest>({
      requestFn: () =>
        emailTemplateClient[':emailId'].preview.$post({
          param: { emailId: this.selectedEmailId! },
          json: parsed.data
        }),
      logContext: 'previewing email template',
      onSuccess: (response) => {
        this.previewHtml = response.data.html;
      },
      onError: () => {
        snackbar.error('snackbar.email_templates.preview_failed');
      }
    });
    this.isPreviewLoading = false;
  }
}

export const emailTemplateApi = new EmailTemplateApi();
