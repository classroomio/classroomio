import type { Cookies } from '@sveltejs/kit';
import { authServerClient } from './server';
import { classroomio } from '$lib/utils/services/api';
import { getRequestBaseUrl } from '$lib/utils/services/api';

export const getSessionData = async (cookies: Cookies): Promise<App.Locals | null> => {
  try {
    const cioCookies = cookies
      .getAll()
      .filter((c) => c.name.includes('classroomio'))
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    console.log('cioCookies', cioCookies);
    if (!cioCookies) return null;

    const locals = await getThroughAuthClient(cioCookies);

    console.log('locals', locals);
    if (!locals) return null;

    // This will always be true because if we don't have classroomio cookies, we won't be able to this line of code.
    locals.fromSessions = true;

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

export async function getThroughAuthClient(allCookies: string) {
  const baseURL = getRequestBaseUrl();
  console.log('baseURL', baseURL);
  const session = await authServerClient.getSession({
    fetchOptions: {
      headers: {
        cookie: allCookies
      }
    }
  });

  return session.data as App.Locals | null;
}
