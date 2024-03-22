import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$defer/sendEmail';

const supabase = getSupabase();

export async function POST({ request }) {
  const { to, profileId, orgSiteName } = await request.json();
  const accessToken = request.headers.get('Authorization');
  console.log('/POST api/email/verify_email', to, profileId);

  if (!to || !profileId || !accessToken) {
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

  const origin = request.headers.get('origin');
  const verificationData = JSON.stringify({
    profileId,
    orgSiteName
  });

  const verificationLink = `${origin}/api/verify?data=${encodeURIComponent(
    btoa(verificationData)
  )}`;

  await sendEmail({
    to,
    subject: '[ClassroomIO]: Verify your email',
    content: `
    <p>Thank you for signing up</p>
    <p>To verify your email, please click the <strong>Verify</strong> button below /p>
    <div>
    <a class="button" href="${verificationLink}">Verify</a>
  </div>
    `,
    isPersonalEmail: true
  });

  return json({
    success: true,
    message: `Email sent ${verificationLink}`
  });
}
