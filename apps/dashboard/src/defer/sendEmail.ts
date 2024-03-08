import { defer } from '@defer/client';

import { withEmailTemplate } from '../lib/utils/services/notification/template';
import { getTransporter } from '../lib/utils/services/notification/send';

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
    const transporter = await getTransporter(isPersonalEmail);

    if (!transporter) {
      return;
    }

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
