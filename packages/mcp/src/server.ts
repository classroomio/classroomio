import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ClassroomIoApiClient } from './api-client';
import { registerAnalyticsTools } from './tools/analytics';
import { registerAudienceTools } from './tools/audience';
import { registerCohortGoalTools } from './tools/cohort-goals';
import { registerCohortNewsfeedTools } from './tools/cohort-newsfeed';
import { registerLessonTools } from './tools/lessons';
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
import { registerOrganizationTools } from './tools/organization';
import { registerTeamTools } from './tools/team';
import { registerMediaUploadTools } from './tools/media-upload';
import { MCP_VERSION } from './version';

export { ClassroomIoApiClient } from './api-client';

export type CreateMcpServerOptions = {
  /** Registers tools that read files from the machine running the server; only safe for a local stdio process. */
  includeLocalFileTools: boolean;
};

/**
 * Builds an MCP server with every ClassroomIO tool bound to the given API client.
 * Callers decide where the client's requests go, so one factory serves stdio and remote transports.
 */
export function createMcpServer(apiClient: ClassroomIoApiClient, options: CreateMcpServerOptions): McpServer {
  const server = new McpServer({
    name: 'classroomio-course-authoring',
    version: MCP_VERSION
  });

  registerCourseDraftTools(server, apiClient);
  registerCourseTools(server, apiClient);
  registerCohortTools(server, apiClient);
  registerCohortNewsfeedTools(server, apiClient);
  registerCohortGoalTools(server, apiClient);
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
  registerOrganizationTools(server, apiClient);
  registerEmailTemplateTools(server, apiClient);
  registerLandingPageTools(server, apiClient);

  if (options.includeLocalFileTools) {
    registerMediaUploadTools(server, apiClient);
  }

  return server;
}
