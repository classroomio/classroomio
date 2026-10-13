import {
  ZPublicApiCertificateSettingsResponse,
  ZPublicApiIssuedCertificateListItemResponse
} from '@cio/utils/validation/public-api';
import { itemResponse, paginatedResponse } from '@api/utils/openapi/responses';

export const COURSE_MEMBER_RULE =
  'the key creator must be a course member (directly or through a program) or an org admin';
export const COURSE_TEAM_RULE = 'the key creator must be a course tutor/admin or an org admin';
export const ANY_KEY_RULE = 'any key with the public_api:* scope may call it';

const ROLE_CHECKED_NOTE = "The key creator's role is checked on every call, so losing access ends it for the key too.";

const MEMBER_FORBIDDEN =
  'the automation actor is not a course member (directly or through a program) or org admin, or program access would exceed the Free plan student limit';
const TEAM_FORBIDDEN = 'the automation actor is not a course tutor/admin or org admin';

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
