import * as schema from '@db/schema';

import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

import { getAllActiveTokenAuth } from '@db/queries/organization/token-auth';
import { ensureOrgMembership } from './hooks/sso-provisioning';
import { db } from '@db/drizzle';
import { ZTokenExchangePayload } from '@cio/utils/validation/organization';
import type { User } from 'better-auth';

const MAX_TOKEN_AGE_SEC = 5 * 60; // 5 minutes

export class TokenExchangeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'TokenExchangeError';
  }
}

/**
 * Exchange a JWT token for a user and org. Verifies signature with org's signing secret,
 * finds or creates user, ensures org membership. Caller is responsible for creating session and setting cookie.
 */
export async function exchangeToken(
  token: string,
  authApi: {
    signUpEmail: (args: { body: { name: string; email: string; password: string } }) => Promise<{ user: User }>;
  }
): Promise<{ user: User; orgId: string }> {
  const configs = await getAllActiveTokenAuth();
  if (configs.length === 0) {
    throw new TokenExchangeError('No active token auth configured', 'TOKEN_EXCHANGE_NOT_ENABLED', 403);
  }

  let payload: unknown;
  let orgId: string | null = null;

  for (const config of configs) {
    const secret = new TextEncoder().encode(config.signingSecret);
    try {
      const { payload: verified } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
        maxTokenAge: MAX_TOKEN_AGE_SEC
      });
      payload = verified;
      orgId = config.organizationId;
      break;
    } catch {
      continue;
    }
  }

  if (!orgId) {
    throw new TokenExchangeError('Invalid token', 'TOKEN_EXCHANGE_INVALID_TOKEN', 400);
  }

  const parsed = ZTokenExchangePayload.safeParse(payload);
  if (!parsed.success) {
    throw new TokenExchangeError('Invalid token payload', 'TOKEN_EXCHANGE_INVALID_TOKEN', 400);
  }

  const { email, name, avatar } = parsed.data;
  const emailLower = email.toLowerCase();

  const [existingUser] = await db.select().from(schema.user).where(eq(schema.user.email, emailLower)).limit(1);

  let user: User;
  if (existingUser) {
    user = existingUser as User;
  } else {
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    const signUpBody: { name: string; email: string; password: string; image?: string } = {
      name: name ?? emailLower.split('@')[0],
      email: emailLower,
      password: randomPassword
    };
    if (avatar) signUpBody.image = avatar;
    const result = await authApi.signUpEmail({
      body: signUpBody
    });
    user = result.user;
  }

  await ensureOrgMembership(user.id, user.email ?? emailLower, orgId);

  if (avatar) {
    await db
      .update(schema.profile)
      .set({ avatarUrl: avatar, updatedAt: new Date().toISOString() })
      .where(eq(schema.profile.id, user.id));
  }

  return {
    user: {
      ...user,
      image: user.image ?? null
    },
    orgId
  };
}
