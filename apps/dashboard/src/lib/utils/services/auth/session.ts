import { classroomio } from '$lib/utils/services/api';

export const getSessionData = async (cookie: string) => {
  try {
    const session = await classroomio.session.$get(undefined, {
      headers: {
        cookie: cookie || ''
      }
    });

    return session.json();
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
};
