import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/utils/functions/supabase';
import sendEmail from '$defer/sendEmail';

const supabase = getSupabase();

export async function POST({ request }) {
  const { to, content, orgName, exerciseTitle } = await request.json();
  const accessToken = request.headers.get('Authorization') || '';

  if (!to || !content || !orgName) {
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

  await sendEmail({
    from: `"${orgName} (via ClassroomIO.com)" <notify@classroomio.com>`,
    to,
    subject: `[Submitted]: ${exerciseTitle}`,
    content
  });

  return json({
    success: true,
    message: 'Email sent'
  });
}
