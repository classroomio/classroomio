export type AssignmentAvailabilityState = {
  courseStatus: string | null;
  courseIsPublished: boolean | null;
  exerciseIsUnlocked: boolean | null;
  /** Null when the exercise sits at the course root rather than inside a lesson. */
  lessonIsUnlocked: boolean | null;
};

/** Whether students can open an exercise now: its course is published and active, and it and its lesson are unlocked. */
export function isAssignmentOpenToStudents(state: AssignmentAvailabilityState): boolean {
  return (
    state.courseStatus === 'ACTIVE' &&
    state.courseIsPublished === true &&
    state.exerciseIsUnlocked !== false &&
    state.lessonIsUnlocked !== false
  );
}
