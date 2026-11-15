import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TExercise, TNewOption, TNewQuestion, TQuestionAnswer, TQuestionType } from '@cio/db/types';
import {
  createOptions,
  createQuestions,
  deleteOptionsByIds,
  deleteQuestionsByIds,
  getOptionsByQuestionIds,
  getQuestionTypesByIds,
  getQuestionsByExerciseIds,
  updateOptions,
  updateQuestions
} from '@cio/db/queries/exercise';

import {
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_KEY,
  resolveTrueFalseCorrectValue,
  syncTrueFalseOptions,
  type TrueFalseAnswerOption
} from '@cio/question-types';
import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TExerciseUpdate } from '@cio/utils/validation/exercise';

type CurrentQuestion = TNewQuestion & { options?: TNewOption[] };
type CurrentOption = TNewOption;
type ExerciseUpdateQuestion = NonNullable<TExerciseUpdate['questions']>[number];

type ExerciseAnswer = Pick<
  TQuestionAnswer,
  'id' | 'answerData' | 'point' | 'questionId' | 'submissionId' | 'groupMemberId'
> & { id?: number };

export type QuestionWithRelations = {
  id: number | string;
  exerciseSectionId?: string | null;
  value: string;
  name: string;
  title: string;
  parentQuestionId?: number | null;
  type: number;
  points: number;
  order: number;
  questionType: {
    id: number;
    label: string;
  };
  questionTypeId: number;
  settings?: Record<string, unknown>;
  code?: string;
  answers?: ExerciseAnswer[];
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  options: {
    id: number | string;
    label: string | null;
    value: string | null;
    isCorrect: boolean;
    settings?: Record<string, unknown>;
    deletedAt?: string;
  }[];
};

function normalizeSettings(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function areSettingsEqual(left: unknown, right: unknown): boolean {
  const leftNormalized = normalizeSettings(left);
  const rightNormalized = normalizeSettings(right);

  return JSON.stringify(leftNormalized) === JSON.stringify(rightNormalized);
}

const BINARY_BOOLEAN_QUESTION_TYPE_IDS = new Set([QUESTION_TYPE_IDS[QUESTION_TYPE_KEY.TRUE_FALSE]]);

function normalizeBinaryBooleanQuestion(
  question: ExerciseUpdateQuestion,
  currentQuestion?: CurrentQuestion
): ExerciseUpdateQuestion {
  const questionTypeId = question.questionTypeId ?? currentQuestion?.questionTypeId;
  if (questionTypeId == null || !BINARY_BOOLEAN_QUESTION_TYPE_IDS.has(questionTypeId)) return question;

  const settings = normalizeSettings(question.settings ?? currentQuestion?.settings);
  const options = question.options ?? currentQuestion?.options ?? [];
  const correctValue = resolveTrueFalseCorrectValue(settings, options as TrueFalseAnswerOption[]);

  return {
    ...question,
    settings: { ...settings, correctValue },
    options: question.options ? syncTrueFalseOptions(question.options, correctValue) : question.options
  };
}

/**
 * Extracts exercise-level fields from the update payload
 */
export function buildExerciseUpdateFields(data: TExerciseUpdate): Partial<TExercise> {
  const exerciseUpdate: Partial<TExercise> = {};
  if (data.title !== undefined) exerciseUpdate.title = data.title;
  if (data.description !== undefined) exerciseUpdate.description = data.description;
  if (data.lessonId !== undefined) exerciseUpdate.lessonId = data.lessonId || null;
  if (data.sectionId !== undefined) exerciseUpdate.sectionId = data.sectionId || null;
  if (data.order !== undefined) exerciseUpdate.order = data.order;
  if (data.isUnlocked !== undefined) exerciseUpdate.isUnlocked = data.isUnlocked;
  if (data.dueBy !== undefined) exerciseUpdate.dueBy = data.dueBy || null;
  if (data.allowMultipleAttempts !== undefined) exerciseUpdate.allowMultipleAttempts = data.allowMultipleAttempts;
  if (data.completionPolicy !== undefined) exerciseUpdate.completionPolicy = data.completionPolicy;
  if (data.passThreshold !== undefined) exerciseUpdate.passThreshold = data.passThreshold;
  if (data.sectionDisplayMode !== undefined) exerciseUpdate.sectionDisplayMode = data.sectionDisplayMode;
  if (data.calculatorPolicy !== undefined) exerciseUpdate.calculatorPolicy = data.calculatorPolicy;
  if (data.slug !== undefined) exerciseUpdate.slug = data.slug;
  return exerciseUpdate;
}

/**
 * Categorizes questions into deleted, existing, and new
 */
export function categorizeQuestions(questions: NonNullable<TExerciseUpdate['questions']>) {
  const deletedIds: number[] = [];
  const existingQuestions: typeof questions = [];
  const newQuestions: typeof questions = [];
  const questionUpdates: Array<{ id: number; data: Partial<TNewQuestion> }> = [];

  for (const rawQuestion of questions) {
    const q = normalizeBinaryBooleanQuestion(rawQuestion);

    if (q.deletedAt && q.id) {
      deletedIds.push(q.id);
    } else if (q.id) {
      existingQuestions.push(q);
      questionUpdates.push({
        id: q.id,
        data: {
          title: q.question,
          points: q.points,
          questionTypeId: q.questionTypeId,
          settings: normalizeSettings(q.settings)
        }
      });
    } else {
      newQuestions.push(q);
    }
  }

  return { deletedIds, existingQuestions, newQuestions, questionUpdates };
}

/**
 * Categorizes options for a single question into deleted, existing, and new
 */
export function categorizeOptions(
  questionId: number,
  options: NonNullable<TExerciseUpdate['questions']>[number]['options']
) {
  const deletedIds: number[] = [];
  const existingUpdates: Array<{ id: number; data: Partial<TNewOption> }> = [];
  const newOptions: TNewOption[] = [];

  if (!options || options.length === 0) {
    return { deletedIds, existingUpdates, newOptions };
  }

  for (const opt of options) {
    if (opt.deletedAt && opt.id) {
      deletedIds.push(opt.id);
    } else if (opt.id) {
      existingUpdates.push({
        id: opt.id,
        data: {
          label: opt.label,
          isCorrect: opt.isCorrect,
          settings: normalizeSettings(opt.settings)
        }
      });
    } else {
      newOptions.push({
        questionId,
        label: opt.label,
        isCorrect: opt.isCorrect,
        settings: normalizeSettings(opt.settings)
      });
    }
  }

  return { deletedIds, existingUpdates, newOptions };
}

/**
 * Compares current question with incoming question data and returns only changed fields
 */
function diffQuestion(
  current: CurrentQuestion,
  incoming: NonNullable<TExerciseUpdate['questions']>[number]
): Partial<TNewQuestion> | null {
  const changes: Partial<TNewQuestion> = {};
  let hasChanges = false;

  if (incoming.question !== current.title) {
    changes.title = incoming.question;
    hasChanges = true;
  }
  if (incoming.points !== undefined && incoming.points !== current.points) {
    changes.points = incoming.points;
    hasChanges = true;
  }
  if (incoming.questionTypeId !== undefined && incoming.questionTypeId !== current.questionTypeId) {
    changes.questionTypeId = incoming.questionTypeId;
    hasChanges = true;
  }
  if (incoming.order !== undefined && incoming.order !== (current.order ?? undefined)) {
    changes.order = incoming.order;
    hasChanges = true;
  }
  if (incoming.exerciseSectionId !== undefined && incoming.exerciseSectionId !== current.exerciseSectionId) {
    changes.exerciseSectionId = incoming.exerciseSectionId;
    hasChanges = true;
  }
  if (incoming.parentQuestionId !== undefined && incoming.parentQuestionId !== (current.parentQuestionId ?? null)) {
    changes.parentQuestionId = incoming.parentQuestionId;
    hasChanges = true;
  }
  if (!areSettingsEqual(current.settings, incoming.settings)) {
    changes.settings = normalizeSettings(incoming.settings);
    hasChanges = true;
  }

  return hasChanges ? changes : null;
}

/**
 * Compares current option with incoming option data and returns only changed fields
 */
function diffOption(
  current: CurrentOption,
  incoming: NonNullable<NonNullable<TExerciseUpdate['questions']>[number]['options']>[number]
): Partial<TNewOption> | null {
  const changes: Partial<TNewOption> = {};
  let hasChanges = false;

  if (incoming.label !== current.label) {
    changes.label = incoming.label;
    hasChanges = true;
  }
  if (incoming.isCorrect !== current.isCorrect) {
    changes.isCorrect = incoming.isCorrect;
    hasChanges = true;
  }
  if (!areSettingsEqual(current.settings, incoming.settings)) {
    changes.settings = normalizeSettings(incoming.settings);
    hasChanges = true;
  }

  return hasChanges ? changes : null;
}

/**
 * Computes diff between current exercise state and incoming update data
 * Returns only the changes that need to be applied
 */
export function computeExerciseDiff(
  currentQuestions: CurrentQuestion[],
  incomingQuestions: NonNullable<TExerciseUpdate['questions']>
) {
  const questionMap = new Map(currentQuestions.map((q) => [q.id, q]));
  const normalizedIncomingQuestions = incomingQuestions.map((incoming) =>
    normalizeBinaryBooleanQuestion(incoming, incoming.id ? questionMap.get(incoming.id) : undefined)
  );

  const deletedQuestionIds: number[] = [];
  const questionUpdates: Array<{ id: number; data: Partial<TNewQuestion> }> = [];
  const newQuestions: NonNullable<TExerciseUpdate['questions']> = [];

  // Process incoming questions
  for (const incoming of normalizedIncomingQuestions) {
    if (incoming.deletedAt) {
      if (incoming.id) {
        deletedQuestionIds.push(incoming.id);
      }
      continue;
    }

    if (incoming.id) {
      const current = questionMap.get(incoming.id);
      if (current) {
        const changes = diffQuestion(current, incoming);
        if (changes) {
          questionUpdates.push({ id: incoming.id, data: changes });
        }
      } else {
        // Question ID exists but not in current state - treat as new
        newQuestions.push(incoming);
      }
    } else {
      newQuestions.push(incoming);
    }
  }

  // Compute option diffs for existing questions
  const optionDeletes: number[] = [];
  const optionUpdates: Array<{ id: number; data: Partial<TNewOption> }> = [];
  const optionCreates: TNewOption[] = [];

  for (const incoming of normalizedIncomingQuestions) {
    if (!incoming.id || incoming.deletedAt) continue;

    const current = questionMap.get(incoming.id);
    if (!current) continue;

    const currentOptionMap = new Map((current.options || []).map((opt) => [opt.id, opt]));
    const incomingOptions = incoming.options || [];
    const processedIncomingOptionIds = new Set<number>();

    for (const incomingOpt of incomingOptions) {
      if (incomingOpt.deletedAt) {
        if (incomingOpt.id) {
          optionDeletes.push(incomingOpt.id);
          processedIncomingOptionIds.add(incomingOpt.id);
        }
        continue;
      }

      if (incomingOpt.id) {
        processedIncomingOptionIds.add(incomingOpt.id);

        const currentOpt = currentOptionMap.get(incomingOpt.id);
        if (currentOpt) {
          const changes = diffOption(currentOpt, incomingOpt);
          if (changes) {
            optionUpdates.push({ id: incomingOpt.id, data: changes });
          }
        } else {
          // Option ID exists in incoming but not in current - treat as create
          optionCreates.push({
            questionId: incoming.id,
            label: incomingOpt.label,
            isCorrect: incomingOpt.isCorrect,
            settings: normalizeSettings(incomingOpt.settings),
            value: crypto.randomUUID()
          });
        }
      } else {
        // New option without ID
        optionCreates.push({
          questionId: incoming.id,
          label: incomingOpt.label,
          isCorrect: incomingOpt.isCorrect,
          settings: normalizeSettings(incomingOpt.settings),
          value: crypto.randomUUID()
        });
      }
    }

    // Check for options that were deleted (exist in current but not in incoming)
    for (const [optId] of currentOptionMap) {
      if (optId !== undefined && !processedIncomingOptionIds.has(optId)) {
        optionDeletes.push(optId);
      }
    }
  }

  return {
    questions: {
      deletedIds: deletedQuestionIds,
      updates: questionUpdates,
      newQuestions
    },
    options: {
      deletedIds: optionDeletes,
      updates: optionUpdates,
      creates: optionCreates
    }
  };
}

type CurrentParentLink = { id: number; parentQuestionId?: number | null };

/**
 * Throws 400 unless every part of a multi-part question points at a stem in this exercise. A stem is a question that
 * has no parent itself, so parts cannot nest and a part cannot also be a stem. New questions name a new stem with
 * `parentRef`, matching the `ref` of a question in the same payload.
 */
export function assertValidQuestionParents(
  currentQuestions: CurrentParentLink[],
  incomingQuestions: ExerciseUpdateQuestion[]
): void {
  const fail = (message: string) => new AppError(message, ErrorCodes.VALIDATION_ERROR, 400);
  const deletedIds = new Set(incomingQuestions.filter((q) => q.deletedAt && q.id).map((q) => q.id as number));
  const parentById = new Map<number, number | null>(
    currentQuestions.filter((q) => !deletedIds.has(q.id)).map((q) => [q.id, q.parentQuestionId ?? null])
  );
  const refs = new Map<string, ExerciseUpdateQuestion>();

  for (const question of incomingQuestions) {
    if (question.deletedAt) continue;

    if (question.id && question.parentQuestionId !== undefined && parentById.has(question.id)) {
      parentById.set(question.id, question.parentQuestionId);
    }
    if (question.ref) refs.set(question.ref, question);
  }

  const isNewQuestion = (question: ExerciseUpdateQuestion) => !question.id || !parentById.has(question.id);

  for (const question of incomingQuestions) {
    if (question.deletedAt) continue;

    if (question.parentRef) {
      const stem = refs.get(question.parentRef);
      if (!stem || !isNewQuestion(stem)) {
        throw fail(`parentRef "${question.parentRef}" must match the ref of a new question in the same request`);
      }
      if (stem.parentRef || (stem.parentQuestionId ?? null) !== null) {
        throw fail('A part of a multi-part question cannot also be a stem');
      }
    }

    const parentId = question.parentQuestionId;
    if (parentId == null) continue;

    if (parentId === question.id) throw fail('A question cannot be its own parent');
    if (!parentById.has(parentId)) {
      throw fail(`Parent question ${parentId} was not found in this exercise`);
    }
    if (parentById.get(parentId) != null) {
      throw fail(`Question ${parentId} is a part itself, so it cannot be a stem`);
    }
  }

  const stemIds = new Set([...parentById.values()].filter((id): id is number => id != null));
  const partWithParts = [...parentById].find(([id, parentId]) => parentId != null && stemIds.has(id));
  if (partWithParts) {
    throw fail(`Question ${partWithParts[0]} has parts, so it cannot be a part of another question`);
  }
}

/**
 * Inserts questions so stems exist before their parts, and returns the created rows in the order of `questions`.
 */
export async function createQuestionsWithParents(
  exerciseId: string,
  questions: ExerciseUpdateQuestion[],
  txClient: DbOrTxClient
) {
  const toRow = (question: ExerciseUpdateQuestion, parentQuestionId: number | null): TNewQuestion => ({
    exerciseId,
    title: question.question,
    questionTypeId: question.questionTypeId || 1,
    points: question.points ?? 1,
    order: typeof question.order === 'number' ? question.order : undefined,
    exerciseSectionId: question.exerciseSectionId ?? null,
    settings: normalizeSettings(question.settings),
    parentQuestionId
  });
  const stemIndexes = questions.flatMap((question, index) => (question.parentRef ? [] : [index]));
  const partIndexes = questions.flatMap((question, index) => (question.parentRef ? [index] : []));

  const createdStems = await createQuestions(
    stemIndexes.map((index) => toRow(questions[index], questions[index].parentQuestionId ?? null)),
    txClient
  );
  const createdByIndex = new Map(stemIndexes.map((questionIndex, row) => [questionIndex, createdStems[row]]));
  const stemIdByRef = new Map<string, number>();
  for (const [questionIndex, created] of createdByIndex) {
    const ref = questions[questionIndex].ref;
    if (ref) stemIdByRef.set(ref, created.id);
  }

  if (partIndexes.length > 0) {
    const createdParts = await createQuestions(
      partIndexes.map((index) =>
        toRow(questions[index], stemIdByRef.get(questions[index].parentRef as string) ?? null)
      ),
      txClient
    );
    partIndexes.forEach((questionIndex, row) => createdByIndex.set(questionIndex, createdParts[row]));
  }

  return questions.map((_, index) => createdByIndex.get(index)!);
}

/**
 * Creates new questions and their options in batch
 */
export async function createNewQuestionsWithOptions(
  exerciseId: string,
  newQuestions: NonNullable<TExerciseUpdate['questions']>,
  txClient: DbOrTxClient
): Promise<number[]> {
  const normalizedQuestions = newQuestions.map((question) => normalizeBinaryBooleanQuestion(question));
  const createdQuestions = await createQuestionsWithParents(exerciseId, normalizedQuestions, txClient);

  const newOptions: TNewOption[] = [];
  createdQuestions.forEach((newQuestion, index) => {
    const questionData = normalizedQuestions[index];
    if (newQuestion && questionData?.options && questionData.options.length > 0) {
      // Only include non-deleted options for new questions
      for (const opt of questionData.options) {
        if (!opt.deletedAt) {
          newOptions.push({
            questionId: newQuestion.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
            settings: normalizeSettings(opt.settings)
          });
        }
      }
    }
  });

  if (newOptions.length > 0) {
    await createOptions(newOptions, txClient);
  }

  return createdQuestions.map((question) => question.id);
}

/**
 * Fetches questions and their options for an exercise
 */
export async function fetchQuestionsAndOptions(exerciseId: string, dbClient?: DbOrTxClient) {
  const questions = await getQuestionsByExerciseIds([exerciseId], dbClient);
  const questionIds = questions.map((q) => q.id).filter((id): id is number => id !== undefined);
  const options = questionIds.length > 0 ? await getOptionsByQuestionIds(questionIds, dbClient) : [];
  return { questions, options };
}

/**
 * Fetches question types and creates a lookup map
 */
export async function fetchQuestionTypesMap(
  questions: TNewQuestion[],
  dbClient?: DbOrTxClient
): Promise<Map<number, TQuestionType>> {
  const questionTypeIds = [
    ...new Set(questions.map((q) => q.questionTypeId).filter((id): id is number => id !== undefined))
  ];
  const questionTypes: TQuestionType[] =
    questionTypeIds.length > 0 ? await getQuestionTypesByIds(questionTypeIds, dbClient) : [];
  return new Map(questionTypes.map((qt) => [qt.id, qt]));
}

/**
 * Transforms a single question with its options to frontend format
 */
export function transformQuestion(
  question: TNewQuestion,
  options: TNewOption[],
  questionTypeMap: Map<number, TQuestionType>
): QuestionWithRelations {
  const questionType = questionTypeMap.get(question.questionTypeId);
  const questionTypeId = question.questionTypeId;
  const questionOptions = options
    .filter((opt) => opt.questionId === question.id)
    .map((opt) => ({
      id: opt.id!,
      label: opt.label ?? null,
      value: opt.value ?? null,
      isCorrect: opt.isCorrect ?? false,
      settings: normalizeSettings(opt.settings)
    }));

  return {
    id: question.id!,
    exerciseSectionId: question.exerciseSectionId ?? null,
    value: question.title || '', // value field defaults to title
    name: question.name || '',
    title: question.title,
    parentQuestionId: question.parentQuestionId ?? null,
    type: questionTypeId, // type field (same as questionTypeId)
    points: question.points ?? 1,
    order: question.order || 0,
    questionType: questionType
      ? {
          id: questionType.id,
          label: questionType.label
        }
      : {
          id: questionTypeId,
          label: ''
        },
    questionTypeId: questionTypeId,
    settings: normalizeSettings(question.settings),
    createdAt: question.createdAt || undefined,
    updatedAt: question.updatedAt || undefined,
    options: questionOptions
  };
}

/**
 * Transforms all questions to frontend format
 */
export function transformQuestions(
  questions: TNewQuestion[],
  options: TNewOption[],
  questionTypeMap: Map<number, TQuestionType>
): QuestionWithRelations[] {
  return questions.map((question) => transformQuestion(question, options, questionTypeMap));
}
