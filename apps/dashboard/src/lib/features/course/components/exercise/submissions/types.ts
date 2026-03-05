import type { SubmissionAnswer, SubmissionListItem } from '$features/course/utils/types';

type ApiProfile = NonNullable<NonNullable<SubmissionListItem['groupmember']>['profile']>;
type ExerciseSubmissionProfile = Required<Pick<ApiProfile, 'id' | 'fullname' | 'avatarUrl'>>;

type ExerciseSubmissionAnswer = {
  id: SubmissionAnswer['id'];
  questionId: SubmissionAnswer['questionId'];
  answerData?: SubmissionAnswer['answerData'];
  point: NonNullable<SubmissionAnswer['point']>;
  submissionId: NonNullable<SubmissionAnswer['submissionId']>;
  groupMemberId: NonNullable<SubmissionAnswer['groupMemberId']>;
};

/** Normalized submission for exercise submissions UI (profile/answer defaults filled by transform) */
export type ExerciseSubmissions = {
  id: SubmissionListItem['id'];
  statusId: NonNullable<SubmissionListItem['statusId']>;
  groupmember: { profile: ExerciseSubmissionProfile } | null;
  answers: ExerciseSubmissionAnswer[];
};
