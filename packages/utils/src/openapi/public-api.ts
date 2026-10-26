export const PUBLIC_API_BASE_URL = 'https://api.classroomio.com/public-api/v1';
export const PUBLIC_API_OPENAPI_URL = 'https://api.cdn.clsrio.com/openapi/public-api/openapi-latest.json';
export const PUBLIC_API_BEARER_SCHEME = 'bearerAuth';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

export const PUBLIC_API_OPENAPI_DESCRIPTION = `Every endpoint in the ClassroomIO public API, grouped by resource.

New to the API? Start with the [introduction](https://classroomio.com/docs/api), then read [Authentication](https://classroomio.com/docs/api/authentication), [Rate limits](https://classroomio.com/docs/api/rate-limits), [Errors](https://classroomio.com/docs/api/errors), and [Pagination](https://classroomio.com/docs/api/pagination).
`;

type OpenApiDocument = Record<string, unknown>;

function applySecurityToOperations(paths: Record<string, unknown>) {
  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method];

      if (!operation || typeof operation !== 'object') {
        continue;
      }

      (operation as Record<string, unknown>).security = [{ [PUBLIC_API_BEARER_SCHEME]: [] }];
    }
  }
}

// hono-openapi sets `description` per operation but never `summary`. Scalar's
// endpoint list prefers `summary` and falls back to the raw path when it's
// missing — since every path here starts with `/public-api/v1/...`, every
// entry in the reference's sidebar rendered as a near-duplicate route string.
// Keyed by "METHOD /path" (the exact template, including `{param}` braces).
const OPERATION_SUMMARIES: Record<string, string> = {
  'GET /public-api/v1/audience': 'List audience members',
  'POST /public-api/v1/audience': 'Invite audience members',
  'POST /public-api/v1/audience/assign-courses': 'Assign members to courses',
  'GET /public-api/v1/audience/{memberId}': 'Get an audience member',
  'PUT /public-api/v1/audience/{memberId}': 'Update an audience member',
  'DELETE /public-api/v1/audience/{memberId}': 'Remove an audience member',
  'GET /public-api/v1/team': 'List team members',
  'GET /public-api/v1/team/{memberId}': 'Get a team member',
  'PUT /public-api/v1/team/{memberId}': 'Update a team member',
  'GET /public-api/v1/organization/email-templates': 'List student email templates',
  'GET /public-api/v1/organization/email-templates/{emailId}/{locale}': 'Get a student email template',
  'PUT /public-api/v1/organization/email-templates/{emailId}/{locale}': 'Save a student email template',
  'DELETE /public-api/v1/organization/email-templates/{emailId}/{locale}': 'Reset a student email template',
  'POST /public-api/v1/organization/email-templates/{emailId}/{locale}/test': 'Send a test student email',
  'PUT /public-api/v1/organization/landing-page/featured-courses': 'Set featured courses',
  'GET /public-api/v1/courses': 'List courses',
  'POST /public-api/v1/courses': 'Create a course',
  'GET /public-api/v1/courses/{courseId}': 'Get a course',
  'PUT /public-api/v1/courses/{courseId}': 'Update a course',
  'DELETE /public-api/v1/courses/{courseId}': 'Delete a course',
  'POST /public-api/v1/courses/{courseId}/clone': 'Clone a course',
  'GET /public-api/v1/courses/{courseId}/students': 'List course students',
  'GET /public-api/v1/courses/{courseId}/export': 'Export course structure',
  'GET /public-api/v1/courses/{courseId}/structure': 'Get course structure',
  'PUT /public-api/v1/courses/{courseId}/structure': 'Sync course structure',
  'GET /public-api/v1/courses/{courseId}/certificate': 'Get course certificate settings',
  'PATCH /public-api/v1/courses/{courseId}/certificate': 'Update course certificate settings',
  'GET /public-api/v1/courses/{courseId}/certificates': 'List issued course certificates',
  'GET /public-api/v1/courses/{courseId}/certificates/{memberId}/download': 'Download an issued course certificate',
  'GET /public-api/v1/courses/{courseId}/sections': 'List course sections',
  'POST /public-api/v1/courses/{courseId}/sections': 'Create a course section',
  'PUT /public-api/v1/courses/{courseId}/sections/{sectionId}': 'Update a course section',
  'DELETE /public-api/v1/courses/{courseId}/sections/{sectionId}': 'Delete a course section',
  'GET /public-api/v1/courses/{courseId}/lessons': 'List course lessons',
  'GET /public-api/v1/courses/{courseId}/lessons/{lessonId}': 'Get a course lesson',
  'DELETE /public-api/v1/courses/{courseId}/lessons/{lessonId}': 'Delete a course lesson',
  'POST /public-api/v1/courses/{courseId}/lessons/{lessonId}/notify-session-update':
    'Notify students of a session update',
  'GET /public-api/v1/courses/{courseId}/lessons/{lessonId}/translations': 'List lesson translations',
  'PUT /public-api/v1/courses/{courseId}/lessons/{lessonId}/translations/{locale}': 'Save a lesson translation',
  'GET /public-api/v1/courses/{courseId}/lessons/{lessonId}/history': 'List lesson version history',
  'GET /public-api/v1/courses/{courseId}/lessons/{lessonId}/comments': 'List lesson comments',
  'POST /public-api/v1/courses/{courseId}/lessons/{lessonId}/comments': 'Post a lesson comment',
  'PUT /public-api/v1/courses/{courseId}/lessons/{lessonId}/comments/{commentId}': 'Edit a lesson comment',
  'DELETE /public-api/v1/courses/{courseId}/lessons/{lessonId}/comments/{commentId}': 'Delete a lesson comment',
  'PUT /public-api/v1/courses/{courseId}/content/reorder': 'Reorder course content',
  'PATCH /public-api/v1/courses/{courseId}/content': 'Lock or unlock course content',
  'DELETE /public-api/v1/courses/{courseId}/content': 'Delete course content',
  'GET /public-api/v1/courses/{courseId}/exercises': 'List course exercises',
  'POST /public-api/v1/courses/{courseId}/exercises': 'Create a course exercise',
  'GET /public-api/v1/courses/{courseId}/exercises/{exerciseId}': 'Get a course exercise',
  'PUT /public-api/v1/courses/{courseId}/exercises/{exerciseId}': 'Update a course exercise',
  'DELETE /public-api/v1/courses/{courseId}/exercises/{exerciseId}': 'Delete a course exercise',
  'POST /public-api/v1/courses/{courseId}/exercises/{exerciseId}/questions': 'Add an exercise question',
  'PATCH /public-api/v1/courses/{courseId}/exercises/{exerciseId}/questions/{questionId}':
    'Update an exercise question',
  'DELETE /public-api/v1/courses/{courseId}/exercises/{exerciseId}/questions/{questionId}':
    'Delete an exercise question',
  'POST /public-api/v1/courses/{courseId}/exercises/{exerciseId}/sections': 'Add an exercise section',
  'PATCH /public-api/v1/courses/{courseId}/exercises/{exerciseId}/sections/{sectionId}': 'Update an exercise section',
  'DELETE /public-api/v1/courses/{courseId}/exercises/{exerciseId}/sections/{sectionId}': 'Delete an exercise section',
  'POST /public-api/v1/courses/{courseId}/exercises/{exerciseId}/notify': 'Notify course members about an exercise',
  'GET /public-api/v1/courses/{courseId}/exercises/{exerciseId}/notify/{jobId}': 'Get an exercise notification status',
  'GET /public-api/v1/exercise-templates': 'List exercise templates',
  'GET /public-api/v1/exercise-templates/{templateId}': 'Get an exercise template',
  'GET /public-api/v1/course-templates': 'List course templates',
  'GET /public-api/v1/course-templates/{templateId}': 'Get a course template',
  'POST /public-api/v1/course-templates/{templateId}/courses': 'Create a course from a template',
  'POST /public-api/v1/courses/{courseId}/template': 'Save a course as a template',
  'GET /public-api/v1/courses/{courseId}/submissions': 'List course submissions',
  'GET /public-api/v1/courses/{courseId}/submissions/{submissionId}': 'Get a submission',
  'PUT /public-api/v1/courses/{courseId}/submissions/{submissionId}/grades': 'Grade a submission',
  'PATCH /public-api/v1/courses/{courseId}/submissions/{submissionId}': 'Update a submission',
  'DELETE /public-api/v1/courses/{courseId}/submissions/{submissionId}': 'Delete a submission',
  'PUT /public-api/v1/courses/{courseId}/members/{memberId}/lessons/{lessonId}/completion':
    'Set lesson completion for a student',
  'POST /public-api/v1/courses/{courseId}/members/{memberId}/exercises/{exerciseId}/submissions':
    'Submit an exercise for a student',
  'GET /public-api/v1/courses/{courseId}/marks': 'Get course marks',
  'GET /public-api/v1/courses/{courseId}/members': 'List course members',
  'POST /public-api/v1/courses/{courseId}/members': 'Add a course member',
  'GET /public-api/v1/courses/{courseId}/members/{memberId}': 'Get a course member',
  'PUT /public-api/v1/courses/{courseId}/members/{memberId}': 'Update a course member',
  'DELETE /public-api/v1/courses/{courseId}/members/{memberId}': 'Remove a course member',
  'POST /public-api/v1/courses/{courseId}/members/{memberId}/reset-progress': 'Reset member progress',
  'GET /public-api/v1/courses/{courseId}/members/{memberId}/analytics': 'Get member analytics',
  'GET /public-api/v1/courses/{courseId}/invites': 'List invites',
  'POST /public-api/v1/courses/{courseId}/invites': 'Create an invite',
  'POST /public-api/v1/courses/{courseId}/invites/{inviteId}/revoke': 'Revoke an invite',
  'POST /public-api/v1/courses/{courseId}/lessons': 'Create a course lesson',
  'PUT /public-api/v1/courses/{courseId}/lessons/{lessonId}': 'Update a course lesson',
  'POST /public-api/v1/assets': 'Reserve an asset upload',
  'GET /public-api/v1/cohorts': 'List cohorts',
  'POST /public-api/v1/cohorts': 'Create a cohort',
  'GET /public-api/v1/cohorts/{cohortId}': 'Get a cohort',
  'PUT /public-api/v1/cohorts/{cohortId}': 'Update a cohort',
  'DELETE /public-api/v1/cohorts/{cohortId}': 'Delete a cohort',
  'GET /public-api/v1/cohorts/{cohortId}/members': 'List cohort members',
  'POST /public-api/v1/cohorts/{cohortId}/members': 'Add cohort members',
  'PUT /public-api/v1/cohorts/{cohortId}/members/{memberId}': 'Update a cohort member',
  'DELETE /public-api/v1/cohorts/{cohortId}/members/{memberId}': 'Remove a cohort member',
  'GET /public-api/v1/cohorts/{cohortId}/courses': 'List cohort courses',
  'POST /public-api/v1/cohorts/{cohortId}/courses': 'Add a course to a cohort',
  'DELETE /public-api/v1/cohorts/{cohortId}/courses/{courseId}': 'Remove a course from a cohort',
  'GET /public-api/v1/cohorts/{cohortId}/newsfeed': 'List cohort newsfeed',
  'POST /public-api/v1/cohorts/{cohortId}/newsfeed': 'Create a cohort newsfeed post',
  'PUT /public-api/v1/cohorts/{cohortId}/newsfeed/{feedId}': 'Update a cohort newsfeed post',
  'PUT /public-api/v1/cohorts/{cohortId}/newsfeed/{feedId}/react': 'Set your reaction on a cohort newsfeed post',
  'DELETE /public-api/v1/cohorts/{cohortId}/newsfeed/{feedId}': 'Delete a cohort newsfeed post',
  'GET /public-api/v1/cohorts/{cohortId}/newsfeed/{feedId}/comments': 'List comments on a cohort newsfeed post',
  'POST /public-api/v1/cohorts/{cohortId}/newsfeed/{feedId}/comment': 'Add a comment to a cohort newsfeed post',
  'DELETE /public-api/v1/cohorts/{cohortId}/newsfeed/{feedId}/comment/{commentId}':
    'Delete a comment from a cohort newsfeed post',
  'GET /public-api/v1/cohorts/{cohortId}/goals': 'List cohort goals',
  'POST /public-api/v1/cohorts/{cohortId}/goals': 'Create a cohort goal',
  'GET /public-api/v1/cohorts/{cohortId}/goals/{goalId}': 'Get a cohort goal',
  'PUT /public-api/v1/cohorts/{cohortId}/goals/{goalId}': 'Update a cohort goal',
  'DELETE /public-api/v1/cohorts/{cohortId}/goals/{goalId}': 'Delete a cohort goal',
  'POST /public-api/v1/cohorts/{cohortId}/goals/{goalId}/archive': 'Archive a cohort goal',
  'POST /public-api/v1/cohorts/{cohortId}/goals/{goalId}/evaluate': 'Re-evaluate a cohort goal',
  'POST /public-api/v1/cohorts/{cohortId}/goals/evaluate-all': 'Re-evaluate all cohort goals',
  'GET /public-api/v1/cohorts/goals/overview': 'Get the organization goals overview',
  'GET /public-api/v1/cohorts/my/goals': 'List your cohort goal assignments',
  'GET /public-api/v1/cohorts/enrolled': 'List cohorts you are enrolled in',
  'POST /public-api/v1/cohorts/{cohortId}/invite': 'Invite students to a cohort by email',
  'POST /public-api/v1/cohorts/{cohortId}/invite/assign': 'Assign existing students to a cohort',
  'GET /public-api/v1/cohorts/{cohortId}/invite-link': 'Get the cohort join link',
  'POST /public-api/v1/cohorts/{cohortId}/invite-link': 'Create the cohort join link',
  'PATCH /public-api/v1/cohorts/{cohortId}/invite-link': 'Disable or re-enable the cohort join link',
  'GET /public-api/v1/analytics': 'Get organization analytics',
  'GET /public-api/v1/analytics/compliance/learners': 'List compliance status per learner',
  'GET /public-api/v1/analytics/learners/{profileId}': "Get a learner's analytics",
  'GET /public-api/v1/courses/{courseId}/analytics': 'Get course analytics',
  'GET /public-api/v1/courses/{courseId}/analytics/students': 'List per-student course analytics'
};

const OPERATION_TAGS = [
  { name: 'Audience', description: 'Manage people in your organization.' },
  { name: 'Team', description: 'Manage the admins and tutors of your organization.' },
  {
    name: 'Organization Email Templates',
    description: 'Read, customize, translate and reset the emails your organization sends to students.'
  },
  { name: 'Organization Landing Page', description: "Manage your organization's public landing page." },
  { name: 'Courses', description: 'Create, update, delete, and clone courses.' },
  { name: 'Course Structure', description: 'Export, read, and sync a course structure snapshot.' },
  { name: 'Course Members', description: 'Manage the people in a course and their progress.' },
  { name: 'Course Invites', description: 'Invite people to a course.' },
  { name: 'Course Sections', description: 'Add, rename, move and delete course sections.' },
  {
    name: 'Course Lessons',
    description: 'List, create, read, update and delete lessons, including attached videos.'
  },
  {
    name: 'Lesson Translations',
    description: "Read and save a lesson's content per language, and its version history."
  },
  { name: 'Lesson Comments', description: 'Read, post, edit and delete comments on a lesson.' },
  { name: 'Course Content', description: 'Reorder, lock and delete lessons and exercises in bulk.' },
  { name: 'Course Exercises', description: 'Create and manage course exercises.' },
  { name: 'Exercise Questions', description: 'Manage the questions of a course exercise.' },
  { name: 'Exercise Sections', description: 'Manage the sections of a course exercise.' },
  { name: 'Exercise Templates', description: 'Browse built-in exercise templates.' },
  { name: 'Course Submissions', description: 'Review and grade exercise submissions and read the course gradebook.' },
  { name: 'Course Certificates', description: 'Configure course certificates and list who earned them.' },
  {
    name: 'Course Templates',
    description:
      'Browse course templates, create courses from them, and save courses as templates. Converting a course into a template in place and pulling template updates are dashboard-only for now.'
  },
  { name: 'Public API Assets', description: 'Reserve asset uploads for media attached to lessons and exercises.' },
  { name: 'Cohorts', description: 'Create and manage cohorts.' },
  { name: 'Cohort Members', description: 'Manage the people in a cohort.' },
  { name: 'Cohort Courses', description: 'Link and unlink courses on a cohort.' },
  { name: 'Cohort Invites', description: 'Invite people to a cohort.' },
  { name: 'Cohort Newsfeed', description: 'Post, react, and moderate a cohort newsfeed.' },
  { name: 'Cohort Newsfeed Comments', description: 'Manage comments on cohort newsfeed posts.' },
  { name: 'Cohort Goals', description: 'Create and manage cohort goals.' },
  { name: 'Analytics', description: 'Read organization, course, learner, and compliance analytics.' }
];

function applySummariesToOperations(paths: Record<string, unknown>) {
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method];

      if (!operation || typeof operation !== 'object') {
        continue;
      }

      const summary = OPERATION_SUMMARIES[`${method.toUpperCase()} ${path}`];
      if (summary && !(operation as Record<string, unknown>).summary) {
        (operation as Record<string, unknown>).summary = summary;
      }
    }
  }
}

export function enrichPublicApiOpenApiSpec<T extends OpenApiDocument>(spec: T): T {
  const components = (spec.components ?? {}) as Record<string, unknown>;
  const securitySchemes = (components.securitySchemes ?? {}) as Record<string, unknown>;
  const paths = (spec.paths ?? {}) as Record<string, unknown>;
  const info = (spec.info ?? {}) as Record<string, unknown>;
  const tags = (spec.tags ?? []) as Array<{ name: string }>;
  const existingTagNames = new Set(tags.map((tag) => tag.name));

  applySecurityToOperations(paths);
  applySummariesToOperations(paths);

  return {
    ...spec,
    info: {
      ...info,
      title: typeof info.title === 'string' ? info.title : 'ClassroomIO Public API',
      version: typeof info.version === 'string' ? info.version : '1.0.0',
      description: PUBLIC_API_OPENAPI_DESCRIPTION
    },
    servers: [{ url: 'https://api.classroomio.com', description: 'Production environment' }],
    paths,
    tags: [...tags, ...OPERATION_TAGS.filter((tag) => !existingTagNames.has(tag.name))],
    components: {
      ...components,
      securitySchemes: {
        ...securitySchemes,
        [PUBLIC_API_BEARER_SCHEME]: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description:
            'Organization API key from Automation → API in your org dashboard. Paste the full `cio_api_...` value as the Bearer token.'
        }
      }
    },
    security: [{ [PUBLIC_API_BEARER_SCHEME]: [] }]
  };
}
