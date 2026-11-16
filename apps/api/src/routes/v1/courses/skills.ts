import { ZExerciseSkillsParam, ZQuestionSkillsParam, ZSetQuestionSkills } from '@cio/utils/validation/skill';
import { ZPublicApiCourseParam } from '@cio/utils/validation/public-api';
import { getPublicApiExerciseSkillMasteryService, setPublicApiQuestionSkillsService } from '@api/services/v1/skills';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, exerciseForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Skills';
const dataResponse = { type: 'object' as const, properties: { success: { type: 'boolean' as const }, data: {} } };

export const v1CourseQuestionSkillsRouter = new Hono().put(
  '/',
  describeRoute({
    description: `Replace the skills a question is tagged with; ${COURSE_TEAM_RULE}. Send an empty list to remove them all.`,
    tags: [TAG],
    responses: {
      200: jsonResponse('The question and its skill ids', dataResponse),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: exerciseForbiddenResponses.write,
      404: { description: 'Course, exercise, question or skill not found' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseParam.extend(ZQuestionSkillsParam.shape)),
  validator('json', ZSetQuestionSkills),
  async (c) => {
    try {
      const { courseId, exerciseId, questionId } = c.req.valid('param');
      const result = await setPublicApiQuestionSkillsService(
        c.get('orgId')!,
        c.get('actorId'),
        courseId,
        exerciseId,
        questionId,
        c.req.valid('json')
      );

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to set question skills');
    }
  }
);

export const v1CourseSkillMasteryRouter = new Hono().get(
  '/',
  describeRoute({
    description: `Skill mastery for the skills tagged on an exercise: each student's mastery level per skill and how many students sit at each level; ${COURSE_TEAM_RULE}.`,
    tags: [TAG],
    responses: {
      200: jsonResponse('Skills, per-student mastery and a per-skill level summary', dataResponse),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: exerciseForbiddenResponses.read,
      404: { description: 'Course or exercise not found' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseParam.extend(ZExerciseSkillsParam.shape)),
  async (c) => {
    try {
      const { courseId, exerciseId } = c.req.valid('param');
      const result = await getPublicApiExerciseSkillMasteryService(
        c.get('orgId')!,
        c.get('actorId'),
        courseId,
        exerciseId
      );

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to load skill mastery');
    }
  }
);
