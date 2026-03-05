import * as schema from '@db/schema';

import { createAuthEndpoint } from 'better-auth/api';
// Session cookie helper: runtime accepts (ctx, { session, user }), typings show 1 arg
import { setSessionCookie as _setSessionCookie } from 'better-auth/cookies';
const setSessionCookie = _setSessionCookie as (
  ctx: unknown,
  data: { session: Record<string, unknown>; user: Record<string, unknown> }
) => Promise<void>;

import type { User } from 'better-auth';
import { db } from '@db/drizzle';
import { exchangeToken, TokenExchangeError } from '../token-exchange';
import { ZTokenExchangeQuery } from '@cio/utils/validation/organization';

const SESSION_EXPIRES_IN_SEC = 60 * 60 * 24 * 7; // 7 days

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function tokenExchange() {
  return {
    id: 'token-exchange',
    endpoints: {
      tokenExchange: createAuthEndpoint('/token-exchange', { method: 'GET' }, async (c) => {
        const url = new URL(c.request?.url ?? '', 'http://localhost');
        const query = ZTokenExchangeQuery.safeParse({
          token: url.searchParams.get('token') ?? '',
          redirect: url.searchParams.get('redirect') ?? undefined
        });

        if (!query.success) {
          return c.json({ error: 'Invalid query', message: query.error.message }, { status: 400 });
        }

        const { token, redirect } = query.data;
        const redirectUrl = redirect && redirect.startsWith('/') ? redirect : '/';

        const auth = (
          c as unknown as { context: { auth: { api: { signUpEmail: (args: unknown) => Promise<{ user: unknown }> } } } }
        ).context?.auth;
        if (!auth?.api?.signUpEmail) {
          console.error('Token exchange: auth.api not available on context');
          return c.json({ error: 'Server configuration error' }, { status: 500 });
        }

        let result: {
          user: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            image: string | null;
            createdAt: Date;
            updatedAt: Date;
          };
          orgId: string;
        };
        try {
          const raw = await exchangeToken(
            token,
            auth.api as {
              signUpEmail: (args: {
                body: { name: string; email: string; password: string };
              }) => Promise<{ user: User }>;
            }
          );
          result = { user: { ...raw.user, image: raw.user.image ?? null }, orgId: raw.orgId };
        } catch (err: unknown) {
          if (err instanceof TokenExchangeError) {
            return c.json({ error: err.message, code: err.code }, { status: err.statusCode });
          }
          console.error('Token exchange error:', err);
          return c.json({ error: 'Token exchange failed' }, { status: 500 });
        }

        const { user } = result;
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
            updatedAt: now
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
