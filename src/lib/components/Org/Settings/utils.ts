import { supabase } from '$lib/utils/functions/supabase';

export async function sendInvite(email: string, org: any) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  try {
    const response = await fetch('/api/email/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify({
        email,
        org
      })
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
