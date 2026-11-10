import type { ZObject } from 'zapier-platform-core';

import { apiUrl } from './config';

export type AudienceMember = { id: number; profileId: string | null; name: string; email: string };

export const STUDENT_SAMPLE = {
  id: 1042,
  profileId: '000000b1-0000-4000-8000-0000000000b1',
  name: 'Alex Johnson',
  email: 'student@example.com'
};

export const STUDENT_OUTPUT_FIELDS: Array<{ key: string; label: string; type?: 'integer' }> = [
  { key: 'id', label: 'Audience ID', type: 'integer' },
  { key: 'profileId', label: 'Profile ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' }
];

export async function findStudentByEmail(z: ZObject, email: string): Promise<AudienceMember | null> {
  const response = await z.request({ url: apiUrl('/audience'), params: { email: email.trim() } });
  const members = response.data.data as AudienceMember[];

  return members[0] ?? null;
}

export async function requireStudentByEmail(z: ZObject, email: string): Promise<AudienceMember> {
  const member = await findStudentByEmail(z, email);

  if (!member) {
    throw new z.errors.Error(`No student in your organization has the email ${email}`, 'NotFound', 404);
  }

  return member;
}

export const STUDENT_ROLE_ID = 3;

export async function requireCourseMemberId(z: ZObject, courseId: string, email: string): Promise<string> {
  const response = await z.request({ url: apiUrl(`/courses/${courseId}/members`), params: { email } });
  const [member] = response.data.data as Array<{ id: string; roleId: number }>;

  if (!member) {
    throw new z.errors.Error(`${email} is not enrolled in this course`, 'NotFound', 404);
  }

  if (member.roleId !== STUDENT_ROLE_ID) {
    throw new z.errors.Error(
      `${email} is an admin or tutor in this course. This action only changes students.`,
      'InvalidInput',
      400
    );
  }

  return member.id;
}
