import {
  getExerciseQuestionContractKey,
  getQuestionTypeById,
  scoreAnswerForQuestion,
  QUESTION_TYPE_IDS,
  type AnswerData,
  type ExerciseQuestionModel
} from '@cio/question-types';

export type RawQuestion = {
  id: string | number;
  title: string;
  questionType?: string;
  questionTypeId?: number;
  points?: number;
  required?: boolean;
  settings?: Record<string, unknown>;
  options?: Array<{ id: string | number; label: string; value?: string; isCorrect?: boolean }>;
};

export type RawItem = {
  id: string;
  kind: 'lesson' | 'exercise';
  title: string;
  html?: string;
  locked?: boolean;
  description?: string;
  allowMultipleAttempts?: boolean;
  completionPolicy?: string;
  passThreshold?: number;
  commentsEnabled?: boolean;
  questions?: RawQuestion[];
};

export type RawSection = { id: string; title: string; items: RawItem[] };

export type Attempt = {
  id: string;
  at: number;
  answers: Record<string, AnswerData>;
  grades: Record<string, number>;
  score: number;
  total: number;
  status: 'graded' | 'pending';
};

export type Progress = {
  lessonsTotal: number;
  lessonsComplete: number;
  exercisesTotal: number;
  exercisesComplete: number;
  total: number;
  completed: number;
  percent: number;
};

export function progressOf(items: RawItem[], done: Record<string, boolean>): Progress {
  const lessons = items.filter((item) => item.kind === 'lesson');
  const exercises = items.filter((item) => item.kind === 'exercise');
  const lessonsComplete = lessons.filter((item) => done[item.id]).length;
  const exercisesComplete = exercises.filter((item) => done[item.id]).length;
  const total = lessons.length + exercises.length;
  const completed = lessonsComplete + exercisesComplete;

  return {
    lessonsTotal: lessons.length,
    lessonsComplete,
    exercisesTotal: exercises.length,
    exercisesComplete,
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}

/** Numeric ids per question/option (the scoring and renderers expect them); the original id stays the answer key. */
export function toModels(questions: RawQuestion[]): ExerciseQuestionModel[] {
  return questions.map((question, questionIndex) => {
    const typeKey =
      (question.questionType as ExerciseQuestionModel['questionType']) ??
      (Object.entries(QUESTION_TYPE_IDS).find(([, id]) => id === question.questionTypeId)?.[0] as never) ??
      'RADIO';

    return {
      id: questionIndex + 1,
      key: String(question.id),
      title: question.title,
      questionType: typeKey,
      points: Number(question.points ?? 0),
      required: question.required ?? true,
      settings: question.settings ?? {},
      options: (question.options ?? []).map((option, optionIndex) => ({
        id: (questionIndex + 1) * 100 + optionIndex + 1,
        label: option.label,
        value: option.value,
        isCorrect: option.isCorrect
      }))
    };
  });
}

export function isAutoGraded(models: ExerciseQuestionModel[]): boolean {
  return (
    models.length > 0 &&
    models.every((model) => getQuestionTypeById(QUESTION_TYPE_IDS[model.questionType as keyof typeof QUESTION_TYPE_IDS])?.autoGradable === true)
  );
}

export function gradeAttempt(models: ExerciseQuestionModel[], answers: Record<string, AnswerData>) {
  const grades: Record<string, number> = {};
  let score = 0;
  let total = 0;

  models.forEach((model, index) => {
    const key = getExerciseQuestionContractKey(model, index);
    const points = Math.round(scoreAnswerForQuestion(model, answers[key] ?? null));

    grades[key] = points;
    score += points;
    total += Number(model.points ?? 0);
  });

  return { grades, score, total };
}

export function hasAnswerValue(answer: AnswerData | null | undefined): boolean {
  if (!answer || typeof answer !== 'object' || !('type' in answer)) return false;

  switch (answer.type) {
    case 'RADIO':
    case 'TRUE_FALSE':
    case 'THUMBS':
    case 'NUMERIC':
    case 'STAR':
      return true;
    case 'CHECKBOX':
      return answer.optionIds.length > 0;
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return answer.text.trim().length > 0;
    case 'FILL_BLANK':
      return answer.values.length > 0;
    case 'WORD_BANK':
      return (answer.filledBlanks ?? []).length > 0 && answer.filledBlanks.every((value) => String(value).trim().length > 0);
    case 'FILE_UPLOAD':
      return !!answer.fileKey;
    case 'MATCHING':
      return answer.pairs.length > 0;
    case 'ORDERING':
      return answer.orderedValues.length > 0;
    case 'LINK':
      return answer.urls.length > 0;
    case 'HOTSPOT':
      return answer.coordinates.length > 0;
    default:
      return false;
  }
}

/** features/course/utils/exercise-progression-utils shouldCompleteExerciseFromSubmission */
export function completesExercise(item: RawItem, attempt: Attempt): boolean {
  if ((item.completionPolicy ?? 'submitted') !== 'passed') return true;
  if (attempt.status !== 'graded' || attempt.total <= 0) return false;

  return (attempt.score / attempt.total) * 100 >= (item.passThreshold ?? 0);
}
