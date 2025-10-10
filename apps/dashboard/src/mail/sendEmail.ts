import { classroomio } from '$lib/utils/services/api';

const sendEmail = (sFetch: typeof fetch) => {
  return async (
    emailDataArray: {
      from?: string;
      to: string;
      subject: string;
      content: string;
      replyTo?: string;
      isPersonalEmail?: boolean;
    }[]
  ) => {
    try {
      const response = await classroomio.mail.send.$post({ json: emailDataArray }, { fetch: sFetch });

      if (!response.ok) {
        console.log('Failed to send emails');
        return;
      }

      console.log('Emails sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending emails:', error);
      return;
    }
  };
};
export default sendEmail;
