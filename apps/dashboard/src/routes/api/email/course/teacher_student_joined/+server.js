import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$defer/sendEmail';

const supabase = getSupabase();

export async function POST({ request }) {
  const { to, courseName } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
  console.log('/POST api/email/course/teacher_student_joined', to, courseName);

  if (!to || !courseName) {
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

  await sendEmail({
    from: `"ClassroomIO" <notify@classroomio.com>`,
    to,
    subject: `[${courseName}] You've got a new student 🎉!`,
    content: `
      <p>Hi amazing tutor,</p>
      <p>Congratulations 🎉, a new student has joined a course you are teaching: ${courseName}</p>
      <p>We hope they have a great experience learning from the best (YOU).</p>
      <p>If you run into any issues, please don’t fail to reach out to us, we’d love to make your teaching
      experience as easy as possible.</p>
    `
  });

  return json({
    success: true,
    message: 'Email sent'
  });
}
