import type { Context } from 'hono';

import { createRateLimiter, type RateLimiterOptions } from '@api/middlewares/rate-limiter';
import {
  COURSE_INVITE_CREATE_LIMIT_MESSAGE,
  COURSE_INVITE_CREATE_MAX_REQUESTS,
  COURSE_INVITE_CREATE_WINDOW_MS,
  courseInviteCreateRateLimitKey,
  type TCourseInviteActor
} from '@api/services/course/invite-rate-limit';

/** Caps course invite creation per actor and course: it mints tokens and fans out emails. */
export function createCourseInviteRateLimit(
  resolveActor: (c: Context) => TCourseInviteActor,
  options: Pick<RateLimiterOptions, 'failClosed'> = {}
) {
  return createRateLimiter({
    ...options,
    windowMs: COURSE_INVITE_CREATE_WINDOW_MS,
    maxRequests: COURSE_INVITE_CREATE_MAX_REQUESTS,
    message: COURSE_INVITE_CREATE_LIMIT_MESSAGE,
    keyGenerator: (c) => courseInviteCreateRateLimitKey(c.req.param('courseId')!, resolveActor(c))
  });
}
