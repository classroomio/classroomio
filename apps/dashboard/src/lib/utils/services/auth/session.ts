import type { Cookies } from '@sveltejs/kit';
import { authServerClient } from './server';
import { classroomio } from '$lib/utils/services/api';
import { getCioCookieString } from '$lib/utils/functions/cookies';

export const getSessionData = async (cookies: Cookies): Promise<App.Locals | null> => {
  try {
    const cioCookies = getCioCookieString(cookies);

    if (!cioCookies) return null;

    const locals = await getThroughAuthClient(cioCookies);
    console.log('has locals', !!locals);
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

/**
 * Locals for a request with no signed-in user, so every field typed on
 * `App.Locals` is present on anonymous requests too.
 */
export function createAnonymousLocals(): App.Locals {
  return { user: null, session: null, orgRoles: {} };
}

export async function getThroughAuthClient(allCookies: string): Promise<App.Locals | null> {
  const session = await authServerClient.getSession({
    fetchOptions: {
      headers: {
        cookie: allCookies
      }
    }
  });

  if (!session.data) return null;

  // The API's customSession plugin adds orgRoles, which this untyped auth client does not declare.
  const sessionData = session.data as {
    user: App.Locals['user'];
    session: App.Locals['session'];
    orgRoles?: Record<string, number>;
  };

  return {
    user: sessionData.user,
    session: sessionData.session,
    orgRoles: sessionData.orgRoles ?? {}
  };
}
