import { describe, expect, it } from 'vitest';

import { isSafeStudentHomePath } from './student-home';

describe('isSafeStudentHomePath', () => {
  it('accepts registry and course destinations', () => {
    for (const path of [
      '/lms',
      '/lms/',
      '/lms/mylearning',
      '/lms/community/ask',
      '/lms/settings/notifications',
      '/courses/abc/lessons?next=true',
      '/course/some-slug',
      '/course/some-slug/enroll?from=student-home'
    ]) {
      expect(isSafeStudentHomePath(path)).toBe(true);
    }
  });

  it('rejects off-origin, self and non-portal paths', () => {
    for (const path of [
      '',
      '/',
      '//lms',
      '///',
      'https://evil.example/lms',
      'http://localhost:3000/lms',
      'javascript:alert(1)',
      '/login',
      '/lmsx',
      '/org/acme',
      '/join-academy',
      '/coursesx/abc'
    ]) {
      expect(isSafeStudentHomePath(path)).toBe(false);
    }
  });
});
