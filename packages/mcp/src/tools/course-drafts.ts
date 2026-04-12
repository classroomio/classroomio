import {
  ZAutomationCourseTagAssignment,
  ZAutomationDraftTagAssignment,
  ZAutomationDraftTagParam
} from '@cio/utils/validation/tag';
import { ZGetOrganizationCoursesQuery } from '@cio/utils/validation/organization';
import {
  ZExerciseCreate,
  ZExerciseFromTemplate,
  ZExerciseGetParam,
  ZExerciseListQuery,
  ZExerciseUpdate
} from '@cio/utils/validation/exercise';
import {
  ZCourseImportCourseParam,
  ZCourseImportDraftCreate,
  ZCourseImportDraftCreateFromCourse,
  ZCourseImportDraftGetParam,
  ZCourseImportDraftPublish,
  ZCourseImportDraftPublishToCourse,
  ZCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';
import {
  ZCourseContentReorder,
  ZCourseContentReorderBase,
  ZCourseLandingPageUpdate
} from '@cio/utils/validation/course';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

import type { ClassroomIoApiClient } from '../api-client.js';

export const ZUpdateCourseDraftToolInput = ZCourseImportDraftUpdate.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
});

export const ZTagCourseDraftToolInput = ZAutomationDraftTagAssignment.extend({
  draftId: ZAutomationDraftTagParam.shape.draftId
});

export const ZListCourseExercisesToolInput = ZExerciseListQuery.extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZGetCourseExerciseToolInput = ZExerciseGetParam.extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZCreateCourseExerciseToolInput = ZExerciseCreate.omit({
  courseId: true
}).extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZCreateCourseExerciseFromTemplateToolInput = ZExerciseFromTemplate.extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZUpdateCourseExerciseToolInput = ZExerciseUpdate.extend({
  courseId: ZCourseImportCourseParam.shape.courseId,
  exerciseId: ZExerciseGetParam.shape.exerciseId
});

export const ZUpdateCourseLandingPageToolInput = ZCourseLandingPageUpdate.extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZReorderCourseContentToolInput = ZCourseContentReorderBase.extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZPublishCourseDraftToolInput = ZCourseImportDraftPublish.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
});

export const ZPublishCourseDraftToExistingCourseToolInput = ZCourseImportDraftPublishToCourse.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
});

const createCourseDraftShape = ZCourseImportDraftCreate.shape as unknown as ZodRawShapeCompat;
const createCourseDraftFromCourseShape = ZCourseImportDraftCreateFromCourse.shape as unknown as ZodRawShapeCompat;
const listOrganizationCoursesShape = ZGetOrganizationCoursesQuery.shape as unknown as ZodRawShapeCompat;
const getCourseStructureShape = ZCourseImportCourseParam.shape as unknown as ZodRawShapeCompat;
const getCourseDraftShape = ZCourseImportDraftGetParam.shape as unknown as ZodRawShapeCompat;
const updateCourseDraftShape = ZUpdateCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const tagCourseDraftShape = ZTagCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const listCourseExercisesShape = ZListCourseExercisesToolInput.shape as unknown as ZodRawShapeCompat;
const getCourseExerciseShape = ZGetCourseExerciseToolInput.shape as unknown as ZodRawShapeCompat;
const createCourseExerciseShape = ZCreateCourseExerciseToolInput.shape as unknown as ZodRawShapeCompat;
const createCourseExerciseFromTemplateShape =
  ZCreateCourseExerciseFromTemplateToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseExerciseShape = ZUpdateCourseExerciseToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseLandingPageShape = ZUpdateCourseLandingPageToolInput.shape as unknown as ZodRawShapeCompat;
const reorderCourseContentShape = ZReorderCourseContentToolInput.shape as unknown as ZodRawShapeCompat;
const publishCourseDraftShape = ZPublishCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const publishCourseDraftToExistingCourseShape =
  ZPublishCourseDraftToExistingCourseToolInput.shape as unknown as ZodRawShapeCompat;
const tagCoursesShape = ZAutomationCourseTagAssignment.shape as unknown as ZodRawShapeCompat;

const SUPPORTED_QUESTION_TYPES_GUIDE =
  'Supported questionTypeId values: RADIO=1 (Single answer), CHECKBOX=2 (Multiple answers), TEXTAREA=3 (Paragraph), TRUE_FALSE=4 (True/False), SHORT_ANSWER=5 (Short answer), NUMERIC=6 (Numeric answer), FILL_BLANK=7 (Fill in the blank), FILE_UPLOAD=8 (File upload), MATCHING=9 (Matching), ORDERING=10 (Ordering), HOTSPOT=11 (Hotspot), LINK=12 (Links), WORD_BANK=13 (Word bank). Use the numeric ids in exercise payloads.';
const LESSON_HTML_GUIDE =
  'For draft lesson HTML, put only the lesson body in lessonLanguages[].content. Do not include the lesson title. Do not use h1 or h2 anywhere in lesson HTML. Start headings at h3 because that is the highest heading level allowed in lesson content.';

export function registerCourseDraftTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_org_courses',
    'List all courses in the authenticated organization. Use this when the user refers to a course by name and you need to discover the available course IDs first.',
    listOrganizationCoursesShape,
    async (args) => {
      const query = ZGetOrganizationCoursesQuery.parse(args);
      const result = await apiClient.listOrganizationCourses(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_structure',
    'Read the current live course structure. Use this before creating a fresh draft for post-publish edits.',
    getCourseStructureShape,
    async (args) => {
      const { courseId } = ZCourseImportCourseParam.parse(args);
      const result = await apiClient.getCourseStructure(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_landing_page',
    'Update landing-page-facing course fields on a live course, including headline copy, overview, requirements, goals, pricing, reviews, instructor information, and the course image. Use imageUrl to set an explicit cover image, or set generateImage/imageQuery to fetch a random Unsplash-based image.',
    updateCourseLandingPageShape,
    async (args) => {
      const { courseId, ...payload } = ZUpdateCourseLandingPageToolInput.parse(args);
      const result = await apiClient.updateCourseLandingPage(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'reorder_course_content',
    'Batch reorder live course sections and lesson or exercise content without creating a draft. Use this for section ordering or moving/reordering lessons and exercises between sections. For items, pass type as LESSON or EXERCISE and use sectionId to move between sections or null for ungrouped content.',
    reorderCourseContentShape,
    async (args) => {
      const { courseId, ...rawPayload } = ZReorderCourseContentToolInput.parse(args);
      const payload = ZCourseContentReorder.parse(rawPayload);
      const result = await apiClient.reorderCourseContent(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_draft',
    `Create a new unpublished course draft from structured course JSON. Use this before the first publish. ${LESSON_HTML_GUIDE}`,
    createCourseDraftShape,
    async (args) => {
      const payload = ZCourseImportDraftCreate.parse(args);
      const result = await apiClient.createCourseDraft(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_draft_from_course',
    'Create a fresh draft from an existing live course. Use this after a course has already been published and the user wants more changes.',
    createCourseDraftFromCourseShape,
    async (args) => {
      const payload = ZCourseImportDraftCreateFromCourse.parse(args);
      const result = await apiClient.createCourseDraftFromCourse(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_draft',
    'Fetch an existing draft. Draft responses include status and publishedCourseId so you can decide whether to keep editing the draft or seed a fresh one from the live course.',
    getCourseDraftShape,
    async (args) => {
      const { draftId } = ZCourseImportDraftGetParam.parse(args);
      const result = await apiClient.getCourseDraft(draftId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_exercises',
    'List exercises for a live course, optionally filtered by lessonId or sectionId.',
    listCourseExercisesShape,
    async (args) => {
      const { courseId, ...query } = ZListCourseExercisesToolInput.parse(args);
      const result = await apiClient.listCourseExercises(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_exercise',
    'Fetch a single exercise from a live course, including its questions and options.',
    getCourseExerciseShape,
    async (args) => {
      const { courseId, exerciseId } = ZGetCourseExerciseToolInput.parse(args);
      const result = await apiClient.getCourseExercise(courseId, exerciseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_exercise',
    `Create a new exercise directly on a live course. Use this for adding exercises after a course has already been published. ${SUPPORTED_QUESTION_TYPES_GUIDE}`,
    createCourseExerciseShape,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseExerciseToolInput.parse(args);
      const result = await apiClient.createCourseExercise(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_exercise_from_template',
    'Create a new exercise on a live course from an existing template.',
    createCourseExerciseFromTemplateShape,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseExerciseFromTemplateToolInput.parse(args);
      const result = await apiClient.createCourseExerciseFromTemplate(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_exercise',
    `Update an existing exercise on a live course, including questions and options. ${SUPPORTED_QUESTION_TYPES_GUIDE}`,
    updateCourseExerciseShape,
    async (args) => {
      const { courseId, exerciseId, ...payload } = ZUpdateCourseExerciseToolInput.parse(args);
      const result = await apiClient.updateCourseExercise(courseId, exerciseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_draft',
    `Update an unpublished draft. If the draft is already published, do not keep editing it blindly; create a fresh draft from the live course first. ${LESSON_HTML_GUIDE}`,
    updateCourseDraftShape,
    async (args) => {
      const { draftId, ...payload } = ZUpdateCourseDraftToolInput.parse(args);
      const result = await apiClient.updateCourseDraft(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'tag_course_draft',
    'Attach human-readable tags to a draft before publish. The tags are stored on the draft and applied during publish.',
    tagCourseDraftShape,
    async (args) => {
      const { draftId, ...payload } = ZTagCourseDraftToolInput.parse(args);
      const result = await apiClient.tagCourseDraft(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'publish_course_draft',
    'Publish an unpublished draft as a new live course. The result includes courseId and courseUrl. After publish, future major edits should usually start from a fresh draft created from the live course.',
    publishCourseDraftShape,
    async (args) => {
      const { draftId, ...payload } = ZPublishCourseDraftToolInput.parse(args);
      const result = await apiClient.publishCourseDraft(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'publish_course_draft_to_existing_course',
    'Apply a fresh draft back onto an existing live course. Use this after reading the live course and creating a new draft from it.',
    publishCourseDraftToExistingCourseShape,
    async (args) => {
      const { draftId, ...payload } = ZPublishCourseDraftToExistingCourseToolInput.parse(args);
      const result = await apiClient.publishCourseDraftToExistingCourse(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'tag_courses',
    'Assign tags directly to one or more live courses by name. Default mode is merge, so existing tags are preserved unless replace is requested.',
    tagCoursesShape,
    async (args) => {
      const payload = ZAutomationCourseTagAssignment.parse(args);
      const result = await apiClient.tagCourses(payload);
      return jsonContent(result);
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
