import { AgentRole, ToolName } from '../types';
import type { ZodType } from 'zod';
import { getCourseStructureSchema, getLessonContentSchema, getExerciseDetailsSchema } from './shared';
import {
  createSectionSchema,
  updateSectionSchema,
  createLessonSchema,
  updateLessonSchema,
  updateLessonContentSchema,
  createExerciseSchema,
  updateExerciseSchema,
  addQuestionsSchema,
  updateQuestionsSchema,
  updateCourseLandingPageSchema,
  checkCourseGoLiveReadinessSchema,
  goLiveCourseSchema,
  generateCoursePlanSchema
} from './teacher';

export type ToolSchema = {
  description: string;
  parameters: ZodType;
};

type ToolRegistry = Record<string, ToolSchema>;

const sharedTools: ToolRegistry = {
  [ToolName.GET_COURSE_STRUCTURE]: getCourseStructureSchema,
  [ToolName.GET_LESSON_CONTENT]: getLessonContentSchema,
  [ToolName.GET_EXERCISE_DETAILS]: getExerciseDetailsSchema
};

const teacherTools: ToolRegistry = {
  [ToolName.CREATE_SECTION]: createSectionSchema,
  [ToolName.UPDATE_SECTION]: updateSectionSchema,
  [ToolName.CREATE_LESSON]: createLessonSchema,
  [ToolName.UPDATE_LESSON]: updateLessonSchema,
  [ToolName.UPDATE_LESSON_CONTENT]: updateLessonContentSchema,
  [ToolName.CREATE_EXERCISE]: createExerciseSchema,
  [ToolName.UPDATE_EXERCISE]: updateExerciseSchema,
  [ToolName.ADD_QUESTIONS]: addQuestionsSchema,
  [ToolName.UPDATE_QUESTIONS]: updateQuestionsSchema,
  [ToolName.UPDATE_COURSE_LANDING_PAGE]: updateCourseLandingPageSchema,
  [ToolName.CHECK_COURSE_GO_LIVE_READINESS]: checkCourseGoLiveReadinessSchema,
  [ToolName.GO_LIVE_COURSE]: goLiveCourseSchema,
  [ToolName.GENERATE_COURSE_PLAN]: generateCoursePlanSchema
};

// v2: student tools will be added here
const studentTools: ToolRegistry = {};

/**
 * Returns tool schemas available for a given role.
 * Teachers get shared + teacher tools.
 * Students get shared + student tools (v2).
 */
export function getToolSchemas(role: AgentRole): ToolRegistry {
  switch (role) {
    case AgentRole.TEACHER:
      return { ...sharedTools, ...teacherTools };
    case AgentRole.STUDENT:
      return { ...sharedTools, ...studentTools };
    default:
      return sharedTools;
  }
}

// Re-export individual schemas for direct access
export {
  getCourseStructureSchema,
  getLessonContentSchema,
  getExerciseDetailsSchema,
  createSectionSchema,
  updateSectionSchema,
  createLessonSchema,
  updateLessonSchema,
  updateLessonContentSchema,
  createExerciseSchema,
  updateExerciseSchema,
  addQuestionsSchema,
  updateQuestionsSchema,
  updateCourseLandingPageSchema,
  checkCourseGoLiveReadinessSchema,
  goLiveCourseSchema,
  generateCoursePlanSchema
};
