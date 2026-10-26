import {
  ZPublicApiCertificateSettingsResponse,
  ZPublicApiIssuedCertificateListItemResponse
} from '@cio/utils/validation/public-api';
import { itemResponse, paginatedResponse } from '@api/utils/openapi/responses';

export const COURSE_MEMBER_RULE =
  'the key creator must be a course member (directly or through a program) or an org admin';
export const COURSE_TEAM_RULE = 'the key creator must be a course tutor/admin or an org admin';
export const ANY_KEY_RULE = 'any key with the public_api:* scope may call it';
export const ORG_TEAM_RULE = 'the key creator must be an org admin or tutor';

const ROLE_CHECKED_NOTE = "The key creator's role is checked on every call, so losing access ends it for the key too.";

const MEMBER_FORBIDDEN =
  'the automation actor is not a course member (directly or through a program) or org admin, or program access would exceed the Free plan student limit';
const TEAM_FORBIDDEN = 'the automation actor is not a course tutor/admin or org admin';

const COMMENTS_OFF = 'comments are turned off for the organization, course or lesson (COMMENTS_DISABLED)';

const forbidden = (scope: string, actorRule: string) => ({
  description: `The key has neither the public_api:* nor the ${scope} scope, or ${actorRule}. ${ROLE_CHECKED_NOTE}`
});

export const courseForbiddenResponses = {
  member: forbidden('course:certificate:read', MEMBER_FORBIDDEN),
  team: forbidden('course:certificate:read', TEAM_FORBIDDEN),
  teamWrite: forbidden(
    'course:certificate:write',
    `${TEAM_FORBIDDEN}, or the organization is on the Basic (free) plan, where certificates are locked (UPGRADE_REQUIRED)`
  )
};

export const contentForbiddenResponses = {
  read: forbidden('course:read', TEAM_FORBIDDEN),
  write: forbidden('course:write', TEAM_FORBIDDEN),
  comments: forbidden('course:read', `${TEAM_FORBIDDEN}, or ${COMMENTS_OFF}`),
  commentWrite: forbidden('course:write', `${TEAM_FORBIDDEN}, or ${COMMENTS_OFF}`),
  commentEdit: forbidden(
    'course:write',
    `${TEAM_FORBIDDEN}, ${COMMENTS_OFF}, or the actor may not change this comment (only its author can edit it)`
  ),
  commentDelete: forbidden(
    'course:write',
    `${TEAM_FORBIDDEN}, or ${COMMENTS_OFF}. The comment's author, a course tutor/admin or an org admin may delete it`
  )
};

export const cloneForbiddenResponse = forbidden(
  'course:write',
  'the automation actor is not an org admin or tutor, or the course is a template (copy templates with Use template)'
);

export const exerciseForbiddenResponses = {
  read: forbidden('course:exercise:read', TEAM_FORBIDDEN),
  write: forbidden('course:exercise:write', TEAM_FORBIDDEN),
  writeWithPlan: forbidden(
    'course:exercise:write',
    `${TEAM_FORBIDDEN}, or a premium question type is used on the Basic plan (UPGRADE_REQUIRED)`
  )
};

export const submissionForbiddenResponses = {
  read: forbidden('course:submission:read', TEAM_FORBIDDEN),
  write: forbidden('course:submission:write', TEAM_FORBIDDEN),
  marks: forbidden('course:submission:read', MEMBER_FORBIDDEN)
};

export const studentForbiddenResponse = forbidden(
  'course:student:write',
  `${TEAM_FORBIDDEN}, or the content is still locked for the student`
);

export const mcpRateLimitResponse = {
  description: 'MCP keys only: the per-key or per-organization MCP rate limit was hit'
};

export const forbiddenResponse = {
  description: `The key lacks the public_api:* or course:member:read/write scope, or the automation actor is not a course tutor/admin or org admin. ${ROLE_CHECKED_NOTE}`
};

export const CertificateSettingsResponse = itemResponse(ZPublicApiCertificateSettingsResponse);

export const IssuedCertificatesResponse = paginatedResponse(ZPublicApiIssuedCertificateListItemResponse);

export const CertificateFileResponse = {
  description: 'The certificate file',
  content: {
    'application/pdf': { schema: { type: 'string' as const, format: 'binary' } },
    'image/png': { schema: { type: 'string' as const, format: 'binary' } }
  }
};

export const LIVE_EDIT_NOTE =
  'Changes apply immediately, also on published courses. Submissions already made are not regraded, and students submit against the current questions.';

export const studentWorkConflictResponse = {
  description: 'Students have submissions or lesson completions here; pass force=true to delete them too'
};
