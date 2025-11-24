import { extractNameAndEmail, nodemailerTransporter, withEmailTemplate, zohoClient } from '@api/utils/mail';

import type { TEmailData } from '@cio/utils/validation/mail';
import type { Transporter } from 'nodemailer';
import { env } from '@api/config/env';

interface EmailResponse {
  success: boolean;
  error?: string;
  details?: unknown;
}

let transporter: Transporter | null;

nodemailerTransporter().then((t: Transporter | null) => {
  transporter = t;
});

export async function sendWithNodemailer(emailData: TEmailData): Promise<EmailResponse> {
  const { from, to, subject, content, replyTo } = emailData;

  if (!transporter) {
    return {
      success: false,
      error: 'Email transporter not initialized'
    };
  }

  try {
    const result = await transporter.sendMail({
      from: from || env.SMTP_SENDER,
      to,
      subject,
      replyTo,
      html: withEmailTemplate(content)
    });

    return {
      success: true,
      details: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    };
  }
}

export async function sendWithZoho(emailData: TEmailData): Promise<EmailResponse> {
  const { from, to, subject, content } = emailData;

  const fromData = extractNameAndEmail(from || '');

  if (!fromData) {
    return {
      success: false,
      error: 'Invalid from data'
    };
  }

  try {
    const result = await zohoClient.sendMail({
      from: {
        address: fromData.email,
        name: fromData.name
      },
      to: [
        {
          email_address: {
            address: to
          }
        }
      ],
      subject,
      htmlbody: content
    });

    return {
      success: true,
      details: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    };
  }
}
