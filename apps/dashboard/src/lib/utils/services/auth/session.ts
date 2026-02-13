import type { Cookies } from '@sveltejs/kit';
// import { authClient } from './client';
import { classroomio } from '$lib/utils/services/api';

export const getSessionData = async (cookies: Cookies): Promise<App.Locals | null> => {
  try {
    const cioCookies = cookies
      .getAll()
      .filter((c) => c.name.includes('classroomio'))
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    if (!cioCookies) return null;

    const locals = await getThroughTrpc(cioCookies);

    if (!locals) return null;

    locals.fromSessions = !!cookies.get('classroomio.session_data');

    return locals;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
};

export async function getThroughTrpc(allCookies: string) {
  const session = await classroomio.session.$get(undefined, {
    headers: {
      cookie: allCookies
    }
  });

  const data = (await session.json()) as App.Locals;

  return data;
}

// export async function getThroughAuthClient(allCookies: string) {
//   const session = await authClient.getSession({
//     fetchOptions: {
//       headers: {
//         cookie: allCookies
//       }
//     }
//   });

//   return session.data as App.Locals | null;
// }
