import 'dotenv/config';

import * as schema from '../schema';

import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { mintLoginLinkToken } from '../auth/login-link';

const LOGIN_LINK_TTL_MINUTES = 10;

function getBaseUrl(): string {
  return process.env.PUBLIC_SERVER_URL?.trim() || 'http://localhost:3002';
}

function getArgs() {
  const email = process.argv[2]?.trim().toLowerCase();
  const redirect = process.argv[3]?.trim() || '/';

  if (!email) {
    throw new Error('Usage: pnpm --filter @cio/db db:login-link <email> [redirect-path]');
  }

  return { email, redirect };
}

async function main() {
  const { email, redirect } = getArgs();

  const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);

  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  const token = await mintLoginLinkToken({
    userId: user.id,
    email,
    ttlMinutes: LOGIN_LINK_TTL_MINUTES
  });

  const url = new URL('/api/auth/login-link', getBaseUrl());
  url.searchParams.set('token', token);

  if (redirect.startsWith('/')) {
    url.searchParams.set('redirect', redirect);
  }

  console.log(url.toString());
}

main().catch((error) => {
  console.error('generate-login-link error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
