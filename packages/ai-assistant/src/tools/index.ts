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
  createExerciseSectionSchema,
  updateExerciseSchema,
  updateExerciseSectionSchema,
  addQuestionsSchema,
  updateQuestionsSchema,
  updateCourseLandingPageSchema,
  checkCourseGoLiveReadinessSchema,
  goLiveCourseSchema,
  generateCoursePlanSchema,
  askTemplateQuestionsSchema,
  fetchDocumentationUrlSchema
} from './teacher';
import { listCourseOutlineSchema, readLessonSchema, readExerciseSchema, searchCourseSchema } from './student';

export {
  LANDING_PAGE_COURSE_DESCRIPTION_PLAIN_HINT,
  LANDING_PAGE_METADATA_DESCRIPTION_SECTION_HINT,
  LANDING_PAGE_SECTION_HTML_AGENT_HINT
} from './landing-page-html-hint';

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
  [ToolName.CREATE_EXERCISE_SECTION]: createExerciseSectionSchema,
  [ToolName.UPDATE_EXERCISE]: updateExerciseSchema,
  [ToolName.UPDATE_EXERCISE_SECTION]: updateExerciseSectionSchema,
  [ToolName.ADD_QUESTIONS]: addQuestionsSchema,
  [ToolName.UPDATE_QUESTIONS]: updateQuestionsSchema,
  [ToolName.UPDATE_COURSE_LANDING_PAGE]: updateCourseLandingPageSchema,
  [ToolName.CHECK_COURSE_GO_LIVE_READINESS]: checkCourseGoLiveReadinessSchema,
  [ToolName.GO_LIVE_COURSE]: goLiveCourseSchema,
  [ToolName.GENERATE_COURSE_PLAN]: generateCoursePlanSchema,
  [ToolName.ASK_TEMPLATE_QUESTIONS]: askTemplateQuestionsSchema,
  [ToolName.FETCH_DOCUMENTATION_URL]: fetchDocumentationUrlSchema
};

const studentTools: ToolRegistry = {
  [ToolName.LIST_COURSE_OUTLINE]: listCourseOutlineSchema,
  [ToolName.READ_LESSON]: readLessonSchema,
  [ToolName.READ_EXERCISE]: readExerciseSchema,
  [ToolName.SEARCH_COURSE]: searchCourseSchema
};

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
  createExerciseSectionSchema,
  updateExerciseSchema,
  updateExerciseSectionSchema,
  addQuestionsSchema,
  updateQuestionsSchema,
  updateCourseLandingPageSchema,
  checkCourseGoLiveReadinessSchema,
  goLiveCourseSchema,
  generateCoursePlanSchema,
  askTemplateQuestionsSchema,
  fetchDocumentationUrlSchema,
  listCourseOutlineSchema,
  readLessonSchema,
  readExerciseSchema,
  searchCourseSchema
};
