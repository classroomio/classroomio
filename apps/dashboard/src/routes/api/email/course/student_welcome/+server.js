import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$mail/sendEmail';

const supabase = getSupabase();

// Sends email to student when they successfully join a course
export async function POST({ request }) {
  const { to, orgName, courseName } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
  console.log('/POST api/email/course/student_welcome', to, orgName);

  if (!to || !orgName || !courseName) {
    return json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  let user;
  try {
    const { data } = await supabase.auth.getUser(accessToken);
    user = data.user;
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    return json({ success: false, message: 'Unauthenticated user' }, { status: 401 });
  }

  const emailData = [
    {
      from: `"${orgName} (via ClassroomIO.com)" <notify@classroomio.com>`,
      to,
      subject: `${orgName} - Welcome to Class 🎉`,
      content: `
    <p>Hi there,</p>
      <p>Congratulations 🎉, you’ve successfully joined: <strong>${courseName}</strong></p>
      <p>Everything has been set up for you to have an amazing learning experience.</p>
      <p>If you run into any issues, don’t fail to reach out to your instructor(s).</p>
      <p>Cheers,</p>
      <p>${orgName}</p>
    `
    }
  ];
  await sendEmail(emailData);

  return json({
    success: true,
    message: 'Email sent'
  });
}
