import { describe, expect, it } from 'vitest';

import { isAssignmentOpenToStudents } from '../src/functions/assignment-availability';

const open = {
  courseStatus: 'ACTIVE',
  courseIsPublished: true,
  exerciseIsUnlocked: true,
  lessonIsUnlocked: true
};

describe('isAssignmentOpenToStudents', () => {
  it('is open when the course is published and the exercise and its lesson are unlocked', () => {
    expect(isAssignmentOpenToStudents(open)).toBe(true);
  });

  it('is open for an exercise at the course root', () => {
    expect(isAssignmentOpenToStudents({ ...open, lessonIsUnlocked: null })).toBe(true);
  });

  it('is closed in a draft or deleted course', () => {
    expect(isAssignmentOpenToStudents({ ...open, courseIsPublished: false })).toBe(false);
    expect(isAssignmentOpenToStudents({ ...open, courseStatus: 'DELETED' })).toBe(false);
  });

  it('is closed while the exercise or its lesson is locked', () => {
    expect(isAssignmentOpenToStudents({ ...open, exerciseIsUnlocked: false })).toBe(false);
    expect(isAssignmentOpenToStudents({ ...open, lessonIsUnlocked: false })).toBe(false);
  });
});
