import * as z from 'zod';

import { ZDeliverEmail, type TDeliverEmail } from '@cio/utils/validation/mail';
import { env } from './config/env';
import { sendWithZoho } from './utils/services/zeptomail';
import { sendWithNodemailer } from './utils/services/nodemailer';
import type { EmailResponse, EmailId, EmailSchemaFor } from './utils/types';
import type { DefineEmailConfig, EmailDefinition, EmailTemplate, SendConfig } from './core/types';
import { EmailRegistry } from './core/registry';
import { ZodError } from 'zod';
import { sendTemplateEmail } from './core/base';
import { EMAIL_FROM, EMAIL_REPLY_TO } from './utils/constants';

/**
 * Define an email template with schema validation
 * The email is automatically registered in the registry for use with sendEmail()
 *
 * @example
 * ```ts
 * export const forgotPasswordEmail = defineEmail({
 *   id: 'forgotPassword',
 *   subject: 'Password reset notification',
 *   schema: z.object({
 *     name: z.string(),
 *     link: z.url()
 *   }),
 *   render: (fields) => `Hello ${fields.name}, reset here: ${fields.link}`
 * });
 * ```
 */
export function defineEmail<TSchema extends z.ZodType>(config: DefineEmailConfig<TSchema>): EmailDefinition<TSchema> {
  const template: EmailTemplate<TSchema> = {
    subject: config.subject,
    schema: config.schema,
    render: config.render,
    from: config.from ?? EMAIL_FROM,
    replyTo: config.replyTo ?? EMAIL_REPLY_TO
  };

  // Auto-register in registry
  EmailRegistry.register(config.id, template);

  return {
    id: config.id,
    template
  };
}

/**
 * Send an email template using its registered ID
 *
 * This function looks up the template by ID, validates the fields against the template's schema,
 * renders the content, and delivers the email.
 *
 * The `fields` type is automatically inferred based on the `emailId` passed, providing
 * full type safety and autocomplete.
 *
 * @param emailId - The ID of the email template (type-safe, only valid IDs accepted)
 * @param config - Send configuration with recipient and fields (fields type is inferred from emailId)
 * @returns Promise resolving to email send results
 *
 * @example
 * ```ts
 * await sendEmail('forgotPassword', {
 *   to: 'user@example.com',
 *   fields: {
 *     name: 'John Doe',
 *     email: 'user@example.com',
 *     link: 'https://app.classroomio.com/reset?token=abc123'
 *   }
 * });
 * ```
 */
export async function sendEmail<TEmailId extends EmailId>(
  emailId: TEmailId,
  config: SendConfig<EmailSchemaFor<TEmailId>>
): Promise<EmailResponse[]> {
  const template = EmailRegistry.get(emailId);

  if (!template) {
    const availableIds = EmailRegistry.getAllIds();
    throw new Error(
      `Email template "${emailId}" not found. Available emails: ${availableIds.length > 0 ? availableIds.join(', ') : 'none registered'}`
    );
  }

  try {
    // Validate fields against template schema
    const validatedFields = template.schema.parse(config.fields);

    // Send using base function
    return sendTemplateEmail({
      to: config.to,
      template,
      fields: validatedFields,
      from: config.from ?? template.from,
      replyTo: config.replyTo ?? template.replyTo
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.log('error', error);
      const errorMessages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid fields for email "${emailId}": ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Deliver raw email data via email service (Zoho or Nodemailer)
 *
 * This is a low-level function that takes raw email data (to, subject, content, etc.)
 * and delivers it through the configured email service. Use sendEmail() for
 * sending template-based emails instead.
 *
 * @param args - Array of email data objects (to, subject, content, from, replyTo)
 * @returns Promise resolving to email delivery results
 */
export const deliverEmail = async (args: TDeliverEmail): Promise<EmailResponse[]> => {
  const emailItems = ZDeliverEmail.parse(args);

  const results = await Promise.all(
    emailItems.map(async (emailItem) => {
      try {
        const res = env.ZOHO_TOKEN ? await sendWithZoho(emailItem) : await sendWithNodemailer(emailItem);

        console.log('Email status', res);
        return res;
      } catch (error) {
        console.error('Error sending email:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        };
      }
    })
  );

  return results;
};
