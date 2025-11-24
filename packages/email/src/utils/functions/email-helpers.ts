import { FromData } from '../types';

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
