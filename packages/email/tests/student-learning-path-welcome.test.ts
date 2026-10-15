import { describe, expect, it } from 'vitest';

import { studentLearningPathWelcomeEmail } from '../src/emails/student-learning-path-welcome';

describe('studentLearningPathWelcomeEmail', () => {
  it('includes the learning path name in the subject', () => {
    const resolveSubject = studentLearningPathWelcomeEmail.template.subject;

    expect(typeof resolveSubject).toBe('function');
    expect(
      (resolveSubject as (fields: { learningPathName: string }) => string)({
        learningPathName: 'Fullstack Web Development'
      })
    ).toBe('You have access to Fullstack Web Development learning path');
  });

  it('renders custom message when provided', () => {
    const render = studentLearningPathWelcomeEmail.template.render;
    const output = render({
      orgName: 'Acme Academy',
      learningPathName: 'Fullstack Web Development',
      loginUrl: 'https://acme.classroomio.com/lms',
      customMessage: '<p>Welcome cohort 2026!</p>',
      branding: { logoUrl: null, themeColor: null }
    });

    expect(output).toContain('Welcome cohort 2026!');
  });
});
