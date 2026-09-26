import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

export const COHORT_MEMBER_RULE = 'The API key creator must be a member of the cohort or an org admin, otherwise 403.';
export const COHORT_TEAM_RULE = 'The API key creator must be a cohort tutor/admin or an org admin, otherwise 403.';
export const PAGINATED = 'Paginated: page (default 1) and limit (default 20, max 100); the result includes pagination.';

export const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
export const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
export const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

export function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
