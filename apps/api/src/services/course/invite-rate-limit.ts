import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { RedisRateLimiter, type RateLimitResult } from '@api/utils/redis/limiter';

export const COURSE_INVITE_CREATE_WINDOW_MS = 60 * 60 * 1000;
export const COURSE_INVITE_CREATE_MAX_REQUESTS = 60;
export const COURSE_INVITE_CREATE_LIMIT_MESSAGE = 'Too many invite creation attempts. Please try again later.';

export type TCourseInviteActor = { userId: string } | { ip: string };

/** The hourly budget for creating course invites, shared by the dashboard, `/invites` and `/enrollments`. */
export function courseInviteCreateRateLimitKey(courseId: string, actor: TCourseInviteActor): string {
  const actorKey = 'userId' in actor ? `user:${actor.userId}` : `ip:${actor.ip}`;

  return `course_invite_create:${actorKey}:${courseId}`;
}

/**
 * Takes one unit of the actor's invite budget for `courseId` and returns a function that gives it back, for a
 * call that ends up creating nothing. Throws 429 when the budget is spent and 503 when Redis cannot decide.
 * Outside production nothing is counted, matching `createRateLimiter`.
 */
export async function reserveCourseInviteCreation(actorId: string, courseId: string): Promise<() => Promise<void>> {
  if (env.NODE_ENV !== 'production') return async () => {};

  const limiter = new RedisRateLimiter(redis, COURSE_INVITE_CREATE_WINDOW_MS, COURSE_INVITE_CREATE_MAX_REQUESTS);
  const key = courseInviteCreateRateLimitKey(courseId, { userId: actorId });
  let reservation: RateLimitResult;

  try {
    reservation = await limiter.isAllowed(key);
  } catch (error) {
    logRedisUnavailableOnce('Redis invite rate limiter unavailable, refusing invite creation', error);
    throw new AppError(
      'Rate limit could not be checked. Please try again later.',
      ErrorCodes.RATE_LIMIT_UNAVAILABLE,
      503
    );
  }

  if (!reservation.allowed) {
    throw new AppError(COURSE_INVITE_CREATE_LIMIT_MESSAGE, ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED, 429);
  }

  return async () => {
    try {
      await limiter.release(key, reservation.reservationId);
    } catch (error) {
      logRedisUnavailableOnce('Redis invite rate limiter release failed', error);
    }
  };
}
