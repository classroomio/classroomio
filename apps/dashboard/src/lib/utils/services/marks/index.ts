import { getAccessToken } from '$lib/utils/functions/supabase';

export async function fetchMarks(courseId: string) {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch('/api/courses/marks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify({ courseId })
    });

    const result = await response.json();

    if (!result.success) {
      return { data: null, error: result.message };
    }

    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
