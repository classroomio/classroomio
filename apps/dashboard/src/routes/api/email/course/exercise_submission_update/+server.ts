import { json } from '@sveltejs/kit';
import sendEmail from '$mail/sendEmail';

export async function POST({ fetch, request }) {
  const { to, content, orgName, exerciseTitle } = await request.json();

  if (!to || !content || !orgName) {
    return json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const emailData = [
    {
      from: `"${orgName} (via ClassroomIO.com)" <notify@mail.classroomio.com>`,
      to,
      subject: `[Submitted]: ${exerciseTitle}`,
      content
    }
  ];

  await sendEmail(fetch)(emailData);

  return json({
    success: true,
    message: 'Email sent'
  });
}
