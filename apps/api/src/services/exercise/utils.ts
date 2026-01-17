import type { TExercise, TNewOption, TNewQuestion, TQuestionType } from '@cio/db/types';
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

import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TExerciseUpdate } from '@cio/utils/validation/exercise';

type CurrentQuestion = TNewQuestion & { options?: TNewOption[] };
type CurrentOption = TNewOption;

export type QuestionWithRelations = {
  id: number | string;
  value: string;
  name: string;
  title: string;
  type: number;
  points: number;
  order: number;
  questionType: {
    id: number;
    label: string;
  };
  questionTypeId: number;
  code?: string;
  answers?: Array<unknown>;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  options: {
    id: number | string;
    label: string | null;
    value: string | null;
    isCorrect: boolean;
    deletedAt?: string;
  }[];
};

/**
 * Extracts exercise-level fields from the update payload
 */
export function buildExerciseUpdateFields(data: TExerciseUpdate): Partial<TExercise> {
  const exerciseUpdate: Partial<TExercise> = {};
  if (data.title !== undefined) exerciseUpdate.title = data.title;
  if (data.description !== undefined) exerciseUpdate.description = data.description;
  if (data.lessonId !== undefined) exerciseUpdate.lessonId = data.lessonId || null;
  if (data.dueBy !== undefined) exerciseUpdate.dueBy = data.dueBy || null;
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

  for (const q of questions) {
    if (q.deletedAt && q.id) {
      deletedIds.push(q.id);
    } else if (q.id) {
      existingQuestions.push(q);
      questionUpdates.push({
        id: q.id,
        data: {
          title: q.question,
          points: q.points,
          questionTypeId: q.questionTypeId
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
          isCorrect: opt.isCorrect
        }
      });
    } else {
      newOptions.push({
        questionId,
        label: opt.label,
        isCorrect: opt.isCorrect
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

  const deletedQuestionIds: number[] = [];
  const questionUpdates: Array<{ id: number; data: Partial<TNewQuestion> }> = [];
  const newQuestions: NonNullable<TExerciseUpdate['questions']> = [];

  // Process incoming questions
  for (const incoming of incomingQuestions) {
    if (incoming.deletedAt && incoming.id) {
      deletedQuestionIds.push(incoming.id);
    } else if (incoming.id) {
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

  for (const incoming of incomingQuestions) {
    if (!incoming.id || incoming.deletedAt) continue;

    const current = questionMap.get(incoming.id);
    if (!current) continue;

    const currentOptionMap = new Map((current.options || []).map((opt) => [opt.id, opt]));
    const incomingOptions = incoming.options || [];
    const processedIncomingOptionIds = new Set<number>();

    for (const incomingOpt of incomingOptions) {
      if (incomingOpt.deletedAt && incomingOpt.id) {
        optionDeletes.push(incomingOpt.id);

        processedIncomingOptionIds.add(incomingOpt.id);
      } else if (incomingOpt.id) {
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
            isCorrect: incomingOpt.isCorrect
          });
        }
      } else {
        // New option without ID
        optionCreates.push({
          questionId: incoming.id,
          label: incomingOpt.label,
          isCorrect: incomingOpt.isCorrect
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

/**
 * Creates new questions and their options in batch
 */
export async function createNewQuestionsWithOptions(
  exerciseId: string,
  newQuestions: NonNullable<TExerciseUpdate['questions']>,
  txClient: DbOrTxClient
): Promise<void> {
  const createdQuestions = await createQuestions(
    newQuestions.map((q) => ({
      exerciseId,
      title: q.question,
      questionTypeId: q.questionTypeId || 1,
      points: q.points || 0
    })),
    txClient
  );

  const newOptions: TNewOption[] = [];
  createdQuestions.forEach((newQuestion, index) => {
    const questionData = newQuestions[index];
    if (newQuestion && questionData?.options && questionData.options.length > 0) {
      // Only include non-deleted options for new questions
      for (const opt of questionData.options) {
        if (!opt.deletedAt) {
          newOptions.push({
            questionId: newQuestion.id,
            label: opt.label,
            isCorrect: opt.isCorrect
          });
        }
      }
    }
  });

  if (newOptions.length > 0) {
    await createOptions(newOptions, txClient);
  }
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
      isCorrect: opt.isCorrect ?? false
    }));

  return {
    id: question.id!,
    value: question.title || '', // value field defaults to title
    name: question.name || '',
    title: question.title,
    type: questionTypeId, // type field (same as questionTypeId)
    points: question.points || 0,
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
