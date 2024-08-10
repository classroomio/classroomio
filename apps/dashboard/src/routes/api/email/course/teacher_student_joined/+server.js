import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$mail/sendEmail';

const supabase = getSupabase();

export async function POST({ request }) {
  const { to, courseName, studentName, studentEmail } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
  console.log('/POST api/email/course/teacher_student_joined', to, courseName);

  if (!to || !courseName || !studentName || !studentEmail) {
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
      from: `"ClassroomIO" <notify@mail.classroomio.com>`,
      to,
      subject: `[${courseName}] You've got a new student 🎉!`,
      content: `
      <p>Hi amazing tutor,</p>
      <p>Congratulations 🎉, a new student: <strong>${studentName} (${studentEmail})</strong> has joined a course you are teaching: ${courseName}</p>
      <p>We hope they have a great experience learning from the best (YOU).</p>
      <p>If you run into any issues, please don’t fail to reach out to us, we’d love to make your teaching experience as easy as possible.</p>
    `
    }
  ];

  await sendEmail(emailData);

  return json({
    success: true,
    message: 'Email sent'
  });
}
