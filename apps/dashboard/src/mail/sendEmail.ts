import { env } from '$env/dynamic/public';

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
      const response = await sFetch(`${env.PUBLIC_SERVER_URL}/mail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailDataArray)
      });

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
