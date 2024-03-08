import { json } from '@sveltejs/kit';
// import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$defer/sendEmail';

// const supabase = getSupabase();

export async function POST({ request }) {
  const { to, courseName, teacherEmail, studentFullname, orgName } = await request.json();
  // const accessToken = request.headers.get('Authorization') || '';
  console.log(
    '/POST api/email/course/student_prove_payment',
    to,
    courseName,
    teacherEmail,
    studentFullname,
    orgName
  );

  if (!to || !courseName || !teacherEmail || !studentFullname || !orgName) {
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

  await sendEmail({
    from: `"${orgName} - ClassroomIO" <notify@classroomio.com>`,
    to,
    replyTo: teacherEmail,
    subject: `[${courseName}] One more step left`,
    content: `
    <p>Hi ${studentFullname},</p>
      <p>You are one step closer to joining: <strong>${courseName}</strong></p>
      <p>Please send your proof of payment to: <strong>${teacherEmail}</strong>, in order to join the course.</p>
      <p>Talk to you soon and see you in class.</p>
      <p>${orgName}</p>
    `
  });

  return json({
    success: true,
    message: 'Email sent'
  });
}
