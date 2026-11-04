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

const MEMBER_FORBIDDEN =
  'the key creator is not a course member or org admin, or the Free plan student limit is reached';
const TEAM_FORBIDDEN = 'the key creator is not a course tutor/admin or org admin';

const COMMENTS_OFF = 'comments are off (COMMENTS_DISABLED)';

const forbidden = (scope: string, actorRule: string) => ({
  description: `Missing the ${scope} scope, or ${actorRule}`
});

export const courseForbiddenResponses = {
  member: forbidden('course:certificate:read', MEMBER_FORBIDDEN),
  team: forbidden('course:certificate:read', TEAM_FORBIDDEN),
  teamWrite: forbidden(
    'course:certificate:write',
    `${TEAM_FORBIDDEN}, or the plan has no certificates (UPGRADE_REQUIRED)`
  )
};

export const contentForbiddenResponses = {
  read: forbidden('course:read', TEAM_FORBIDDEN),
  write: forbidden('course:write', TEAM_FORBIDDEN),
  comments: forbidden('course:read', `${TEAM_FORBIDDEN}, or ${COMMENTS_OFF}`),
  commentWrite: forbidden('course:write', `${TEAM_FORBIDDEN}, or ${COMMENTS_OFF}`),
  commentEdit: forbidden(
    'course:write',
    `${COMMENTS_OFF}, or the key creator is not a course tutor/admin or org admin who wrote the comment`
  ),
  commentDelete: forbidden(
    'course:write',
    `the key creator is not the comment's author, a course tutor/admin or an org admin, or ${COMMENTS_OFF}`
  )
};

export const cloneForbiddenResponse = forbidden(
  'course:write',
  'the key creator is not an org admin or tutor, or the course is a template'
);

export const exerciseForbiddenResponses = {
  read: forbidden('course:exercise:read', TEAM_FORBIDDEN),
  write: forbidden('course:exercise:write', TEAM_FORBIDDEN),
  writeWithPlan: forbidden(
    'course:exercise:write',
    `${TEAM_FORBIDDEN}, or a question type needs a paid plan (UPGRADE_REQUIRED)`
  )
};

export const submissionForbiddenResponses = {
  read: forbidden('course:submission:read', TEAM_FORBIDDEN),
  write: forbidden('course:submission:write', TEAM_FORBIDDEN),
  marks: forbidden('course:submission:read', MEMBER_FORBIDDEN)
};

export const studentForbiddenResponse = forbidden(
  'course:student:write',
  `${TEAM_FORBIDDEN}, or the content is locked for the student`
);

export const mcpRateLimitResponse = {
  description: 'MCP keys only: the per-key or per-organization MCP rate limit was hit'
};

export const forbiddenResponse = {
  description: `Missing the course:member:read/write scope, or ${TEAM_FORBIDDEN}`
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

export const LIVE_EDIT_NOTE = 'Applies immediately, even on published courses; past submissions are not regraded.';

export const studentWorkConflictResponse = {
  description: 'Students have submissions or lesson completions here; pass force=true to delete them too'
};
