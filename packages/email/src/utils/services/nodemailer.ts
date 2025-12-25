import { EmailResponse } from '../types';
import type { TEmailData } from '@cio/utils/validation/mail';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env';
import nodemailer from 'nodemailer';

let transporter: Transporter | undefined;

const setupTransporter = async () => {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.error('SMTP configuration missing');
  }

  try {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    });

    await transporter.verify();

    return transporter;
  } catch (error) {
    console.error('Transporter error:', error);
  }
};

setupTransporter();

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
      html: content
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
