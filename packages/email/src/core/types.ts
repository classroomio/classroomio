import * as z from 'zod';

import type { EmailId } from '../utils/types';
import type { TEmailTemplateLocale } from '@cio/utils/constants';

/**
 * Base email template interface
 */
export interface EmailTemplate<TSchema extends z.ZodType = z.ZodType> {
  subject: string;
  schema: TSchema;
  render: (fields: z.infer<TSchema>) => string;
  from?: string;
  replyTo?: string;
}

/**
 * Email definition with ID for registry
 */
export interface EmailDefinition<TSchema extends z.ZodType = z.ZodType> {
  id: EmailId;
  template: EmailTemplate<TSchema>;
}

/**
 * Configuration for sending an email
 */
export interface SendConfig<TSchema extends z.ZodType = z.ZodType> {
  to: string;
  fields: z.infer<TSchema>;
  from?: string;
  replyTo?: string;
  context?: SendContext;
}

/**
 * Internal send configuration with template
 */
export interface SendTemplateConfig<TSchema extends z.ZodType = z.ZodType> extends SendConfig<TSchema> {
  template: EmailTemplate<TSchema>;
  contentOverride?: string;
  subjectOverride?: string;
}

/**
 * Configuration for defining an email template
 */
export interface DefineEmailConfig<TSchema extends z.ZodType = z.ZodType> {
  id: EmailId;
  subject: string;
  schema: TSchema;
  render: (fields: z.infer<TSchema>) => string;
  from?: string;
  replyTo?: string;
}

export interface SendContext {
  organizationId?: string;
  locale?: TEmailTemplateLocale;
}

export interface EmailTemplateResolverInput {
  emailId: EmailId;
  organizationId: string;
  locale?: TEmailTemplateLocale;
}

export interface ResolvedEmailTemplateOverride {
  isEnabled: boolean;
  logoUrl?: string | null;
  content?: string | null;
}

export type EmailTemplateResolver = (
  input: EmailTemplateResolverInput
) => Promise<ResolvedEmailTemplateOverride | null>;
