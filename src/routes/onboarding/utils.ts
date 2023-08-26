import { supabase } from '$lib/utils/functions/supabase';

export async function sendWelcomeEmail(to: string, name: string) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify({
        to,
        name
      })
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();

    console.log('Sent confirmation email', result);
  } catch (error) {
    console.error('Error sending confirmation email', error);
  }
}
