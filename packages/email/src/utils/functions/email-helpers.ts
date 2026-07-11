import { FromData } from '../types';
import { EMAIL_FROM } from '../constants';

/** Strip control chars and backslash-escape quotes for RFC 5322 quoted display names. */
export function sanitizeEmailDisplayName(name: string): string {
  return name
    .replace(/[\r\n\u0000]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .trim();
}

/** Strip control chars that could break or inject email headers. */
export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n\u0000]/g, ' ').trim();
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
