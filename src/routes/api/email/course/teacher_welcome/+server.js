import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import { sendEmail } from '$lib/utils/services/notification/send';

const supabase = getSupabase();

export async function POST({ request }) {
  const { to, name, orgName, courseName, orgSiteName } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';
  console.log('/POST api/email/course/teacher_welcome', to, name, orgName);

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

  await sendEmail({
    from: `"[${orgName}] - ClassroomIO" <help@classroomio.com>`,
    to,
    subject: `You have been invited to a course in ${orgName}!`,
    content: `
    <p>Hey ${name},</p>
      <p> You have been given access to teach a course by ${orgName}</p>
      <p>The course is titled: ${courseName}</p>
      <div>
        <a class="button" href="${inviteLink}">Open Dashboard</a>
      </div>
    `
  });

  return json({
    success: true,
    message: 'Email sent'
  });
}
