import nodemailer from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_USER_NOTIFY,
  SMTP_PASSWORD_NOTIFY,
  SMTP_PORT
} from '$env/static/private';

let transporter: nodemailer.Transporter;

export const getTransporter = async (
  isPersonal?: boolean
): Promise<nodemailer.Transporter | null> => {
  return await new Promise((resolve, reject) => {
    // If email sending isn't configured
    if (!SMTP_HOST) {
      resolve(null);
    }

    if (transporter) {
      return resolve(transporter);
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: true,
      auth: {
        user: isPersonal ? SMTP_USER : SMTP_USER_NOTIFY,
        pass: isPersonal ? SMTP_PASSWORD : SMTP_PASSWORD_NOTIFY
      },
      logger: true, // Enable logging
      debug: true
    });

    transporter.verify(function (error) {
      if (error) {
        console.log('Transporter error', error);
        reject(null);
      } else {
        console.log('Server is ready to take our messages');
        resolve(transporter);
      }
    });
  });
};
