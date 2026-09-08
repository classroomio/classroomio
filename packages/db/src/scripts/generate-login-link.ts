import 'dotenv/config';

import * as schema from '../schema';

import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { mintLoginLinkToken } from '../auth/login-link';

const LOGIN_LINK_TTL_MINUTES = 10;
const USAGE = 'Usage: pnpm --filter @cio/db db:login-link <email> [redirect-path-or-url]';

function getFallbackBaseUrl(): string {
  return process.env.PUBLIC_SERVER_URL?.trim() || 'http://localhost:3002';
}

/**
 * Login-link sessions are host-only. The consume URL must be opened on the
 * destination host, and `redirect` must be a same-host path (the plugin
 * drops anything that does not start with `/`).
 *
 * A relative path keeps the API/dashboard fallback origin. An absolute
 * http(s) URL (e.g. `https://excelly.myclassroomio.com/lms`) uses that
 * origin as the login-link host and the path/search/hash as `redirect`.
 */
function resolveLoginLinkTarget(
  redirectArg: string,
  fallbackOrigin = getFallbackBaseUrl()
): { origin: string; redirect: string } {
  if (redirectArg.startsWith('/')) {
    return { origin: fallbackOrigin, redirect: redirectArg };
  }

  let parsed: URL;

  try {
    parsed = new URL(redirectArg);
  } catch {
    throw new Error(`${USAGE}\nInvalid redirect: ${redirectArg}. Pass a path (/lms) or an http(s) URL.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${USAGE}\nInvalid redirect protocol: ${parsed.protocol}. Use http or https.`);
  }

  const redirect = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';

  return { origin: parsed.origin, redirect };
}

function getArgs() {
  const email = process.argv[2]?.trim().toLowerCase();
  const redirectArg = process.argv[3]?.trim() || '/';

  if (!email) {
    throw new Error(USAGE);
  }

  return { email, ...resolveLoginLinkTarget(redirectArg) };
}

async function main() {
  const { email, origin, redirect } = getArgs();

  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);

  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  const token = await mintLoginLinkToken({
    userId: user.id,
    email,
    ttlMinutes: LOGIN_LINK_TTL_MINUTES
  });

  const url = new URL('/api/auth/login-link', origin);
  url.searchParams.set('token', token);
  url.searchParams.set('redirect', redirect);

  console.log(url.toString());
}

main().catch((error) => {
  console.error('generate-login-link error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
