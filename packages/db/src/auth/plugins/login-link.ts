import * as schema from '@db/schema';

import { createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie as _setSessionCookie } from 'better-auth/cookies';
const setSessionCookie = _setSessionCookie as (
  ctx: unknown,
  data: { session: Record<string, unknown>; user: Record<string, unknown> }
) => Promise<void>;

import { db } from '@db/drizzle';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { ZLoginLinkPayload, ZLoginLinkQuery } from '@cio/utils/validation/organization';

const SESSION_EXPIRES_IN_SEC = 60 * 60 * 24 * 7;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getLoginLinkSecret(): Uint8Array {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required for login links');
  }

  return new TextEncoder().encode(secret);
}

export function loginLink() {
  return {
    id: 'login-link',
    endpoints: {
      loginLink: createAuthEndpoint('/login-link', { method: 'GET' }, async (c) => {
        const url = new URL(c.request?.url ?? '', 'http://localhost');
        const query = ZLoginLinkQuery.safeParse({
          token: url.searchParams.get('token') ?? '',
          redirect: url.searchParams.get('redirect') ?? undefined
        });

        if (!query.success) {
          return c.json({ error: 'Invalid query', message: query.error.message }, { status: 400 });
        }

        const redirectUrl = query.data.redirect && query.data.redirect.startsWith('/') ? query.data.redirect : '/';

        let payload: unknown;
        try {
          const verified = await jwtVerify(query.data.token, getLoginLinkSecret(), {
            algorithms: ['HS256']
          });
          payload = verified.payload;
        } catch {
          return c.json({ error: 'Invalid or expired login link' }, { status: 401 });
        }

        const parsedPayload = ZLoginLinkPayload.safeParse(payload);
        if (!parsedPayload.success) {
          return c.json({ error: 'Invalid login link payload' }, { status: 400 });
        }

        const normalizedEmail = parsedPayload.data.email.toLowerCase().trim();
        const [user] = await db.select().from(schema.user).where(eq(schema.user.id, parsedPayload.data.sub)).limit(1);

        if (!user || user.email.toLowerCase().trim() !== normalizedEmail) {
          return c.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_EXPIRES_IN_SEC * 1000);
        const sessionToken = generateToken();

        const [sessionRow] = await db
          .insert(schema.session)
          .values({
            userId: user.id,
            token: sessionToken,
            expiresAt,
            createdAt: now,
            updatedAt: now,
            impersonatedBy: 'login-link'
          })
          .returning();

        if (!sessionRow) {
          return c.json({ error: 'Failed to create session' }, { status: 500 });
        }

        const session = {
          id: sessionRow.id,
          userId: sessionRow.userId,
          token: sessionRow.token,
          expiresAt: sessionRow.expiresAt,
          createdAt: sessionRow.createdAt,
          updatedAt: sessionRow.updatedAt,
          ipAddress: sessionRow.ipAddress ?? undefined,
          userAgent: sessionRow.userAgent ?? undefined
        };

        const userPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image ?? null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };

        await setSessionCookie(c, { session, user: userPayload });

        return c.redirect(redirectUrl);
      })
    }
  };
}
