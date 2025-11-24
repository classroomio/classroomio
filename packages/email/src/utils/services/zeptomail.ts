import { EmailResponse } from '../types';
import { SendMailClient } from 'zeptomail';
import type { TEmailData } from '@cio/utils/validation/mail';
import { env } from '../../config/env';
import { extractNameAndEmail } from '../functions/email-helpers';

export const zohoClient = new SendMailClient({
  url: 'api.zeptomail.eu/',
  token: env.ZOHO_TOKEN!
});

export async function sendWithZoho(emailData: TEmailData): Promise<EmailResponse> {
  const { from, to, subject, content, replyTo } = emailData;

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
      htmlbody: content,
      reply_to: getReplyTo(replyTo)
    });

    return {
      success: true,
      details: result
    };
  } catch (error) {
    console.error('Error sending email with Zoho:', error);
    console.log(error.error.details?.[0]);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    };
  }
}

function getReplyTo(replyTo?: string): { address: string; name: string }[] | undefined {
  if (!replyTo) return undefined;

  const fromData = extractNameAndEmail(replyTo);
  if (!fromData) return undefined;

  return [
    {
      address: fromData.email,
      name: fromData.name
    }
  ];
}
