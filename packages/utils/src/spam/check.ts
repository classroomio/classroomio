import { AppError, ErrorCodes } from '../errors';

export type SpamAction = 'signup' | 'signin' | 'identity' | 'invite' | 'content' | 'ai_chat';

export type SpamCheckInput = {
  action: SpamAction;
  actor?: {
    userId?: string;
    email?: string;
    ip?: string;
  };
  fields?: Record<string, string | number | null | undefined>;
};

const FAIL_CLOSED = new Set<SpamAction>(['signup', 'signin', 'identity', 'invite']);
const BLOCKED_MESSAGE = 'snackbar.spam_blocked';

/**
 * Asks the configured detector whether this write is allowed.
 * No-ops when SPAM_DETECTION_URL is unset. Signup, sign-in, identity, and
 * invite fail closed when that endpoint is set but unreachable.
 */
export async function assertSpamAllowed(input: SpamCheckInput): Promise<void> {
  const endpoint = process.env.SPAM_DETECTION_URL?.trim();
  if (!endpoint) return;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: input.action,
        actor: input.actor ?? {},
        fields: input.fields ?? {}
      }),
      signal: AbortSignal.timeout(2500)
    });
  } catch {
    if (FAIL_CLOSED.has(input.action)) {
      throw new AppError('snackbar.something', ErrorCodes.SPAM_BLOCKED, 503);
    }

    return;
  }

  if (!response.ok) {
    if (FAIL_CLOSED.has(input.action)) {
      throw new AppError('snackbar.something', ErrorCodes.SPAM_BLOCKED, 503);
    }

    return;
  }

  let body: { allowed?: boolean; message?: string };

  try {
    body = (await response.json()) as { allowed?: boolean; message?: string };
  } catch {
    if (FAIL_CLOSED.has(input.action)) {
      throw new AppError('snackbar.something', ErrorCodes.SPAM_BLOCKED, 503);
    }

    return;
  }

  if (body.allowed === false) {
    const message = typeof body.message === 'string' && body.message.trim() ? body.message : BLOCKED_MESSAGE;
    throw new AppError(message, ErrorCodes.SPAM_BLOCKED, 403);
  }
}
