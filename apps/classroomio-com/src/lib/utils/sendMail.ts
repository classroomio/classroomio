import { json } from '@sveltejs/kit';

const triggersendEmail = async (formData: {
  from?: string;
  to: any;
  subject: string;
  userName: string;
  userEmail: string;
  content: any;
  replyTo?: any;
  isPersonalEmail?: boolean;
}) => {
  const { to, subject, content, userName, userEmail } = formData;

  if (!to || !subject || !content || !userName || !userEmail) {
    return json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }
  try {
    const emailData = [
      {
        from: `[help] <@${userEmail}>`,
        to,
        subject: subject,
        content: `
              <p>Hello, my name is ${userName}, and i would like to request help on the following issue</p>
              <p>${content}</p>
              <p>You can reach me on ${userEmail}</p>
            `
      }
    ];
    const response = await fetch(`/api/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
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
export default triggersendEmail;
