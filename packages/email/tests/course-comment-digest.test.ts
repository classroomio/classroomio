import { describe, expect, it } from 'vitest';

import { courseCommentDigestEmail } from '../src/emails/course-comment-digest';

const baseFields = {
  courseTitle: 'Pricing 101',
  locationLabel: 'Lesson 2: Anchoring',
  items: [
    { actorName: 'Ada Admin', action: 'mentioned' as const, snippet: 'Can you check this?' },
    { actorName: 'Tom Tutor', action: 'resolved' as const, snippet: null }
  ],
  moreCount: 0,
  threadUrl: 'https://app.example.com/courses/c1/lessons/l1?thread=t1',
  branding: {}
};

const { render, subject, schema } = courseCommentDigestEmail.template;

describe('courseCommentDigestEmail', () => {
  it('names the course, the page, each update and links to the thread', () => {
    const rendered = render(baseFields);

    expect(rendered).toContain('<strong>Pricing 101</strong>');
    expect(rendered).toContain('in <strong>Lesson 2: Anchoring</strong>');
    expect(rendered).toContain('<strong>Ada Admin</strong> mentioned you');
    expect(rendered).toContain('Can you check this?');
    expect(rendered).toContain('<strong>Tom Tutor</strong> resolved the thread');
    expect(rendered).toContain('href="https://app.example.com/courses/c1/lessons/l1?thread=t1"');
    expect(rendered).not.toContain('more update');
  });

  it('counts the updates left out of the email', () => {
    expect(render({ ...baseFields, moreCount: 1 })).toContain('And 1 more update.');
    expect(render({ ...baseFields, moreCount: 3 })).toContain('And 3 more updates.');
  });

  it('escapes names, titles and comment text', () => {
    const rendered = render({
      ...baseFields,
      courseTitle: '<b>Course</b>',
      locationLabel: null,
      items: [{ actorName: '<img src=x>', action: 'replied' as const, snippet: '<script>alert(1)</script>' }]
    });

    expect(rendered).toContain('&lt;b&gt;Course&lt;/b&gt;');
    expect(rendered).toContain('&lt;img src=x&gt;');
    expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(rendered).not.toContain('<script>');
    expect(rendered).not.toContain(' in <strong>');
  });

  it('uses the course title in the subject and needs at least one update', () => {
    expect(typeof subject === 'function' ? subject(baseFields, {} as never) : subject).toBe(
      'New comments on Pricing 101'
    );
    expect(schema.safeParse({ ...baseFields, items: [] }).success).toBe(false);
  });
});
