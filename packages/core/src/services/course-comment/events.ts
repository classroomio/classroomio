import type { TCourseCommentPresenceCursor, TCourseCommentPresenceTyping } from '@cio/utils/validation/course-comment';

import { env } from '../../config/env';
import { logRedisUnavailableOnce, redis } from '../../utils/redis/redis';

export type TCourseCommentEvent =
  | { type: 'thread.changed'; threadId: string }
  | { type: 'thread.deleted'; threadId: string }
  | { type: 'anchors.changed'; threadIds: string[] }
  | {
      type: 'presence';
      profileId: string;
      connectionId: string;
      fullname: string;
      pageId: string;
      colorIndex: number;
      cursor: TCourseCommentPresenceCursor | null;
      typing: TCourseCommentPresenceTyping | null;
    }
  | { type: 'presence.left'; profileId: string; connectionId: string }
  | { type: 'access.changed'; profileId: string | null }
  | { type: 'notifications.changed'; profileId: string };

export const COURSE_COMMENT_CHANNEL_PREFIX = 'course-comments:';
export const COURSE_COMMENT_ORGANIZATION_CHANNEL_PREFIX = 'course-comments-org:';

export type TCourseCommentEventTarget = { kind: 'course'; id: string } | { kind: 'organization'; id: string };

export interface TCourseCommentEnvelope {
  target: TCourseCommentEventTarget;
  event: TCourseCommentEvent;
}

type TCourseCommentListener = (envelope: TCourseCommentEnvelope) => void;

const localListeners = new Set<TCourseCommentListener>();

export function courseCommentChannel(target: TCourseCommentEventTarget): string {
  const prefix = target.kind === 'course' ? COURSE_COMMENT_CHANNEL_PREFIX : COURSE_COMMENT_ORGANIZATION_CHANNEL_PREFIX;

  return `${prefix}${target.id}`;
}

/** Reads a Redis channel name back into its target, or null for a foreign channel. */
export function parseCourseCommentChannel(channel: string): TCourseCommentEventTarget | null {
  if (channel.startsWith(COURSE_COMMENT_ORGANIZATION_CHANNEL_PREFIX)) {
    return { kind: 'organization', id: channel.slice(COURSE_COMMENT_ORGANIZATION_CHANNEL_PREFIX.length) };
  }
  if (channel.startsWith(COURSE_COMMENT_CHANNEL_PREFIX)) {
    return { kind: 'course', id: channel.slice(COURSE_COMMENT_CHANNEL_PREFIX.length) };
  }

  return null;
}

/**
 * Receives events published in this process when Redis is unavailable. The API's live hub
 * subscribes to Redis instead whenever Redis is up, so each event reaches it exactly once.
 */
export function onLocalCourseCommentEvent(listener: TCourseCommentListener): () => void {
  localListeners.add(listener);

  return () => localListeners.delete(listener);
}

function deliverLocally(envelope: TCourseCommentEnvelope): void {
  for (const listener of localListeners) {
    try {
      listener(envelope);
    } catch (error) {
      console.error('course comment listener error:', error);
    }
  }
}

export function isCourseCommentRedisReady(): boolean {
  return Boolean(env.REDIS_URL) && redis.isReady;
}

async function publish(envelope: TCourseCommentEnvelope): Promise<void> {
  if (!isCourseCommentRedisReady()) {
    deliverLocally(envelope);
    return;
  }

  try {
    await redis.publish(courseCommentChannel(envelope.target), JSON.stringify(envelope.event));
  } catch (error) {
    logRedisUnavailableOnce('Failed to publish course comment event', error);
    deliverLocally(envelope);
  }
}

/**
 * Announces a change to everyone watching a course's comments. Best effort: a failure is logged and
 * never reaches the caller, because clients catch up by refetching when they reconnect.
 */
export async function publishCourseCommentEvent(courseId: string, event: TCourseCommentEvent): Promise<void> {
  await publish({ target: { kind: 'course', id: courseId }, event });
}

/**
 * Asks live comment connections in a course to re-check access: one person's when `profileId` is
 * set, everyone's otherwise.
 */
export async function announceCourseCommentAccessChange(courseId: string, profileId: string | null): Promise<void> {
  await publishCourseCommentEvent(courseId, { type: 'access.changed', profileId });
}

/** Same as `announceCourseCommentAccessChange`, for every course of an organization. */
export async function announceOrganizationCourseCommentAccessChange(
  organizationId: string,
  profileId: string | null
): Promise<void> {
  await publish({ target: { kind: 'organization', id: organizationId }, event: { type: 'access.changed', profileId } });
}

export async function publishCourseCommentEvents(courseIds: string[], event: TCourseCommentEvent): Promise<void> {
  await Promise.all([...new Set(courseIds)].map((courseId) => publishCourseCommentEvent(courseId, event)));
}
