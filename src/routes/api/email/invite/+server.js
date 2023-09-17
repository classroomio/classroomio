import { render } from 'svelte-email';
import { json } from '@sveltejs/kit';
import TeacherInviteTemplate from './template.svelte';
import { getSendgrid, SENDGRID_FROM_NOREPLY } from '$lib/utils/services/sendgrid';
import { getSupabase } from '$lib/utils/functions/supabase';

const sendgrid = getSendgrid();
const supabase = getSupabase();

// API to send invite to teacher
export async function POST({ request }) {
  const body = await request.json();
  const { org, email } = body;

  const accessToken = request.headers.get('Authorization');
  console.log('/POST api/email/invite', body);

  if (!org || !Object.keys(org).length || !email) {
    return json(
      { success: false, message: 'Org data and Teacher name are required' },
      { status: 400 }
    );
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

  const { id, name, siteName } = org;

  const origin = request.headers.get('origin');
  const inviteData = JSON.stringify({
    email,
    orgId: id,
    orgSiteName: siteName
  });
  const inviteLink = `${origin}/invite/t/${encodeURIComponent(btoa(inviteData))}`;
  console.log('inviteData', inviteData);

  const options = {
    from: SENDGRID_FROM_NOREPLY,
    to: email,
    subject: `Join ${name} on ClassroomIO`,
    html: render({
      template: TeacherInviteTemplate,
      props: {
        orgName: name,
        inviteLink
      }
    })
  };

  sendgrid.send(options);

  return json({
    success: true,
    message: 'Email sent'
  });
}
