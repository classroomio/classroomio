import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListEmailTemplatesRequest = (typeof classroomio.organization)['email-templates']['$get'];
export type GetEmailTemplateRequest = (typeof classroomio.organization)['email-templates'][':emailId']['$get'];
export type UpsertEmailTemplateRequest = (typeof classroomio.organization)['email-templates'][':emailId']['$put'];
export type DeleteEmailTemplateRequest = (typeof classroomio.organization)['email-templates'][':emailId']['$delete'];
export type PreviewEmailTemplateRequest =
  (typeof classroomio.organization)['email-templates'][':emailId']['preview']['$post'];

export type ListEmailTemplatesResponse = InferResponseType<ListEmailTemplatesRequest>;
export type ListEmailTemplatesSuccess = Extract<ListEmailTemplatesResponse, { success: true }>;
export type EmailTemplateListData = ListEmailTemplatesSuccess['data'];
export type EmailTemplateCatalogItem = EmailTemplateListData['catalog'][number];
export type OrganizationEmailTemplateOverride = EmailTemplateListData['templates'][number];

export type GetEmailTemplateResponse = InferResponseType<GetEmailTemplateRequest>;
export type GetEmailTemplateSuccess = Extract<GetEmailTemplateResponse, { success: true }>;
export type EmailTemplateDetail = GetEmailTemplateSuccess['data'];

export type PreviewEmailTemplateResponse = InferResponseType<PreviewEmailTemplateRequest>;
export type PreviewEmailTemplateSuccess = Extract<PreviewEmailTemplateResponse, { success: true }>;
export type EmailTemplatePreviewData = PreviewEmailTemplateSuccess['data'];

export interface EmailTemplateDraft {
  isEnabled: boolean;
  logoUrl: string;
  content: string;
}
