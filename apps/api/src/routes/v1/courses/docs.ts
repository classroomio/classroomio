import {
  ZPublicApiCertificateSettingsResponse,
  ZPublicApiIssuedCertificateListItemResponse
} from '@cio/utils/validation/public-api';
import { itemResponse, paginatedResponse } from '@api/utils/openapi/responses';

export const COURSE_MEMBER_RULE =
  'The automation actor (the key creator) must be a member of the course (including access through a program) or an org admin, or this fails with 403. The role is checked on every call, so a creator who loses access loses it for the key too.';
export const COURSE_TEAM_RULE =
  'The automation actor (the key creator) must be a course tutor/admin or an org admin, or this fails with 403. The role is checked on every call, so a creator who loses access loses it for the key too.';
export const PAGINATION_NOTE = 'Paginated with page (default 1) and limit (default 20, max 100).';

export const EFFECTIVE_SETTINGS_NOTE =
  'Returns effective settings: stored values, with defaults filled in where nothing is stored (isDownloadable false, threshold 100, deadline/requiredExerciseId/emailMessage null, exerciseMinScorePercent 100 (or the compliance passing score) when a required exercise is set and null otherwise, and the default design). theme falls back to design.templateId.';

export const CERTIFICATE_UPDATE_DESCRIPTION = [
  "Partially update a course's certificate settings and design (idempotent: sending the same body twice gives the same result).",
  'Omitted fields keep their stored values.',
  'Send null to clear deadline, requiredExerciseId, exerciseMinScorePercent, or emailMessage.',
  'design is not merged: it replaces the whole stored design, so read it first and send the full object.',
  'Sending design without theme sets theme to design.templateId, as the dashboard editor does.',
  'deadline must be an ISO 8601 datetime with a timezone (for example 2026-12-31T23:59:59Z).',
  'Certificates need a paid plan: on the Basic (free) plan this fails with 403 UPGRADE_REQUIRED, as the dashboard locks these settings.',
  EFFECTIVE_SETTINGS_NOTE
].join(' ');

export const CERTIFICATE_DOWNLOAD_DESCRIPTION =
  "Download the certificate a student earned, rendered with the course's current design, as a PDF (format=pdf, default) or PNG (format=png). memberId comes from the issued certificates list. This works whether or not isDownloadable is on, because isDownloadable only controls learner downloads.";

const MEMBER_FORBIDDEN =
  'the automation actor is not a course member (directly or through a program) or org admin, or program access would exceed the Free plan student limit';
const TEAM_FORBIDDEN = 'the automation actor is not a course tutor/admin or org admin';

const forbidden = (scope: string, actorRule: string) => ({
  description: `The key has neither the public_api:* nor the ${scope} scope, or ${actorRule}`
});

export const courseForbiddenResponses = {
  member: forbidden('course:certificate:read', MEMBER_FORBIDDEN),
  team: forbidden('course:certificate:read', TEAM_FORBIDDEN),
  teamWrite: forbidden(
    'course:certificate:write',
    `${TEAM_FORBIDDEN}, or the organization is on the Basic plan (UPGRADE_REQUIRED)`
  )
};

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
  description:
    'The key lacks the public_api:* or course:member:read/write scope, or the automation actor is not a course tutor/admin or org admin'
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

export const QUESTION_TYPES_NOTE =
  'questionTypeId: 1 single choice, 2 multiple choice, 3 paragraph, 4 true/false, 5 short answer, 6 numeric, 7 fill in the blank, 8 file upload, 9 ordering, 10 link, 11 word bank, 12 star rating, 13 video recording, 14 thumbs up/down. File upload, ordering, link, star rating and video recording need a paid plan (403 UPGRADE_REQUIRED on Basic). PUBLIC courses only accept auto-graded types.';

export const LIVE_EDIT_NOTE =
  'Changes apply immediately, also on published courses. Submissions already made are not regraded, and students submit against the current questions.';
