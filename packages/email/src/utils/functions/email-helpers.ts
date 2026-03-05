import { FromData } from '../types';
import { EMAIL_FROM } from '../constants';

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

  return `"${name}" <${fromData.email}>`;
}
