import 'dotenv/config';

import * as schema from '../schema';

import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { db } from '../drizzle';

const LOGIN_LINK_TTL_MINUTES = 10;

function getBaseUrl(): string {
  return process.env.PUBLIC_SERVER_URL?.trim() || 'http://localhost:3002';
}

function getSecret(): Uint8Array {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required');
  }

  return new TextEncoder().encode(secret);
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

  const token = await new SignJWT({
    email,
    type: 'login-link'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${LOGIN_LINK_TTL_MINUTES}m`)
    .sign(getSecret());

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
