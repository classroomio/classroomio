import { describe, expect, it } from 'vitest';

import {
  formatIdParam,
  matchesBoardFilters,
  mergeColumnItems,
  parseIdParam,
  sameIdSelection
} from './submission-board-filters';

type BoardItem = {
  id: string;
  studentId: string;
  exerciseId: string;
};

function isVisible(item: BoardItem, studentIds: string[], exerciseIds: string[]) {
  return matchesBoardFilters(item, new Set(studentIds), new Set(exerciseIds));
}

describe('matchesBoardFilters', () => {
  const item = { studentId: 'student-1', exerciseId: 'exercise-1' };

  it('keeps every item when both filters are empty', () => {
    expect(matchesBoardFilters(item, new Set(), new Set())).toBe(true);
  });

  it('filters by one dimension when the other is empty', () => {
    expect(matchesBoardFilters(item, new Set(['student-1']), new Set())).toBe(true);
    expect(matchesBoardFilters(item, new Set(), new Set(['exercise-2', 'exercise-1']))).toBe(true);
    expect(matchesBoardFilters(item, new Set(['student-9']), new Set())).toBe(false);
  });

  it('requires both a selected student and a selected exercise', () => {
    expect(matchesBoardFilters(item, new Set(['student-1']), new Set(['exercise-1', 'exercise-2']))).toBe(true);
    expect(matchesBoardFilters(item, new Set(['student-2']), new Set(['exercise-1']))).toBe(false);
    expect(matchesBoardFilters(item, new Set(['student-1']), new Set(['exercise-9']))).toBe(false);
  });
});

describe('id params', () => {
  it('parses a comma list and ignores blank segments', () => {
    expect(parseIdParam(' student-1, ,student-2 ')).toEqual(['student-1', 'student-2']);
    expect(parseIdParam(null)).toEqual([]);
  });

  it('treats selection order as irrelevant', () => {
    expect(sameIdSelection(['student-2', 'student-1'], 'student-1,student-2')).toBe(true);
    expect(sameIdSelection(['student-1'], 'student-1,student-2')).toBe(false);
  });

  it('writes ids in sorted order', () => {
    expect(formatIdParam(['b', 'a'])).toBe('a,b');
  });
});

describe('mergeColumnItems', () => {
  const items: BoardItem[] = [
    { id: 'a', studentId: 'student-1', exerciseId: 'exercise-1' },
    { id: 'hidden', studentId: 'student-2', exerciseId: 'exercise-1' },
    { id: 'b', studentId: 'student-1', exerciseId: 'exercise-2' }
  ];
  const visible = (item: BoardItem) => isVisible(item, ['student-1'], []);

  it('reorders visible cards and leaves hidden cards in place', () => {
    const nextVisible = [items[2], items[0]];
    expect(mergeColumnItems(items, nextVisible, visible).map((item) => item.id)).toEqual(['b', 'hidden', 'a']);
  });

  it('drops a visible card that left the column and appends an arrival', () => {
    const arrival: BoardItem = { id: 'c', studentId: 'student-1', exerciseId: 'exercise-3' };
    const nextVisible = [items[0], arrival];
    expect(mergeColumnItems(items, nextVisible, visible).map((item) => item.id)).toEqual(['a', 'hidden', 'c']);
  });
});
