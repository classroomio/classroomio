import {
  ZPublicApiCourseParam,
  ZPublicApiCourseTemplateParam,
  ZPublicApiCourseTemplatesQuery,
  ZPublicApiCreateCourseFromTemplate,
  ZPublicApiSaveCourseTemplate
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_TEAM_RULE = 'the API key creator must be an org admin or tutor';
const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };

export const ZListCourseTemplatesToolInput = ZPublicApiCourseTemplatesQuery;

export const ZGetCourseTemplateToolInput = ZPublicApiCourseTemplateParam;

export const ZCreateCourseFromTemplateToolInput = ZPublicApiCreateCourseFromTemplate.safeExtend({
  templateId: ZPublicApiCourseTemplateParam.shape.templateId
});

export const ZSaveCourseAsTemplateToolInput = ZPublicApiSaveCourseTemplate.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseTemplateTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_templates',
    `List the course templates the organization can use, its own first and then the curated global ones; ${ORG_TEAM_RULE}. Use get_course_template to see what a template contains.`,
    shape(ZListCourseTemplatesToolInput),
    READ_ONLY,
    async (args) => {
      const query = ZListCourseTemplatesToolInput.parse(args);
      return jsonContent(await apiClient.listCourseTemplates(query));
    }
  );

  server.tool(
    'get_course_template',
    `Get a course template (id from list_course_templates) with its outline, item counts and the settings a new course starts with; ${ORG_TEAM_RULE}.`,
    shape(ZGetCourseTemplateToolInput),
    READ_ONLY,
    async (args) => {
      const { templateId } = ZGetCourseTemplateToolInput.parse(args);
      return jsonContent(await apiClient.getCourseTemplate(templateId));
    }
  );

  server.tool(
    'create_course_from_template',
    `Create an unpublished course from a template, copying its content and settings; ${ORG_ADMIN_RULE}. The key creator is added to the new course as a tutor.`,
    shape(ZCreateCourseFromTemplateToolInput),
    CREATE,
    async (args) => {
      const { templateId, ...payload } = ZCreateCourseFromTemplateToolInput.parse(args);
      return jsonContent(await apiClient.createCourseFromTemplate(templateId, payload));
    }
  );

  server.tool(
    'save_course_as_template',
    `Save a copy of a course as a new unpublished template, leaving the course unchanged; ${ORG_ADMIN_RULE}, and the organization must have a template left on its plan.`,
    shape(ZSaveCourseAsTemplateToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZSaveCourseAsTemplateToolInput.parse(args);
      return jsonContent(await apiClient.saveCourseAsTemplate(courseId, payload));
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
