import {
  PUBLIC_API_MARKETING_SECTION_NOTES,
  ZPublicApiCourseMarketingQuery,
  ZPublicApiCourseParam,
  ZPublicApiMarketingQuery
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { READ_ONLY, jsonContent, withNotes } from './cohort-tool-text';

const ORG_TEAM_RULE = 'the API key creator must be an org admin or tutor';
const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const FRESHNESS = 'each section may be up to 10 minutes old, and meta.generatedAt says when';

export const ZGetMarketingAnalyticsToolInput = ZPublicApiMarketingQuery.extend({
  include: withNotes(ZPublicApiMarketingQuery.shape.include, PUBLIC_API_MARKETING_SECTION_NOTES)
});
export const ZGetCourseMarketingAnalyticsToolInput = ZPublicApiCourseParam.extend(ZPublicApiCourseMarketingQuery.shape);

const marketingShape = ZGetMarketingAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseMarketingShape = ZGetCourseMarketingAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;

export function registerMarketingTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_marketing_analytics',
    `Get the numbers on the organization's Marketing page (traffic, countries, funnel, course types, top courses), with the sections chosen by include; ${ORG_TEAM_RULE}; ${FRESHNESS}.`,
    marketingShape,
    READ_ONLY,
    async (args) => {
      const query = ZGetMarketingAnalyticsToolInput.parse(args);
      const result = await apiClient.getMarketingAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_marketing_analytics',
    `Get one course's funnel: course page view → enrollment → completion over days; ${COURSE_TEAM_RULE}; the result may be up to 10 minutes old, and meta.generatedAt says when.`,
    courseMarketingShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZGetCourseMarketingAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseMarketingAnalytics(courseId, query);
      return jsonContent(result);
    }
  );
}
