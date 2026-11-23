import type { UIMessage } from 'ai';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { listLearnerAssignments } from '@api/services/account/assignments';
import { streamLearnerAssistantReply } from '@api/services/account/assistant';
import { getLearnerGoals, updateLearnerTimezone, updateWeeklyLessonTarget } from '@api/services/account/goals';
import { listLearningHistory } from '@api/services/account/learning-history';
import {
  listExploreLiveClasses,
  listLearnerLiveClasses,
  registerForLiveClass,
  unregisterFromLiveClass
} from '@api/services/account/live-classes';
import { handleError } from '@api/utils/errors';
import { extractClientIp } from '@api/utils/redis/key-generators';
import {
  ZGetLearnerGoalsQuery,
  ZLearnerAssistantChatBody,
  ZLiveClassParam,
  ZUpdateLearnerGoal,
  ZUpdateLearnerTimezone
} from '@cio/utils/validation/account';
import { zValidator } from '@hono/zod-validator';

const liveClassRegistrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 60,
  message: 'Too many live class registrations. Please try again later.',
  keyGenerator: (c) => `live_class_registration:${c.get('user')?.id ?? extractClientIp(c)}`
});

const assistantRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many messages. Please try again in a minute.',
  keyGenerator: (c) => `learner_assistant:${c.get('user')?.id ?? extractClientIp(c)}`
});

export const accountLearnerRouter = new Hono()
  /**
   * GET /account/goals
   * The learner's streak, weekly lesson goal and streak milestones in the active organization. Pass the device's
   * IANA `timezone` to count days in local time; it is saved for reminders.
   */
  .get('/goals', authMiddleware, orgMemberMiddleware, zValidator('query', ZGetLearnerGoalsQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { timezone } = c.req.valid('query');
      const data = await getLearnerGoals(orgId, user.id, timezone);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load goals');
    }
  })
  /**
   * PUT /account/goals
   * Sets how many lessons a week the learner aims to complete, and returns the updated goals.
   */
  .put('/goals', authMiddleware, orgMemberMiddleware, zValidator('json', ZUpdateLearnerGoal), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { weeklyLessonTarget } = c.req.valid('json');
      const data = await updateWeeklyLessonTarget(orgId, user.id, weeklyLessonTarget);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to update the weekly goal');
    }
  })
  /**
   * PUT /account/goals/timezone
   * Saves the learner's IANA time zone, used to count streak days and to time the evening streak reminder.
   */
  .put(
    '/goals/timezone',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZUpdateLearnerTimezone),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { timezone } = c.req.valid('json');
        const data = await updateLearnerTimezone(orgId, user.id, timezone);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update the time zone');
      }
    }
  )
  /**
   * GET /account/live-classes
   * Live classes in the learner's courses that have not ended, soonest first, with registration and join state.
   * `callUrl` is set only while the class can be joined.
   */
  .get('/live-classes', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await listLearnerLiveClasses(orgId, user.id);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load live classes');
    }
  })
  /**
   * GET /account/live-classes/explore
   * Upcoming live classes in catalog courses the learner is not in yet. Registering for one joins its course.
   */
  .get('/live-classes/explore', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await listExploreLiveClasses(orgId, user.id);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load live classes');
    }
  })
  /**
   * POST /account/live-classes/:lessonId/registration
   * Registers the learner for a live class, joining its course first when the course allows it and is free.
   */
  .post(
    '/live-classes/:lessonId/registration',
    authMiddleware,
    orgMemberMiddleware,
    liveClassRegistrationRateLimit,
    zValidator('param', ZLiveClassParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { lessonId } = c.req.valid('param');
        const data = await registerForLiveClass(
          orgId,
          { id: user.id, email: user.email, emailVerified: user.emailVerified },
          lessonId,
          { ipAddress: extractClientIp(c), userAgent: c.req.header('user-agent') || null }
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to register for the live class');
      }
    }
  )
  /**
   * DELETE /account/live-classes/:lessonId/registration
   * Cancels the learner's registration for a live class. They stay in the course.
   */
  .delete(
    '/live-classes/:lessonId/registration',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZLiveClassParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { lessonId } = c.req.valid('param');
        const data = await unregisterFromLiveClass(orgId, user.id, lessonId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to cancel the registration');
      }
    }
  )
  /**
   * GET /account/assignments
   * Exercises across the learner's courses: not yet submitted first by due date, then submitted, then graded.
   */
  .get('/assignments', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await listLearnerAssignments(orgId, user.id);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load assignments');
    }
  })
  /**
   * GET /account/learning-history
   * Courses the learner finished, most recent first. Compliance courses are not included.
   */
  .get('/learning-history', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await listLearningHistory(orgId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load learning history');
    }
  })
  /**
   * POST /account/assistant/chat
   * Streams an answer from the learner's assistant about their courses, progress, assignments, live classes and
   * goals, as an AI SDK UI message stream.
   */
  .post(
    '/assistant/chat',
    authMiddleware,
    orgMemberMiddleware,
    assistantRateLimit,
    zValidator('json', ZLearnerAssistantChatBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { messages } = c.req.valid('json');

        return await streamLearnerAssistantReply({ orgId, profileId: user.id, messages: messages as UIMessage[] });
      } catch (error) {
        return handleError(c, error, 'Failed to answer');
      }
    }
  );
