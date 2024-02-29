import { defer } from '@defer/client';

import nodemailer from 'nodemailer';
import { withEmailTemplate } from '../lib/utils/services/notification/template';
import {
  SMTP_HOST,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_USER_NOTIFY,
  SMTP_PASSWORD_NOTIFY
} from '$env/static/private';

let transporter: nodemailer.Transporter;

const getTransporter = async (isPersonal?: boolean): Promise<boolean> => {
  return await new Promise((resolve, reject) => {
    if (transporter) {
      return resolve(true);
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: isPersonal ? SMTP_USER : SMTP_USER_NOTIFY,
        pass: isPersonal ? SMTP_PASSWORD : SMTP_PASSWORD_NOTIFY
      }
    });

    transporter.verify(function (error, success) {
      if (error) {
        console.log('Transporter error', error);
        reject(error);
      } else {
        console.log('Server is ready to take our messages');
        resolve(success);
      }
    });
  });
};

const sendEmail = async ({
  from,
  to,
  subject,
  content,
  isPersonalEmail,
  replyTo
}: {
  from?: string;
  to: string;
  subject: string;
  content: string;
  isPersonalEmail?: boolean;
  replyTo?: string;
}) => {
  try {
    await getTransporter(isPersonalEmail);

    const info = await transporter.sendMail({
      from: from || '"Best from ClassroomIO" <best@classroomio.com>', // sender address
      to, // list of receivers
      subject, // Subject line
      replyTo,
      html: withEmailTemplate(content) // html body
    });

    console.log('Message sent: %s', info.messageId);

    return info;
  } catch (error) {
    console.error({ error });

    return error;
  }
};

export default defer(sendEmail);
