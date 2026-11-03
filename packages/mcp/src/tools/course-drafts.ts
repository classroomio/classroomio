import {
  ZAutomationCourseTagAssignment,
  ZAutomationDraftTagAssignment,
  ZAutomationDraftTagParam
} from '@cio/utils/validation/tag';
import { ZCourseLandingPageUpdate } from '@cio/utils/validation/course';
import {
  ZCourseImportCourseParam,
  ZCourseImportDraftCreate,
  ZCourseImportDraftCreateFromCourse,
  ZCourseImportDraftGetParam,
  ZCourseImportDraftPublishBase,
  ZCourseImportDraftPublishToCourse,
  ZCourseImportDraftPublishToCourseBase,
  ZCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ZPublicApiCoursesQuery } from '@cio/utils/validation/public-api';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { DESTRUCTIVE, READ_ONLY, WRITE, jsonContent } from './cohort-tool-text';

export const ZUpdateCourseDraftToolInput = ZCourseImportDraftUpdate.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
});

export const ZTagCourseDraftToolInput = ZAutomationDraftTagAssignment.extend({
  draftId: ZAutomationDraftTagParam.shape.draftId
});

export const ZUpdateCourseLandingPageToolInput = ZCourseLandingPageUpdate.extend({
  courseId: ZCourseImportCourseParam.shape.courseId
});

export const ZPublishCourseDraftToolInput = ZCourseImportDraftPublishBase.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
}).refine((data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined, {
  message: 'Compliance settings are required for COMPLIANCE courses',
  path: ['compliance']
});

export const ZPublishCourseDraftToExistingCourseToolInput = ZCourseImportDraftPublishToCourseBase.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
}).refine((data) => data.type !== 'COMPLIANCE' || data.compliance !== undefined, {
  message: 'Compliance settings are required for COMPLIANCE courses',
  path: ['compliance']
});

const createCourseDraftShape = ZCourseImportDraftCreate.shape as unknown as ZodRawShapeCompat;
const createCourseDraftFromCourseShape = ZCourseImportDraftCreateFromCourse.shape as unknown as ZodRawShapeCompat;
const listOrganizationCoursesShape = ZPublicApiCoursesQuery.shape as unknown as ZodRawShapeCompat;
const getCourseStructureShape = ZCourseImportCourseParam.shape as unknown as ZodRawShapeCompat;
const getCourseDraftShape = ZCourseImportDraftGetParam.shape as unknown as ZodRawShapeCompat;
const updateCourseDraftShape = ZUpdateCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const tagCourseDraftShape = ZTagCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseLandingPageShape = ZUpdateCourseLandingPageToolInput.shape as unknown as ZodRawShapeCompat;
const publishCourseDraftShape = ZPublishCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const publishCourseDraftToExistingCourseShape =
  ZPublishCourseDraftToExistingCourseToolInput.shape as unknown as ZodRawShapeCompat;
const tagCoursesShape = ZAutomationCourseTagAssignment.shape as unknown as ZodRawShapeCompat;

const DRAFT_VIDEO_HINT =
  'A local video file can only be attached after publish, with upload_video and then create_lesson or update_lesson.';

export function registerCourseDraftTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_org_courses',
    "List the organization's courses. Use it to find a course id when the user names a course.",
    listOrganizationCoursesShape,
    READ_ONLY,
    async (args) => {
      const query = ZPublicApiCoursesQuery.parse(args);
      const result = await apiClient.listOrganizationCourses(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_structure',
    "Get a live course's current structure. Read it before creating a fresh draft for post-publish edits.",
    getCourseStructureShape,
    READ_ONLY,
    async (args) => {
      const { courseId } = ZCourseImportCourseParam.parse(args);
      const result = await apiClient.getCourseStructure(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_landing_page',
    "Update a live course's landing page fields. Use imageUrl to set an explicit cover image, or generateImage/imageQuery to fetch a random Unsplash-based image.",
    updateCourseLandingPageShape,
    WRITE,
    async (args) => {
      const { courseId, ...payload } = ZUpdateCourseLandingPageToolInput.parse(args);
      const result = await apiClient.updateCourseLandingPage(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_draft',
    `Create an unpublished course draft from structured course JSON, before the first publish. ${DRAFT_VIDEO_HINT}`,
    createCourseDraftShape,
    WRITE,
    async (args) => {
      const payload = ZCourseImportDraftCreate.parse(args);
      const result = await apiClient.createCourseDraft(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_draft_from_course',
    'Create a fresh draft from a live course, to make more changes after it was published.',
    createCourseDraftFromCourseShape,
    WRITE,
    async (args) => {
      const payload = ZCourseImportDraftCreateFromCourse.parse(args);
      const result = await apiClient.createCourseDraftFromCourse(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_draft',
    'Get a draft with its status and publishedCourseId. Use them to decide whether to keep editing it or start a fresh draft from the live course.',
    getCourseDraftShape,
    READ_ONLY,
    async (args) => {
      const { draftId } = ZCourseImportDraftGetParam.parse(args);
      const result = await apiClient.getCourseDraft(draftId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_draft',
    `Update an unpublished draft; once it is published, create a fresh draft from the live course instead. ${DRAFT_VIDEO_HINT}`,
    updateCourseDraftShape,
    WRITE,
    async (args) => {
      const { draftId, ...payload } = ZUpdateCourseDraftToolInput.parse(args);
      const result = await apiClient.updateCourseDraft(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'tag_course_draft',
    'Attach tags to a draft; they are applied when it is published.',
    tagCourseDraftShape,
    DESTRUCTIVE,
    async (args) => {
      const { draftId, ...payload } = ZTagCourseDraftToolInput.parse(args);
      const result = await apiClient.tagCourseDraft(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'publish_course_draft',
    'Publish an unpublished draft as a new live course, returning its courseId and courseUrl. Start later major edits from a fresh draft of the live course.',
    publishCourseDraftShape,
    DESTRUCTIVE,
    async (args) => {
      const { draftId, ...payload } = ZPublishCourseDraftToolInput.parse(args);
      const result = await apiClient.publishCourseDraft(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'publish_course_draft_to_existing_course',
    'Apply a draft back onto an existing live course. Create that draft from the live course first.',
    publishCourseDraftToExistingCourseShape,
    DESTRUCTIVE,
    async (args) => {
      const { draftId, ...payload } = ZPublishCourseDraftToExistingCourseToolInput.parse(args);
      const result = await apiClient.publishCourseDraftToExistingCourse(draftId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'tag_courses',
    'Assign tags to one or more live courses by name; existing tags are kept unless mode is replace. Each course is one write, and if the rate limit stops it partway the error lists the courses already tagged.',
    tagCoursesShape,
    DESTRUCTIVE,
    async (args) => {
      const payload = ZAutomationCourseTagAssignment.parse(args);
      const result = await apiClient.tagCourses(payload);
      return jsonContent(result);
    }
  );
}
