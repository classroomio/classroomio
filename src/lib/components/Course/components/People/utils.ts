import { supabase } from '$lib/utils/functions/supabase';

export async function sendTeacherCourseWelcome(params: {
  to: string;
  name: string;
  orgName: string;
  orgSiteName: string;
  courseName: string;
}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  try {
    const response = await fetch('/api/email/course/teacher_welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();

    console.log('Sent invite email', result);
  } catch (error) {
    console.error('Error sending invite email', error);
  }
}
