import { supabase } from '$lib/utils/functions/supabase';

export async function queryUnsplash(searchQuery: string) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  try {
    const response = await fetch('/api/unsplash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify({ searchQuery })
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();
    return result.photos;
  } catch (error) {
    console.error('Error sending fetch request', error);
  }
}