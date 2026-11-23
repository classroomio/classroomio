import {
  listLearnerExercises,
  listLearnerSubmissions,
  type LearnerSubmissionRow
} from '@cio/db/queries/learner/assignments';
import { toIsoTimestamp } from '@cio/utils/functions/learner-streak';

const GRADED_STATUS_ID = 3;

export type LearnerAssignmentStatus = 'upcoming' | 'submitted' | 'graded';

const STATUS_ORDER: Record<LearnerAssignmentStatus, number> = { upcoming: 0, submitted: 1, graded: 2 };

function isGraded(submission: LearnerSubmissionRow): boolean {
  return submission.gradingState === 'completed' || Number(submission.statusId) === GRADED_STATUS_ID;
}

function timeOf(value: string | null): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

/**
 * Exercises from the learner's courses in the organization: not yet submitted first (soonest due date first, no due
 * date last), then submitted and waiting for a grade, then graded (most recent first).
 */
export async function listLearnerAssignments(orgId: string, profileId: string) {
  const exercises = await listLearnerExercises(orgId, profileId);
  const submissions = await listLearnerSubmissions({
    exerciseIds: [...new Set(exercises.map((exercise) => exercise.exerciseId))],
    groupMemberIds: [...new Set(exercises.map((exercise) => exercise.groupMemberId))]
  });

  const latestByExercise = new Map<string, LearnerSubmissionRow>();
  for (const submission of submissions) {
    const key = `${submission.exerciseId}:${submission.groupMemberId}`;
    if (!latestByExercise.has(key)) latestByExercise.set(key, submission);
  }

  const assignments = exercises.map((exercise) => {
    const submission = latestByExercise.get(`${exercise.exerciseId}:${exercise.groupMemberId}`) ?? null;
    const status: LearnerAssignmentStatus = !submission ? 'upcoming' : isGraded(submission) ? 'graded' : 'submitted';

    return {
      exerciseId: exercise.exerciseId,
      title: exercise.title,
      course: { id: exercise.courseId, title: exercise.courseTitle },
      dueAt: toIsoTimestamp(exercise.dueBy),
      status,
      submittedAt: toIsoTimestamp(submission?.createdAt ?? null),
      gradedAt: submission && status === 'graded' ? toIsoTimestamp(submission.updatedAt) : null,
      score: status === 'graded' ? Number(submission?.total ?? 0) : null,
      maxScore: exercise.maxScore
    };
  });

  return assignments.sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (a.status === 'upcoming') return timeOf(a.dueAt) - timeOf(b.dueAt) || a.title.localeCompare(b.title);

    const aTime = new Date(a.gradedAt ?? a.submittedAt ?? 0).getTime();
    const bTime = new Date(b.gradedAt ?? b.submittedAt ?? 0).getTime();

    return bTime - aTime;
  });
}
