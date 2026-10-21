import { describe, expect, it } from 'vitest';

import { studentCourseWelcomeEmail } from '../src/emails/student-course-welcome';

describe('studentCourseWelcomeEmail', () => {
  it('includes the course name in the subject', () => {
    const resolveSubject = studentCourseWelcomeEmail.template.subject;

    expect(typeof resolveSubject).toBe('function');
    expect((resolveSubject as (fields: { courseName: string }) => string)({ courseName: 'React Basics' })).toBe(
      'You have access to React Basics'
    );
  });

  it('uses a localized custom subject and fills its dynamic values', () => {
    const resolveSubject = studentCourseWelcomeEmail.template.subject;

    expect(typeof resolveSubject).toBe('function');
    expect(
      (resolveSubject as (fields: { courseName: string }, context: { subjectOverride: string }) => string)(
        { courseName: 'React Basics' },
        { subjectOverride: 'Bienvenue dans {{course_name}}' }
      )
    ).toBe('Bienvenue dans React Basics');
  });

  it('sends the course welcome message in place of the default body', () => {
    const rendered = studentCourseWelcomeEmail.template.render(
      {
        orgName: 'Academy',
        courseName: 'React Basics',
        loginUrl: 'https://example.com/course',
        customMessage: '<p>Welcome from your instructor.</p>',
        branding: {}
      },
      { locale: 'fr' }
    );

    expect(rendered).toContain('<html lang="fr">');
    expect(rendered).toContain('<p>Welcome from your instructor.</p>');
    expect(rendered).not.toContain('Vous avez maintenant accès à');
    expect(rendered).toContain('Ouvrir le cours');
  });

  it('sends the default body when the course has no welcome message', () => {
    const rendered = studentCourseWelcomeEmail.template.render(
      { orgName: 'Academy', courseName: 'React Basics', loginUrl: 'https://example.com/course', branding: {} },
      { locale: 'fr' }
    );

    expect(rendered).toContain('Vous avez maintenant accès à');
  });

  it('resolves dynamic action links in organization overrides', () => {
    const rendered = studentCourseWelcomeEmail.template.render(
      {
        orgName: 'Academy',
        courseName: 'React Basics',
        loginUrl: 'https://example.com/course',
        branding: {}
      },
      {
        locale: 'fr',
        contentOverride: '<p>Continue learning.</p><a href="{{action_url}}">Open course</a>'
      }
    );

    expect(rendered).toContain('href="https://example.com/course"');
    expect(rendered).not.toContain('{{action_url}}');
  });
});
