import { render } from 'svelte-email';
import { json } from '@sveltejs/kit';
import JoinRequestTemplate from './template.svelte';
import { getSendgrid, SENDGRID_FROM_NOREPLY } from '$lib/utils/services/sendgrid';
import { getSupabase } from '$lib/utils/functions/supabase';

const sendgrid = getSendgrid();
const supabase = getSupabase();

export async function POST({ request }) {
  const { to, courseName, teacherEmail, studentFullname, orgName } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
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

  const options = {
    from: SENDGRID_FROM_NOREPLY,
    to,
    replyTo: teacherEmail,
    subject: `[${courseName}] One more step left`,
    html: render({
      template: JoinRequestTemplate,
      props: {
        courseName,
        studentFullname,
        teacherEmail,
        orgName
      }
    })
  };

  sendgrid.send(options);

  return json({
    success: true,
    message: 'Email sent'
  });
}
