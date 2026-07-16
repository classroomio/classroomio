import { isAutoGradableQuestionTypeId } from '@cio/question-types';

import type { Question } from '$features/course/types';
import type { SubmissionListItem } from '$features/course/utils/types';

export type ExerciseCompletionPolicy = 'submitted' | 'passed';

export type ExerciseAttempt = {
  attemptNumber: number;
  submission: SubmissionListItem;
};

export type ExerciseSubmissionStudentGroup = {
  studentKey: string;
  studentName: string;
  studentAvatarUrl: string;
  attempts: ExerciseAttempt[];
};

export function getActiveExerciseQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => !question.deletedAt);
}

export function getTotalPossibleExercisePoints(questions: Question[]): number {
  return getActiveExerciseQuestions(questions).reduce((total, question) => total + Number(question.points ?? 0), 0);
}

export function getManualGradedExerciseQuestions(questions: Question[]): Question[] {
  return getActiveExerciseQuestions(questions).filter((question) => {
    const questionTypeId = Number(question.questionTypeId ?? question.questionType?.id);
    if (!Number.isFinite(questionTypeId)) return true;

    return !isAutoGradableQuestionTypeId(questionTypeId);
  });
}

function getSubmissionScore(submission: SubmissionListItem): number {
  const submissionTotal = Number((submission as SubmissionListItem & { total?: number | string | null }).total ?? NaN);
  if (Number.isFinite(submissionTotal)) return submissionTotal;

  return (submission.answers ?? []).reduce((total, answer) => total + Number(answer.point ?? 0), 0);
}

export function shouldCompleteExerciseFromSubmission(params: {
  completionPolicy: ExerciseCompletionPolicy | null | undefined;
  passThreshold: number | null | undefined;
  totalPossiblePoints: number;
  submission: SubmissionListItem & { gradingState?: string | null };
}): boolean {
  if ((params.completionPolicy ?? 'submitted') === 'submitted') return true;
  if (params.submission.gradingState !== 'completed') return false;
  if (params.totalPossiblePoints <= 0) return false;

  const threshold = Number(params.passThreshold ?? 100);
  const scorePercent = (getSubmissionScore(params.submission) / params.totalPossiblePoints) * 100;

  return scorePercent >= threshold;
}

function getSubmissionTimestamp(submission: SubmissionListItem): number {
  const createdAt = (submission as SubmissionListItem & { createdAt?: string | Date | null }).createdAt;
  const timestamp = createdAt ? new Date(createdAt).getTime() : NaN;

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getStudentKey(submission: SubmissionListItem): string {
  const profile = submission.groupmember?.profile;
  const firstAnswerGroupMemberId = submission.answers?.find((answer) => answer.groupMemberId)?.groupMemberId;

  return String(profile?.id ?? firstAnswerGroupMemberId ?? submission.id);
}

export function groupSubmissionsByStudentAndAttempt(
  submissionItems: SubmissionListItem[]
): ExerciseSubmissionStudentGroup[] {
  const groupByStudent = new Map<string, SubmissionListItem[]>();

  for (const submission of submissionItems) {
    const studentKey = getStudentKey(submission);
    const studentSubmissions = groupByStudent.get(studentKey) ?? [];
    studentSubmissions.push(submission);
    groupByStudent.set(studentKey, studentSubmissions);
  }

  return [...groupByStudent.entries()]
    .map(([studentKey, studentSubmissions]) => {
      const orderedSubmissions = [...studentSubmissions].sort(
        (leftSubmission, rightSubmission) =>
          getSubmissionTimestamp(leftSubmission) - getSubmissionTimestamp(rightSubmission)
      );
      const latestSubmission = orderedSubmissions[orderedSubmissions.length - 1];
      const profile = latestSubmission?.groupmember?.profile;

      return {
        studentKey,
        studentName: profile?.fullname ?? '',
        studentAvatarUrl: profile?.avatarUrl ?? '',
        attempts: orderedSubmissions.map((submission, index) => ({
          attemptNumber: index + 1,
          submission
        }))
      };
    })
    .sort((leftGroup, rightGroup) => leftGroup.studentName.localeCompare(rightGroup.studentName));
}
