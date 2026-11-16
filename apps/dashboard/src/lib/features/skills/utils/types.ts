import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListSkillsRequest = (typeof classroomio.skill)['$get'];
export type ListSkillsSuccess = Extract<InferResponseType<ListSkillsRequest>, { success: true }>;
export type Skill = ListSkillsSuccess['data'][number];

export type CreateSkillRequest = (typeof classroomio.skill)['$post'];
export type UpdateSkillRequest = (typeof classroomio.skill)[':skillId']['$put'];
export type DeleteSkillRequest = (typeof classroomio.skill)[':skillId']['$delete'];

export type ImportSkillsRequest = (typeof classroomio.skill)['import']['$post'];
export type ImportSkillsSuccess = Extract<InferResponseType<ImportSkillsRequest>, { success: true }>;
export type ImportSkillsResult = ImportSkillsSuccess['data'];

export type SuggestSkillsRequest = (typeof classroomio.skill)['suggest']['$post'];
export type SuggestSkillsSuccess = Extract<InferResponseType<SuggestSkillsRequest>, { success: true }>;
export type SuggestedSkill = SuggestSkillsSuccess['data'][number];

export type QuestionSkillsRequest =
  (typeof classroomio.course)[':courseId']['skill']['exercise'][':exerciseId']['$get'];
export type QuestionSkillsSuccess = Extract<InferResponseType<QuestionSkillsRequest>, { success: true }>;
export type QuestionSkillTag = QuestionSkillsSuccess['data'][number];

export type SetQuestionSkillsRequest =
  (typeof classroomio.course)[':courseId']['skill']['exercise'][':exerciseId']['question'][':questionId']['$put'];

export type ExerciseMasteryRequest =
  (typeof classroomio.course)[':courseId']['skill']['mastery']['exercise'][':exerciseId']['$get'];
export type ExerciseMasterySuccess = Extract<InferResponseType<ExerciseMasteryRequest>, { success: true }>;
export type ExerciseMastery = ExerciseMasterySuccess['data'];

export type StudentMasteryRequest =
  (typeof classroomio.course)[':courseId']['skill']['mastery']['student'][':profileId']['$get'];
export type StudentMasterySuccess = Extract<InferResponseType<StudentMasteryRequest>, { success: true }>;
export type StudentSkillMastery = StudentMasterySuccess['data'][number];

export type SkillRow = Skill & { depth: number };
