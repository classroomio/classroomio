import {
  ZPublicApiCourseParam,
  ZPublicApiListCourseCertificatesQuery,
  ZPublicApiUpdateCourseCertificate
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };

const COURSE_MEMBER_RULE =
  'The API key creator must be a member of the course (including access through a program) or an org admin, otherwise the call fails with 403.';
const COURSE_TEAM_RULE =
  'The API key creator must be a course tutor/admin or an org admin, otherwise the call fails with 403.';

export const ZGetCourseCertificateToolInput = ZPublicApiCourseParam;

export const ZUpdateCourseCertificateToolInput = ZPublicApiUpdateCourseCertificate.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

export const ZListCourseCertificatesToolInput = ZPublicApiListCourseCertificatesQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

const getCourseCertificateShape = ZGetCourseCertificateToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseCertificateShape = ZUpdateCourseCertificateToolInput.shape as unknown as ZodRawShapeCompat;
const listCourseCertificatesShape = ZListCourseCertificatesToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCourseCertificateTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_course_certificate',
    `Read a course's certificate settings and design: template, accent colour, signatories, subtitle, ID format, whether learners can download it, the completion email message, and completion rules (deadline, threshold, required exercise). ${COURSE_MEMBER_RULE}`,
    getCourseCertificateShape,
    READ_ONLY,
    async (args) => {
      const { courseId } = ZGetCourseCertificateToolInput.parse(args);
      const result = await apiClient.getCourseCertificate(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_certificate',
    `Update a course's certificate settings and design. Only the fields you send change; omitted fields keep their current values. design is replaced as a whole object, so read it with get_course_certificate first and send the full design. Sending design without theme sets theme to design.templateId. ${COURSE_TEAM_RULE}`,
    updateCourseCertificateShape,
    WRITE,
    async (args) => {
      const { courseId, ...payload } = ZUpdateCourseCertificateToolInput.parse(args);
      const result = await apiClient.updateCourseCertificate(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_certificates',
    `List the students of a course who have earned its certificate, with when it was earned and when the certificate email was sent. Optional search matches name or email. Paginated: page (default 1) and limit (default 20, max 100); the result includes pagination. ${COURSE_TEAM_RULE}`,
    listCourseCertificatesShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseCertificatesToolInput.parse(args);
      const result = await apiClient.listCourseCertificates(courseId, query);
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
