import { render } from 'svelte-email';
import { json } from '@sveltejs/kit';
import WelcomeTemplate from './template.svelte';
import { getSendgrid, SENDGRID_FROM } from '$lib/utils/services/sendgrid';
import { getSupabase } from '$lib/utils/functions/supabase';

const sendgrid = getSendgrid();
const supabase = getSupabase();

export async function POST({ request }) {
  const { to, name } = await request.json();
  const accessToken = request.headers.get('Authorization');
  console.log('/POST api/email/welcome', to, name);

  if (!to || !name) {
    return json({ success: false, message: 'Name and To are required fields' }, { status: 400 });
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
    from: SENDGRID_FROM,
    to,
    subject: 'Thank you so so so much for choosing ClassroomIO!',
    html: render({
      template: WelcomeTemplate,
      props: {
        name
      }
    })
  };

  sendgrid.send(options);

  return json({
    success: true,
    message: 'Email sent'
  });
}
