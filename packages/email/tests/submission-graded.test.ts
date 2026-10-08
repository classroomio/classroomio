import { describe, expect, it } from 'vitest';

import { submissionGradedEmail } from '../src/emails/submission-graded';

const baseFields = {
  orgName: 'Academy',
  studentName: 'Alex Student',
  exerciseTitle: 'Arrays',
  courseName: 'JavaScript Basics',
  statusId: 3,
  exerciseLink: 'https://example.com/exercise',
  branding: {}
};

describe('submissionGradedEmail', () => {
  it('labels the score and exercise context and uses the result CTA when scored', () => {
    const rendered = submissionGradedEmail.template.render(
      { ...baseFields, score: '8/10', lessonTitle: 'Looping' },
      { locale: 'en' }
    );

    expect(rendered).toContain('Your score:');
    expect(rendered).toContain('This exercise is part of the lesson <strong>Looping</strong>.');
    expect(rendered).toContain('View your result');
    expect(rendered).not.toContain('Open exercise');
  });

  it('omits missing score and lesson paragraphs and uses the exercise CTA', () => {
    const rendered = submissionGradedEmail.template.render(baseFields, { locale: 'en' });

    expect(rendered).not.toContain('Your score:');
    expect(rendered).not.toContain('This exercise is part of the lesson');
    expect(rendered).toContain('in <strong>JavaScript Basics</strong> is now');
    expect(rendered).toContain('Open exercise');
    expect(rendered).not.toContain('View your result');
  });

  it('omits a missing score paragraph that the admin aligned or styled', () => {
    const rendered = submissionGradedEmail.template.render(baseFields, {
      locale: 'en',
      contentOverride: '<p>Hi {{student_name}}</p><p style="text-align: center">Score: {{score}}</p>'
    });

    expect(rendered).toContain('Hi Alex Student');
    expect(rendered).not.toContain('Score:');
  });

  it('escapes score and lesson values as plain text', () => {
    const rendered = submissionGradedEmail.template.render(
      { ...baseFields, score: '<b>8/10</b>', lessonTitle: '<script>alert(1)</script>' },
      { locale: 'en' }
    );

    expect(rendered).toContain('&lt;b&gt;8/10&lt;/b&gt;');
    expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(rendered).not.toContain('<script>alert(1)</script>');
  });
});
