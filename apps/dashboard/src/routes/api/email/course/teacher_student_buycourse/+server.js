import { json } from '@sveltejs/kit';
// import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$mail/sendEmail';

// const supabase = getSupabase();

export async function POST({ request }) {
  const { to, courseName, studentEmail, studentFullname } = await request.json();
  // const accessToken = request.headers.get('Authorization') || '';
  console.log(
    '/POST api/email/course/teacher_student_buycourse',
    to,
    courseName,
    studentEmail,
    studentFullname
  );

  if (!to || !courseName || !studentEmail || !studentFullname) {
    return json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  // let user;
  // try {
  //   const { data } = await supabase.auth.getUser(accessToken);
  //   user = data.user;
  // } catch (error) {
  //   console.error(error);
  // }

  // if (!user) {
  //   return json({ success: false, message: 'Unauthenticated user' }, { status: 401 });
  // }

  const emailData = [
    {
      from: `"ClassroomIO" <notify@mail.classroomio.com>`,
      to,
      subject: `[${courseName}] Request to Join Course!`,
      content: `
    <p>Hi amazing tutor,</p>
      <p> A new student has requested to join a course you are teaching: “${courseName}"</p>
      <p style="font: bold;">Student details</p>
      <p>
        Name: ${studentFullname}<br />
       Email: ${studentEmail}
      </p>
    `
    }
  ];
  await sendEmail(emailData);

  return json({
    success: true,
    message: 'Email sent'
  });
}
