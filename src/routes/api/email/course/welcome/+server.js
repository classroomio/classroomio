import { render } from 'svelte-email';
import { json } from '@sveltejs/kit';
import WelcomeTemplate from './template.svelte';
import { getSendgrid, SENDGRID_FROM_NOTIFY } from '$lib/utils/services/sendgrid';
import { getSupabase } from '$lib/utils/functions/supabase';

const sendgrid = getSendgrid();
const supabase = getSupabase();

export async function POST({ request }) {
  const { to, name, orgName, courseName, orgSiteName } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
  console.log('/POST api/email/course/welcome', to, name, orgName);

  if (!to || !name || !orgName || !courseName || !orgSiteName) {
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

  const origin = request.headers.get('origin');
  const inviteLink = `${origin}/org/${orgSiteName}/courses`;

  const options = {
    from: SENDGRID_FROM_NOTIFY,
    to,
    subject: `You have been invited to a course in ${orgName}!`,
    html: render({
      template: WelcomeTemplate,
      props: {
        name,
        orgName,
        inviteLink,
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
