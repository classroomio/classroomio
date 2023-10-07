import nodemailer from 'nodemailer';
import { withEmailTemplate } from './template';
import { SMTP_HOST, SMTP_USER, SMTP_PASSWORD } from '$env/static/private';

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

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD
  }
});

const getTransporter = async (): Promise<boolean> => {
  return await new Promise((resolve, reject) => {
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
  to,
  subject,
  content
}: {
  to: string;
  subject: string;
  content: string;
}) => {
  await getTransporter();
  const info = await transporter.sendMail({
    from: '"Best from ClassroomIO" <best@classroomio.com>', // sender address
    to, // list of receivers
    subject, // Subject line
    html: withEmailTemplate(content) // html body
  });

  console.log('Message sent: %s', info.messageId);
};
