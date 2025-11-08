import { apiClient } from '$lib/utils/services/api';

export const getSessionData = async (sessionToken?: string) => {
  if (!sessionToken) return null;

  try {
    const session = await apiClient.request('/api/auth/get-session', {
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`
      }
    });

    const sessionData = await session.json();

    return sessionData;
  } catch (error) {
    console.error('Session verification failed:', error);
  }
};
