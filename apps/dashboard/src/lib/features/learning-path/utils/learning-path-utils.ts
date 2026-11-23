import { z } from 'zod';
import type { LearningPathStatus } from './types';

/** Postgres timestamp strings (`2026-11-16 07:31:06.55+00`) as a Date every browser parses. */
export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;

  const isoLike = value.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const date = new Date(isoLike);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined): string {
  const date = parseTimestamp(value);

  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date) : '';
}

export const LEARNING_PATH_STATUS_KEYS: Record<LearningPathStatus, string> = {
  ACTIVE: 'learning_paths.status.active',
  DRAFT: 'learning_paths.status.draft',
  ARCHIVED: 'learning_paths.status.archived'
};

const ZEmail = z.string().email();

export function findInvalidEmails(emails: string[]): string[] {
  return emails.filter((email) => !ZEmail.safeParse(email).success);
}

export function splitEmails(value: string): string[] {
  const emails = value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(emails)];
}
