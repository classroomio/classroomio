import { ItemResponse, PaginatedListResponse } from '@api/utils/openapi/responses';

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
  teamWrite: forbidden('course:certificate:write', TEAM_FORBIDDEN)
};

export const mcpRateLimitedResponse = {
  description: 'MCP key only: the automation rate limit for this tool was exceeded'
};

const SignatorySchema = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const, maxLength: 80 },
    role: { type: 'string' as const, maxLength: 80 },
    enabled: { type: 'boolean' as const },
    signatureUrl: { type: 'string' as const, format: 'uri' }
  },
  required: ['name', 'role', 'enabled']
};

export const CertificateSettingsResponse = {
  ...ItemResponse,
  properties: {
    ...ItemResponse.properties,
    data: {
      type: 'object' as const,
      properties: {
        isDownloadable: { type: 'boolean' as const, default: false },
        theme: { type: 'string' as const },
        design: {
          type: 'object' as const,
          properties: {
            templateId: {
              type: 'string' as const,
              enum: ['classique', 'brutalist', 'noir', 'poster', 'minimal']
            },
            accentColor: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$' },
            subtitle: { type: 'string' as const },
            descriptionOverride: { type: 'string' as const },
            signatories: { type: 'array' as const, items: SignatorySchema, minItems: 2, maxItems: 2 },
            idFormat: { type: 'string' as const }
          },
          required: ['templateId', 'accentColor', 'signatories']
        },
        deadline: { type: 'string' as const, format: 'date-time', nullable: true },
        threshold: { type: 'number' as const, default: 100 },
        requiredExerciseId: { type: 'string' as const, format: 'uuid', nullable: true },
        exerciseMinScorePercent: { type: 'number' as const, nullable: true },
        emailMessage: { type: 'string' as const, nullable: true }
      },
      required: [
        'isDownloadable',
        'theme',
        'design',
        'deadline',
        'threshold',
        'requiredExerciseId',
        'exerciseMinScorePercent',
        'emailMessage'
      ]
    }
  }
};

export const IssuedCertificatesResponse = {
  ...PaginatedListResponse,
  properties: {
    ...PaginatedListResponse.properties,
    data: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          memberId: { type: 'string' as const },
          profileId: { type: 'string' as const, nullable: true },
          fullname: { type: 'string' as const, nullable: true },
          email: { type: 'string' as const, nullable: true },
          certificateEarnedAt: { type: 'string' as const },
          certificationEmailSentAt: { type: 'string' as const, nullable: true }
        },
        required: ['memberId', 'profileId', 'fullname', 'email', 'certificateEarnedAt', 'certificationEmailSentAt']
      }
    }
  }
};

export const CertificateFileResponse = {
  description: 'The certificate file',
  content: {
    'application/pdf': { schema: { type: 'string' as const, format: 'binary' } },
    'image/png': { schema: { type: 'string' as const, format: 'binary' } }
  }
};
