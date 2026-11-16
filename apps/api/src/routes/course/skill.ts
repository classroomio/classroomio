import {
  ZExerciseSkillsParam,
  ZQuestionSkillsParam,
  ZSetQuestionSkills,
  ZStudentMasteryParam
} from '@cio/utils/validation/skill';
import { getExerciseQuestionSkillsService, setCourseQuestionSkillsService } from '@api/services/skill/skill';
import { getExerciseSkillMastery, getStudentSkillMastery } from '@api/services/skill/mastery';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseGraderMiddleware } from '@api/middlewares/course-grader';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const courseSkillRouter = new Hono()
  .get(
    '/exercise/:exerciseId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZExerciseSkillsParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { exerciseId } = c.req.valid('param');
        const data = await getExerciseQuestionSkillsService(courseId, exerciseId);

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load question skills');
      }
    }
  )
  .put(
    '/exercise/:exerciseId/question/:questionId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZQuestionSkillsParam),
    zValidator('json', ZSetQuestionSkills),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { exerciseId, questionId } = c.req.valid('param');
        const data = await setCourseQuestionSkillsService(courseId, exerciseId, questionId, c.req.valid('json'));

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to set question skills');
      }
    }
  )
  .get(
    '/mastery/exercise/:exerciseId',
    authMiddleware,
    courseGraderMiddleware,
    zValidator('param', ZExerciseSkillsParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { exerciseId } = c.req.valid('param');
        const data = await getExerciseSkillMastery(courseId, exerciseId);

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load skill mastery');
      }
    }
  )
  .get(
    '/mastery/student/:profileId',
    authMiddleware,
    courseGraderMiddleware,
    zValidator('param', ZStudentMasteryParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { profileId } = c.req.valid('param');
        const data = await getStudentSkillMastery(courseId, profileId);

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load student skill mastery');
      }
    }
  );
