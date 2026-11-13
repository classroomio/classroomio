import {
  ZPublicApiCloneCourse,
  ZPublicApiCourseParam,
  ZPublicApiCoursesQuery,
  ZPublicApiCreateCourse,
  ZPublicApiRelatedCoursesQuery
} from '@cio/utils/validation/public-api';
import { ZAutomationCourseTagAssignment } from '@cio/utils/validation/tag';
import { ZCourseLandingPageUpdate } from '@cio/utils/validation/course';
import * as z from 'zod';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const LINKS_RULE =
  'The result has appUrl, the dashboard page where the team edits the course and the link to give the user while the course is unpublished, and landingPageUrl, the public page that is null until the course is published; give the user landingPageUrl only when it is not null.';

const courseId = ZPublicApiCourseParam.shape.courseId;

export const ZCreateCourseToolInput = ZPublicApiCreateCourse.safeExtend({
  generateBannerImage: z
    .boolean()
    .optional()
    .describe(
      'Pick a banner from Unsplash using the title (or bannerImageQuery). On by default; ignored when bannerImageUrl is set; send false for no banner.'
    )
});
export const ZGetCourseStructureToolInput = z.object({ courseId });
export const ZPublishCourseToolInput = z.object({ courseId });
export const ZUpdateCourseLandingPageToolInput = ZCourseLandingPageUpdate.extend({ courseId });
export const ZCloneCourseToolInput = ZPublicApiCloneCourse.safeExtend({ courseId });
export const ZListRelatedCoursesToolInput = ZPublicApiRelatedCoursesQuery.safeExtend({ courseId });

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_org_courses',
    "List the organization's courses. Use it to find a course id when the user names a course.",
    shape(ZPublicApiCoursesQuery),
    READ_ONLY,
    async (args) => {
      const query = ZPublicApiCoursesQuery.parse(args);
      return jsonContent(await apiClient.listOrganizationCourses(query));
    }
  );

  server.tool(
    'get_course_structure',
    "Get a course's current sections, lessons and exercises with their ids. Read it before editing an existing course.",
    shape(ZGetCourseStructureToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId } = ZGetCourseStructureToolInput.parse(args);
      return jsonContent(await apiClient.getCourseStructure(courseId));
    }
  );

  server.tool(
    'create_course',
    `Create a new unpublished course, then fill it with create_course_section, create_lesson, add_lesson_block and the exercise tools; edits land directly in the course and lesson version history lets the team review or undo them. A banner is added by default from an Unsplash search on the title; pass bannerImageUrl (any public image URL, including Unsplash photo URLs) or bannerImageQuery to choose one, and read the banner field to see whether one was applied and why not. ${LINKS_RULE}`,
    shape(ZCreateCourseToolInput),
    { title: 'Create course', ...CREATE },
    async (args) => {
      const payload = ZCreateCourseToolInput.parse(args);
      return jsonContent(
        await apiClient.createCourse({ ...payload, generateBannerImage: payload.generateBannerImage ?? true })
      );
    }
  );

  server.tool(
    'publish_course',
    `Publish a course so students can open it, after the go-live readiness check. Only call it when the user asked to publish; the API key creator must be a course tutor/admin or an org admin. When the course is not ready it stays unpublished and blockers lists what to fix, for example with update_course_landing_page; published tells you the outcome. ${LINKS_RULE}`,
    shape(ZPublishCourseToolInput),
    { title: 'Publish course', ...UPDATE },
    async (args) => {
      const { courseId } = ZPublishCourseToolInput.parse(args);
      return jsonContent(await apiClient.publishCourse(courseId));
    }
  );

  server.tool(
    'unpublish_course',
    'Unpublish a course so students can no longer open it; the API key creator must be a course tutor/admin or an org admin. Existing progress is kept. The result has the same appUrl and landingPageUrl fields, with landingPageUrl null.',
    shape(ZPublishCourseToolInput),
    { title: 'Unpublish course', readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    async (args) => {
      const { courseId } = ZPublishCourseToolInput.parse(args);
      return jsonContent(await apiClient.unpublishCourse(courseId));
    }
  );

  server.tool(
    'update_course_landing_page',
    "Update a course's landing page fields: title, description, overview, price and metadata. For the banner pass imageUrl (any public image URL, including Unsplash photo URLs), or generateImage/imageQuery to pick one from Unsplash. The result's courseUrl only opens for students once the course is published; until then give the user the appUrl from create_course.",
    shape(ZUpdateCourseLandingPageToolInput),
    UPDATE,
    async (args) => {
      const { courseId, ...payload } = ZUpdateCourseLandingPageToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseLandingPage(courseId, payload));
    }
  );

  server.tool(
    'tag_courses',
    'Assign tags to one or more courses by name; existing tags are kept unless mode is replace. Each course is one write, and if the rate limit stops it partway the error lists the courses already tagged.',
    shape(ZAutomationCourseTagAssignment),
    DESTRUCTIVE,
    async (args) => {
      const payload = ZAutomationCourseTagAssignment.parse(args);
      return jsonContent(await apiClient.tagCourses(payload));
    }
  );

  server.tool(
    'list_related_courses',
    'List published courses that share tags with a course, most shared tags first, then newest. Pass profileId to leave out courses that person already has.',
    shape(ZListRelatedCoursesToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListRelatedCoursesToolInput.parse(args);
      return jsonContent(await apiClient.listRelatedCourses(courseId, query));
    }
  );

  server.tool(
    'clone_course',
    'Copy a course with its sections, lessons and exercises, without its students, and add the API key creator as its tutor; the API key creator must be an org admin or tutor.',
    shape(ZCloneCourseToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCloneCourseToolInput.parse(args);
      return jsonContent(await apiClient.cloneCourse(courseId, payload));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
