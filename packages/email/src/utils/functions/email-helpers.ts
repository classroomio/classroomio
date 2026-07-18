import { FromData } from '../types';
import { EMAIL_FROM } from '../constants';

const EMAIL_HEADER_CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

function stripEmailHeaderControlChars(value: string): string {
  return value.replace(EMAIL_HEADER_CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
}

/** Strip control chars and backslash-escape quotes for RFC 5322 quoted display names. */
export function sanitizeEmailDisplayName(name: string): string {
  const normalized = stripEmailHeaderControlChars(name);
  if (!normalized) {
    return '';
  }

  return normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Strip control chars that could break or inject email headers. */
export function sanitizeEmailSubject(subject: string): string {
  return stripEmailHeaderControlChars(subject);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// format: "ClassroomIO Developers (via ClassroomIO.com)" <notify@mail.classroomio.com>
export function extractNameAndEmail(str: string): FromData | undefined {
  // Use regular expressions to match the name and email
  const regex = /"(.*?)"\s+<\s*(.*?)@(.*?)\s*>/;
  const match = str.match(regex);

  if (match) {
    // Extract the name and email from the match groups
    const name = match[1];
    const email = match[2] + '@' + match[3];
    return { name, email };
  } else {
    // Return undefined if the format doesn't match
    return { name: str, email: str };
  }
}

export function buildEmailFromName(name?: string): string {
  if (!name) {
    return EMAIL_FROM;
  }

  const fromData = extractNameAndEmail(EMAIL_FROM);
  if (!fromData?.email) {
    return EMAIL_FROM;
  }

  const displayName = sanitizeEmailDisplayName(name);
  if (!displayName) {
    return EMAIL_FROM;
  }

  return `"${displayName}" <${fromData.email}>`;
}
