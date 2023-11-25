import nodemailer from 'nodemailer';
import { withEmailTemplate } from './template';
import {
  SMTP_HOST,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_USER_HELP,
  SMTP_PASSWORD_HELP
} from '$env/static/private';

const content = `
<div>
  <h1>Welcome</h1>
  <br/>
  <p>Thank you so much for trying out ClassroomIO</p>
  <a href="https://app.classroomio.com/login">Login</a><br/>
<br/>
Your ClassroomIO Team
</div>
`;

let transporter: nodemailer.Transporter;

const getTransporter = async (isPersonal?: boolean): Promise<boolean> => {
  return await new Promise((resolve, reject) => {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: isPersonal ? SMTP_USER : SMTP_USER_HELP,
        pass: isPersonal ? SMTP_PASSWORD : SMTP_PASSWORD_HELP
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

export const sendEmail = async ({
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
  await getTransporter(isPersonalEmail);
  const info = await transporter.sendMail({
    from: from || '"Best from ClassroomIO" <best@classroomio.com>', // sender address
    to, // list of receivers
    subject, // Subject line
    replyTo,
    html: withEmailTemplate(content) // html body
  });

  console.log('Message sent: %s', info.messageId);
};
