import { SendMailClient } from 'zeptomail';
import type { Transporter } from 'nodemailer';
import { env } from '$src/config/env';
import nodemailer from 'nodemailer';

export const zohoClient = new SendMailClient({
  url: 'api.zeptomail.eu/',
  token: env.ZOHO_TOKEN!
});

export const nodemailerTransporter = async (): Promise<Transporter | null> => {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.error('SMTP configuration missing');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
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
    return null;
  }
};
