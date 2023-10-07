import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import { sendEmail } from '$lib/utils/services/notification/send';

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

  await sendEmail({
    to: email,
    subject: `Join ${name} on ClassroomIO 😃`,
    content: `
    <p>Hey there,</p>
      <p> You have been invited to join ${name} on ClassroomIO 🎉🎉🎉.</p>
      <div>
        <a class="button" href="${inviteLink}">Accept Invitation</a>
      </div>
    `,
    isPersonalEmail: true
  });

  return json({
    success: true,
    message: 'Email sent'
  });
}
