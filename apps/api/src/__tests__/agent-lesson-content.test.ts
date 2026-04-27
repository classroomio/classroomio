import { describe, expect, it } from 'vitest';
import { normalizeAgentLessonContent } from '../services/agent/lesson-content';

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
});
