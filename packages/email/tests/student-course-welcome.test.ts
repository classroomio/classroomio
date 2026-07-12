import { describe, expect, it } from 'vitest';

import { studentCourseWelcomeEmail } from '../src/emails/student-course-welcome';

describe('studentCourseWelcomeEmail', () => {
  it('includes the course name in the subject', () => {
    const resolveSubject = studentCourseWelcomeEmail.template.subject;

    expect(typeof resolveSubject).toBe('function');
    expect((resolveSubject as (fields: { courseName: string }) => string)({ courseName: 'React Basics' })).toBe(
      'You have access to React Basics course'
    );
  });
});
