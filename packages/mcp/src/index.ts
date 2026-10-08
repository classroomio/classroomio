import { ClassroomIoApiClient, ClassroomIoApiError } from './api-client';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getConfig } from './config';
import { registerAnalyticsTools } from './tools/analytics';
import { registerCohortGoalTools } from './tools/cohort-goals';
import { registerCohortNewsfeedTools } from './tools/cohort-newsfeed';
import { registerCohortTools } from './tools/cohorts';
import { registerCourseCertificateTools } from './tools/course-certificates';
import { registerCourseContentTools } from './tools/course-content';
import { registerCourseDraftTools } from './tools/course-drafts';
import { registerCourseLessonTools } from './tools/course-lessons';
import { registerCourseMemberTools } from './tools/course-members';
import { registerCourseSectionTools } from './tools/course-sections';

async function main() {
  const config = getConfig();
  const apiClient = new ClassroomIoApiClient(config);
  const server = new McpServer({
    name: 'classroomio-course-authoring',
    version: '0.0.1'
  });

  registerCourseDraftTools(server, apiClient);
  registerCohortTools(server, apiClient);
  registerCohortNewsfeedTools(server, apiClient);
  registerCohortGoalTools(server, apiClient);
  registerCourseMemberTools(server, apiClient);
  registerCourseCertificateTools(server, apiClient);
  registerCourseSectionTools(server, apiClient);
  registerCourseLessonTools(server, apiClient);
  registerCourseContentTools(server, apiClient);
  registerAnalyticsTools(server, apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stdin.on('close', () => {
    void server.close();
  });
}

main().catch((error: unknown) => {
  if (error instanceof ClassroomIoApiError) {
    console.error(
      JSON.stringify({
        error: error.message,
        status: error.status,
        code: error.code,
        field: error.field
      })
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
