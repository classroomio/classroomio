import { ClassroomIoApiClient, ClassroomIoApiError } from './api-client';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getConfig } from './config';
import { registerAnalyticsTools } from './tools/analytics';
import { registerAudienceTools } from './tools/audience';
import { registerCohortGoalTools } from './tools/cohort-goals';
import { registerCohortNewsfeedTools } from './tools/cohort-newsfeed';
import { registerLessonTools } from './tools/lessons';
import { registerMediaUploadTools } from './tools/media-upload';
import { registerCohortTools } from './tools/cohorts';
import { registerCourseCertificateTools } from './tools/course-certificates';
import { registerCourseContentTools } from './tools/course-content';
import { registerCourseDraftTools } from './tools/course-drafts';
import { registerCourseLessonTools } from './tools/course-lessons';
import { registerCourseMemberTools } from './tools/course-members';
import { registerCourseSectionTools } from './tools/course-sections';
import { registerCourseExerciseTools } from './tools/course-exercises';
import { registerCourseSubmissionTools } from './tools/course-submissions';
import { registerCourseTools } from './tools/courses';
import { registerCourseTemplateTools } from './tools/course-templates';
import { registerEmailTemplateTools } from './tools/email-templates';
import { registerLandingPageTools } from './tools/landing-page';
import { registerTeamTools } from './tools/team';

async function main() {
  const config = getConfig();
  const apiClient = new ClassroomIoApiClient(config);
  const server = new McpServer({
    name: 'classroomio-course-authoring',
    version: '0.0.1'
  });

  registerCourseDraftTools(server, apiClient);
  registerCourseTools(server, apiClient);
  registerCohortTools(server, apiClient);
  registerCohortNewsfeedTools(server, apiClient);
  registerCohortGoalTools(server, apiClient);
  registerMediaUploadTools(server, apiClient);
  registerLessonTools(server, apiClient);
  registerCourseMemberTools(server, apiClient);
  registerCourseCertificateTools(server, apiClient);
  registerCourseSectionTools(server, apiClient);
  registerCourseLessonTools(server, apiClient);
  registerCourseContentTools(server, apiClient);
  registerCourseExerciseTools(server, apiClient);
  registerCourseSubmissionTools(server, apiClient);
  registerCourseTemplateTools(server, apiClient);
  registerAnalyticsTools(server, apiClient);
  registerAudienceTools(server, apiClient);
  registerTeamTools(server, apiClient);
  registerEmailTemplateTools(server, apiClient);
  registerLandingPageTools(server, apiClient);

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
