import { ZPublicApiPaginationQuery } from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { READ_ONLY, jsonContent } from './cohort-tool-text';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

export const ZGetComplianceAnalyticsToolInput = ZPublicApiPaginationQuery.pick({});
export const ZListComplianceStudentsToolInput = ZPublicApiPaginationQuery;

const complianceAnalyticsShape = ZGetComplianceAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const complianceStudentsShape = ZListComplianceStudentsToolInput.shape as unknown as ZodRawShapeCompat;

export function registerComplianceTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_compliance_analytics',
    `Get the numbers on the organization's Compliance page: status counts, overall and per course; ${ORG_ADMIN_RULE}; the result may be up to 10 minutes old, and meta.generatedAt says when. For the rows, use list_compliance_students.`,
    complianceAnalyticsShape,
    READ_ONLY,
    async () => {
      const result = await apiClient.getComplianceAnalytics();
      return jsonContent(result);
    }
  );

  server.tool(
    'list_compliance_students',
    `List each student's latest status, due date and validity in every compliance course; ${ORG_ADMIN_RULE}. For the counts, use get_compliance_analytics.`,
    complianceStudentsShape,
    READ_ONLY,
    async (args) => {
      const query = ZListComplianceStudentsToolInput.parse(args);
      const result = await apiClient.listComplianceStudents(query);
      return jsonContent(result);
    }
  );
}
