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
import { registerDomainTools } from './tools/domain';
import { registerEmailTemplateTools } from './tools/email-templates';
import { registerLandingPageTools } from './tools/landing-page';
import { registerOrganizationTools } from './tools/organization';
import { registerTagTools } from './tools/tags';
import { registerTeamTools } from './tools/team';
import { registerMediaUploadTools } from './tools/media-upload';
import { MCP_VERSION } from './version';

export { ClassroomIoApiClient } from './api-client';

export type CreateMcpServerOptions = {
  /** Registers tools that read files from the machine running the server; only safe for a local stdio process. */
  includeLocalFileTools: boolean;
  /** `compact` registers only reads and common edits, for clients that cannot load the full tool list. */
  toolProfile?: 'full' | 'compact';
};

const COMPACT_WRITE_TOOLS = new Set([
  'add_course_member',
  'add_audience_member',
  'clone_course',
  'create_course_draft_from_course',
  'create_course_from_template',
  'create_course_section',
  'create_lesson',
  'create_tag',
  'create_tag_group',
  'grade_course_submission',
  'invite_team_members',
  'publish_course_draft',
  'set_course_tags',
  'tag_courses',
  'update_cohort',
  'update_course_section',
  'update_lesson',
  'update_organization'
]);

export function isCompactToolName(name: string): boolean {
  return name.startsWith('list_') || name.startsWith('get_') || COMPACT_WRITE_TOOLS.has(name);
}

function onlyToolsNamed(server: McpServer, isIncluded: (name: string) => boolean): McpServer {
  return new Proxy(server, {
    get(target, property) {
      if (property === 'tool' || property === 'registerTool') {
        return (name: string, ...args: unknown[]) => {
          if (!isIncluded(name)) return undefined;

          return (target[property] as (...registerArgs: unknown[]) => unknown).call(target, name, ...args);
        };
      }

      return Reflect.get(target, property, target);
    }
  });
}

/**
 * Builds an MCP server with every ClassroomIO tool bound to the given API client.
 * Callers decide where the client's requests go, so one factory serves stdio and remote transports.
 */
export function createMcpServer(apiClient: ClassroomIoApiClient, options: CreateMcpServerOptions): McpServer {
  const server = new McpServer({
    name: 'classroomio-course-authoring',
    version: MCP_VERSION
  });

  const registry = options.toolProfile === 'compact' ? onlyToolsNamed(server, isCompactToolName) : server;

  registerCourseDraftTools(registry, apiClient);
  registerCourseTools(registry, apiClient);
  registerCohortTools(registry, apiClient);
  registerCohortNewsfeedTools(registry, apiClient);
  registerCohortGoalTools(registry, apiClient);
  registerLessonTools(registry, apiClient);
  registerCourseMemberTools(registry, apiClient);
  registerCourseCertificateTools(registry, apiClient);
  registerCourseSectionTools(registry, apiClient);
  registerCourseLessonTools(registry, apiClient);
  registerCourseContentTools(registry, apiClient);
  registerCourseExerciseTools(registry, apiClient);
  registerCourseSubmissionTools(registry, apiClient);
  registerCourseTemplateTools(registry, apiClient);
  registerAnalyticsTools(registry, apiClient);
  registerAudienceTools(registry, apiClient);
  registerTeamTools(registry, apiClient);
  registerOrganizationTools(registry, apiClient);
  registerEmailTemplateTools(registry, apiClient);
  registerLandingPageTools(registry, apiClient);
  registerTagTools(registry, apiClient);
  registerDomainTools(registry, apiClient);

  if (options.includeLocalFileTools) {
    registerMediaUploadTools(registry, apiClient);
  }

  return server;
}
