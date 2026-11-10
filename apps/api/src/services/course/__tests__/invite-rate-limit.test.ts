import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  env: { NODE_ENV: 'production' },
  isAllowed: vi.fn(),
  release: vi.fn(),
  limiterArgs: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({ env: mocks.env }));

vi.mock('@cio/core/utils/redis/redis', () => ({
  redis: {},
  logRedisUnavailableOnce: vi.fn()
}));

vi.mock('@api/utils/redis/limiter', () => ({
  RedisRateLimiter: class {
    constructor(...args: unknown[]) {
      mocks.limiterArgs(...args);
    }
    isAllowed = mocks.isAllowed;
    release = mocks.release;
  }
}));

import { ErrorCodes } from '@cio/utils/constants/error-codes';
import { courseInviteCreateRateLimitKey, reserveCourseInviteCreation } from '@api/services/course/invite-rate-limit';

const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const KEY = 'course_invite_create:user:actor-1:course-1';

describe('courseInviteCreateRateLimitKey', () => {
  it('keys the budget by user, or by IP when there is no user', () => {
    expect(courseInviteCreateRateLimitKey(COURSE_ID, { userId: ACTOR_ID })).toBe(KEY);
    expect(courseInviteCreateRateLimitKey(COURSE_ID, { ip: '1.2.3.4' })).toBe(
      'course_invite_create:ip:1.2.3.4:course-1'
    );
  });
});

describe('reserveCourseInviteCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.NODE_ENV = 'production';
    mocks.isAllowed.mockResolvedValue({ allowed: true, remaining: 59, reservationId: 'r-1', resetTime: 0 });
  });

  it('takes one unit of the 60-per-hour budget and can give it back', async () => {
    const release = await reserveCourseInviteCreation(ACTOR_ID, COURSE_ID);

    expect(mocks.limiterArgs).toHaveBeenCalledWith({}, 60 * 60 * 1000, 60);
    expect(mocks.isAllowed).toHaveBeenCalledWith(KEY);

    await release();

    expect(mocks.release).toHaveBeenCalledWith(KEY, 'r-1');
  });

  it('throws 429 once the budget is spent', async () => {
    mocks.isAllowed.mockResolvedValue({ allowed: false, remaining: 0, reservationId: 'r-2', resetTime: 0 });

    await expect(reserveCourseInviteCreation(ACTOR_ID, COURSE_ID)).rejects.toMatchObject({
      statusCode: 429,
      code: ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED
    });
  });

  it('refuses with 503 when Redis cannot decide', async () => {
    mocks.isAllowed.mockRejectedValue(new Error('redis down'));

    await expect(reserveCourseInviteCreation(ACTOR_ID, COURSE_ID)).rejects.toMatchObject({
      statusCode: 503,
      code: ErrorCodes.RATE_LIMIT_UNAVAILABLE
    });
  });

  it('counts nothing outside production', async () => {
    mocks.env.NODE_ENV = 'development';

    const release = await reserveCourseInviteCreation(ACTOR_ID, COURSE_ID);
    await release();

    expect(mocks.isAllowed).not.toHaveBeenCalled();
    expect(mocks.release).not.toHaveBeenCalled();
  });
});
