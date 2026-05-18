import { insertPageEvents } from '@cio/db/queries/analytics';

import { SERVER_EVENTS, type ServerEventType } from '../events/taxonomy';

type ServerEventInput = {
  eventType: ServerEventType;
  orgId?: string | null;
  userId?: string | null;
  courseId?: string | null;
  sessionId?: string | null;
  path?: string | null;
  country?: string | null;
  locale?: string | null;
  props?: Record<string, unknown>;
};

/**
 * Fire-and-forget server-side analytics write. Never throws — analytics must
 * not break the user flow that triggered the event.
 */
export function trackServerEvent(input: ServerEventInput): void {
  void writeServerEvent(input).catch((error) => {
    console.error('trackServerEvent error:', error);
  });
}

export async function writeServerEvent(input: ServerEventInput): Promise<void> {
  if (!input.eventType) return;

  await insertPageEvents([
    {
      eventType: input.eventType,
      orgId: input.orgId ?? null,
      userId: input.userId ?? null,
      courseId: input.courseId ?? null,
      sessionId: input.sessionId ?? `server:${input.eventType}:${input.userId ?? 'anon'}`,
      path: input.path ?? null,
      country: input.country ?? null,
      locale: input.locale ?? null,
      props: (input.props ?? {}) as Record<string, unknown>
    }
  ]);
}

export { SERVER_EVENTS };
