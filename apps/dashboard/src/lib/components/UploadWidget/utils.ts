import { getAccessToken } from '$lib/utils/functions/supabase';

export async function queryUnsplash(searchQuery: string) {
  try {
    const response = await fetch('/api/unsplash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await getAccessToken()
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
