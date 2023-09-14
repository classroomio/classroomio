import { render } from 'svelte-email';
import { json } from '@sveltejs/kit';
import WelcomeTemplate from './template.svelte';
import { getSendgrid, SENDGRID_FROM_NOTIFY } from '$lib/utils/services/sendgrid';
import { getSupabase } from '$lib/utils/functions/supabase';

const sendgrid = getSendgrid();
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

  const options = {
    from: SENDGRID_FROM_NOTIFY,
    to,
    subject: `[${orgName}] Welcome to Class`,
    html: render({
      template: WelcomeTemplate,
      props: {
        orgName,
        courseName
      }
    })
  };

  sendgrid.send(options);

  return json({
    success: true,
    message: 'Email sent'
  });
}
