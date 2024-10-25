import { supabase } from "$lib/utils/functions/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const load = async ({ params, fetch }) => {
  const { id, personId } = params;

  const getAccessToken = async () => {
    const {data} = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }
  
  try {
    const accessToken = await getAccessToken();
    const response = await fetch('/api/analytics/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      },
      body: JSON.stringify({
        userId: personId,
        courseId: id
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const data = await response.json();

    return {
      userId: personId,
      data,
    };
  } catch (error: any) {
    console.error('Error loading data:', error);
    return {
      userId: personId,
      data: null,
      error: error.message,
    };
  }
};
