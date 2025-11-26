import * as z from 'zod';

import type { EmailId } from '../utils/types';

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
}

/**
 * Internal send configuration with template
 */
export interface SendTemplateConfig<TSchema extends z.ZodType = z.ZodType> extends SendConfig<TSchema> {
  template: EmailTemplate<TSchema>;
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
