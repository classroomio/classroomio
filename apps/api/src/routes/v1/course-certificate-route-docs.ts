import { ItemResponse, PaginatedListResponse } from '@api/utils/openapi/responses';

export const COURSE_MEMBER_RULE =
  'The automation actor (the key creator) must be a member of the course (including access through a program) or an org admin, or this fails with 403.';
export const COURSE_TEAM_RULE =
  'The automation actor (the key creator) must be a course tutor/admin or an org admin, or this fails with 403.';
export const PAGINATION_NOTE = 'Paginated with page (default 1) and limit (default 20, max 100).';

export const courseForbiddenResponses = {
  member: {
    description:
      'The key lacks the public_api:* scope, the automation actor is not a course member (directly or through a program) or org admin, or program access would exceed the Free plan student limit'
  },
  team: {
    description:
      'The key lacks the public_api:* scope, or the automation actor is not a course tutor/admin or org admin'
  }
};

export const mcpRateLimitedResponse = {
  description: 'MCP key only: the automation rate limit for this tool was exceeded'
};

export const CertificateSettingsResponse = {
  ...ItemResponse,
  properties: {
    ...ItemResponse.properties,
    data: {
      type: 'object' as const,
      properties: {
        isDownloadable: { type: 'boolean' as const },
        theme: { type: 'string' as const },
        design: {
          type: 'object' as const,
          properties: {
            templateId: {
              type: 'string' as const,
              enum: ['classique', 'brutalist', 'noir', 'poster', 'minimal']
            },
            accentColor: { type: 'string' as const },
            subtitle: { type: 'string' as const },
            descriptionOverride: { type: 'string' as const },
            signatories: { type: 'array' as const, items: { type: 'object' as const } },
            idFormat: { type: 'string' as const }
          }
        },
        deadline: { type: 'string' as const, nullable: true },
        threshold: { type: 'number' as const },
        requiredExerciseId: { type: 'string' as const, nullable: true },
        exerciseMinScorePercent: { type: 'number' as const, nullable: true },
        emailMessage: { type: 'string' as const, nullable: true }
      }
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
