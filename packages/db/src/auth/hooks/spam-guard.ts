import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';

import { AppError, ErrorCodes } from '@cio/utils/errors';
import { assertSpamAllowed, type SpamCheckInput } from '@cio/utils/spam/check';
import { db } from '@db/drizzle';
import { user } from '@db/schema';

function clientIp(request?: Request): string | undefined {
  if (!request) return undefined;

  const forwarded = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || undefined;
}

async function guard(input: SpamCheckInput): Promise<void> {
  try {
    await assertSpamAllowed(input);
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.SPAM_BLOCKED && error.statusCode < 500) {
      throw new APIError('FORBIDDEN', { message: error.message });
    }

    if (error instanceof AppError && error.code === ErrorCodes.SPAM_BLOCKED) {
      throw new APIError('SERVICE_UNAVAILABLE', { message: 'snackbar.something' });
    }

    throw error;
  }
}

export async function assertSignupAllowed(account: { name: string; email: string }, request?: Request): Promise<void> {
  await guard({
    action: 'signup',
    actor: { email: account.email, ip: clientIp(request) },
    fields: { name: account.name, email: account.email }
  });
}

export async function assertSignInAllowed(userId: string, request?: Request): Promise<void> {
  const [account] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!account) return;

  await guard({
    action: 'signin',
    actor: { userId, email: account.email, ip: clientIp(request) },
    fields: { name: account.name, email: account.email }
  });
}
