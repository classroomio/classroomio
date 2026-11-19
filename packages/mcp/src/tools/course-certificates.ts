import {
  ZPublicApiCourseCertificateMemberParam,
  ZPublicApiCourseParam,
  ZPublicApiDownloadCourseCertificateQuery,
  ZPublicApiListCourseCertificatesQuery,
  ZPublicApiUpdateCourseCertificate
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

const COURSE_MEMBER_RULE =
  'the API key creator must be a course member (directly or through a program) or an org admin';
const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';

export const ZGetCourseCertificateToolInput = ZPublicApiCourseParam;

export const ZUpdateCourseCertificateToolInput = ZPublicApiUpdateCourseCertificate.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

export const ZListCourseCertificatesToolInput = ZPublicApiListCourseCertificatesQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

export const ZDownloadCourseCertificateToolInput = ZPublicApiCourseCertificateMemberParam.extend(
  ZPublicApiDownloadCourseCertificateQuery.shape
);

const getCourseCertificateShape = ZGetCourseCertificateToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseCertificateShape = ZUpdateCourseCertificateToolInput.shape as unknown as ZodRawShapeCompat;
const listCourseCertificatesShape = ZListCourseCertificatesToolInput.shape as unknown as ZodRawShapeCompat;
const downloadCourseCertificateShape = ZDownloadCourseCertificateToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCourseCertificateTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_course_certificate',
    `Get a course's certificate settings and design, with defaults filled in where nothing is stored; ${COURSE_MEMBER_RULE}.`,
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
    `Partially update a course's certificate settings and design; ${COURSE_TEAM_RULE}. design is replaced whole, so read it with get_course_certificate first; on the Basic (free) plan this fails with 403 UPGRADE_REQUIRED.`,
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
    `List the students who earned a course's certificate, with when they earned it and when its email was sent; ${COURSE_TEAM_RULE}. Compliance cycle and recertification history is not included.`,
    listCourseCertificatesShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseCertificatesToolInput.parse(args);
      const result = await apiClient.listCourseCertificates(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'download_course_certificate',
    `Download the certificate a student earned as a PDF or PNG, rendered with the course's current design; ${COURSE_TEAM_RULE}. Get memberId from list_course_certificates.`,
    downloadCourseCertificateShape,
    READ_ONLY,
    async (args) => {
      const { courseId, memberId, format } = ZDownloadCourseCertificateToolInput.parse(args);
      const file = await apiClient.downloadCourseCertificate(courseId, memberId, format);

      if (format === 'png') {
        return { content: [{ type: 'image' as const, data: file.base64, mimeType: file.mimeType }] };
      }

      return {
        content: [
          {
            type: 'resource' as const,
            resource: {
              uri: `classroomio://courses/${courseId}/certificates/${memberId}.pdf`,
              mimeType: file.mimeType,
              blob: file.base64
            }
          }
        ]
      };
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
