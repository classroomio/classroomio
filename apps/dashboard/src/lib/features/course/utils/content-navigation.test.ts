import { isContentItemInPath } from './content-navigation';

describe('isContentItemInPath', () => {
  it('returns false when the current path is missing', () => {
    expect(isContentItemInPath('lesson-1', undefined)).toBe(false);
    expect(isContentItemInPath('lesson-1', null)).toBe(false);
    expect(isContentItemInPath('lesson-1', '')).toBe(false);
  });

  it('matches content ids as exact pathname segments', () => {
    expect(isContentItemInPath('lesson-1', '/courses/abc/lessons/lesson-1')).toBe(true);
    expect(isContentItemInPath('lesson-1', '/courses/abc/lessons/lesson-10')).toBe(false);
  });
});

describe('isContentItemInPath', () => {
  it('returns false when the current path is missing', () => {
    expect(isContentItemInPath('lesson-1', undefined)).toBe(false);
    expect(isContentItemInPath('lesson-1', null)).toBe(false);
    expect(isContentItemInPath('lesson-1', '')).toBe(false);
  });

  it('matches content ids as exact pathname segments', () => {
    expect(isContentItemInPath('lesson-1', '/courses/abc/lessons/lesson-1')).toBe(true);
    expect(isContentItemInPath('lesson-1', '/courses/abc/lessons/lesson-10')).toBe(false);
  });
});
