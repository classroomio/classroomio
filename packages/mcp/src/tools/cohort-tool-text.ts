import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type * as z from 'zod';

export const COHORT_MEMBER_RULE = 'the API key creator must be a cohort member or an org admin';
export const COHORT_TEAM_RULE = 'the API key creator must be a cohort tutor/admin or an org admin';

export const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
export const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
export const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

/** Adds detail the API docs keep on the endpoint page, so agents see it on the field. */
export function withNotes<T extends z.ZodType>(schema: T, notes: readonly string[]): T {
  const description = [schema.description, ...notes].filter(Boolean).join(' ');

  return schema.describe(description);
}

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
