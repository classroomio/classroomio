import { makeFixedVariants } from '@cio/question-types/variant-preview';
import { readQuestionParameters } from '@cio/question-types/variant-settings';
import { createExercise, deleteExerciseService, getExercise } from '@cio/core/services/exercise/exercise';
import { assertAnswerKeysVerified } from '@cio/core/services/exercise/answer-key';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { getQuestionsWithOptionsByIds } from '@cio/db/queries/analytics';
import { getCourseStudentMemberIds, replaceExerciseAssignments } from '@cio/db/queries/exercise';
import {
  getCoursePracticeQuestionIds,
  getQuestionSkillIds,
  getSkillById,
  replaceQuestionSkills
} from '@cio/db/queries/skill';
import { ContentType } from '@cio/utils/constants';
import { PRACTICE_MAX_SOURCE_QUESTIONS, type TPracticeCreate } from '@cio/utils/validation/practice';
import { AppError, ErrorCodes } from '@api/utils/errors';

type PracticeQuestion = {
  question: string;
  questionTypeId: number;
  points: number;
  order: number;
  settings: Record<string, unknown>;
  options: Array<{ label: string; isCorrect: boolean }>;
  sourceQuestionId: number;
};

type SourceQuestion = Awaited<ReturnType<typeof getQuestionsWithOptionsByIds>>[number];

/** The practice copies one source question yields: fresh-number variants when it is parameterised, else one copy. */
function copiesOf(source: SourceQuestion, count: number): Array<Omit<PracticeQuestion, 'order'>> {
  const settings = (source.settings as Record<string, unknown> | null) ?? {};
  const options = source.options.map((option) => ({ label: option.label ?? '', isCorrect: Boolean(option.isCorrect) }));
  const base = {
    questionTypeId: Number(source.questionTypeId),
    points: Math.max(1, Math.round(Number(source.points ?? 1))),
    sourceQuestionId: source.id
  };

  if (!readQuestionParameters(settings)) {
    return [{ ...base, question: source.title ?? '', settings, options }];
  }

  return makeFixedVariants({ title: source.title, settings, options }, count).map(({ question }) => ({
    ...base,
    question: question.title ?? '',
    settings: question.settings ?? {},
    options: (question.options ?? []).map((option) => ({
      label: option.label ?? '',
      isCorrect: Boolean((option as { isCorrect?: boolean }).isCorrect)
    }))
  }));
}

/** Takes one copy from each source in turn until `count` questions are chosen. */
function interleave<Item>(pools: Item[][], count: number): Item[] {
  const chosen: Item[] = [];

  for (let round = 0; chosen.length < count && pools.some((pool) => pool.length > round); round++) {
    for (const pool of pools) {
      if (chosen.length < count && pool[round]) chosen.push(pool[round]);
    }
  }

  return chosen;
}

/**
 * Builds a short practice exercise in the course from the questions behind a skill or from chosen questions, with
 * parameterised questions expanded into variants, and limits it to the chosen students. The exercise is hidden from
 * every other student the moment it exists; if the assignment cannot be saved it is deleted again.
 */
export async function createPracticeSetService(courseId: string, orgId: string, input: TPracticeCreate) {
  const profileIds = [...new Set(input.profileIds)];
  const memberIdByProfile = await getCourseStudentMemberIds(courseId, profileIds);
  if (memberIdByProfile.size !== profileIds.length) {
    throw new AppError(
      'Practice can only be assigned to students of this course',
      ErrorCodes.PRACTICE_INVALID_STUDENTS,
      400
    );
  }

  if (input.skillId && !(await getSkillById(orgId, input.skillId))) {
    throw new AppError('Skill not found', ErrorCodes.SKILL_NOT_FOUND, 404, 'skillId');
  }

  const source = input.skillId ? { skillId: input.skillId } : { questionIds: input.sourceQuestionIds ?? [] };
  const sourceIds = await getCoursePracticeQuestionIds(courseId, source, PRACTICE_MAX_SOURCE_QUESTIONS);
  const sources = await getQuestionsWithOptionsByIds(sourceIds);
  const sourceOrder = new Map(sourceIds.map((id, index) => [id, index]));
  const questions = interleave(
    sources
      .sort((first, second) => (sourceOrder.get(first.id) ?? 0) - (sourceOrder.get(second.id) ?? 0))
      .map((question) => copiesOf(question, input.count)),
    input.count
  ).map((question, order): PracticeQuestion => ({ ...question, order }));

  if (questions.length === 0) {
    throw new AppError(
      'No questions in this course can be turned into practice',
      ErrorCodes.PRACTICE_NO_QUESTIONS,
      404
    );
  }

  assertAnswerKeysVerified(questions);

  const skillIdsBySource = await getQuestionSkillIds(sourceIds);
  const contentItems = await getCourseContentItems(courseId);
  const nextOrder = Math.max(0, ...contentItems.map((item) => Number(item.order ?? 0))) + 1;
  const sectionId = contentItems.find((item) => item.type === ContentType.Exercise)?.sectionId ?? undefined;

  const exercise = await createExercise({
    title: input.title ?? 'Practice',
    courseId,
    sectionId,
    order: nextOrder,
    questions: questions.map(({ sourceQuestionId: _sourceQuestionId, ...question }) => question)
  });

  try {
    await replaceExerciseAssignments(exercise.id, [...memberIdByProfile.values()]);

    const { questions: storedQuestions } = await getExercise(exercise.id);
    const created = [...(storedQuestions ?? [])].sort((first, second) => Number(first.order) - Number(second.order));
    for (const [index, question] of questions.entries()) {
      const createdQuestion = created[index];
      const skillIds = skillIdsBySource.get(question.sourceQuestionId) ?? [];
      if (createdQuestion && skillIds.length > 0) await replaceQuestionSkills(Number(createdQuestion.id), skillIds);
    }
  } catch (error) {
    await deleteExerciseService(exercise.id);
    throw error;
  }

  return {
    exerciseId: exercise.id,
    title: exercise.title,
    questionCount: questions.length,
    assignedCount: memberIdByProfile.size
  };
}
