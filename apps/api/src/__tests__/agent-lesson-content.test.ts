import { describe, expect, it } from 'vitest';
import { normalizeAgentLessonContent } from '@cio/core/services/agent/lesson-content';

describe('normalizeAgentLessonContent', () => {
  it('removes a leading heading that duplicates the lesson title', () => {
    const normalized = normalizeAgentLessonContent(
      '<h3>Introduction to Functions</h3><p>Functions map inputs to outputs.</p>',
      'Introduction to Functions'
    );

    expect(normalized).toBe('<p>Functions map inputs to outputs.</p>');
  });

  it('removes a leading bold paragraph that duplicates the lesson title', () => {
    const normalized = normalizeAgentLessonContent(
      '<p><strong>Introduction to Functions</strong></p><p>Functions map inputs to outputs.</p>',
      'Introduction to Functions'
    );

    expect(normalized).toBe('<p>Functions map inputs to outputs.</p>');
  });

  it('rewrites h1 and h2 tags to h3', () => {
    const normalized = normalizeAgentLessonContent(
      '<h1>Overview</h1><h2>Key Ideas</h2><p>Body</p>',
      'Different Lesson Title'
    );

    expect(normalized).toBe('<h3>Overview</h3><h3>Key Ideas</h3><p>Body</p>');
  });

  it('expands a bare callout into the full callout markup', () => {
    const normalized = normalizeAgentLessonContent(
      '<p>Intro</p><div data-callout="tip"><p>Save often.</p></div>',
      'Different Lesson Title'
    );

    expect(normalized).toBe(
      '<p>Intro</p><div data-callout="tip" class="cio-callout"><div class="cio-callout-mark" aria-hidden="true" contenteditable="false"></div><div class="cio-callout-body"><p>Save often.</p></div></div>'
    );
  });

  it('leaves an existing full callout unchanged', () => {
    const callout =
      '<div data-callout="warning" class="cio-callout"><div class="cio-callout-mark" aria-hidden="true" contenteditable="false"></div><div class="cio-callout-body"><p>Keep refunds.</p></div></div>';

    expect(normalizeAgentLessonContent(callout, 'Different Lesson Title')).toBe(callout);
  });
});
