import { env } from '$env/dynamic/public';

const sendEmail = async (
  emailDataArray: {
    from?: string;
    to: any;
    subject: string;
    content: any;
    replyTo?: any;
    isPersonalEmail?: boolean;
  }[]
) => {
  try {
    const response = await fetch(`${env.PUBLIC_SERVER_URL}/sendEmail`, {
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

    const responseData = await response.json();
    console.log('Emails sent successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error sending emails:', error);
    return;
  }
};
export default sendEmail;
