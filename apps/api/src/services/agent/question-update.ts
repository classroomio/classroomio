import { AppError } from '@api/utils/errors';

export type CurrentQuestionForPatch = {
  id: number | string;
  title: string;
  questionTypeId: number;
  points: number;
  order: number;
  settings?: Record<string, unknown>;
  options: Array<{
    id: number | string;
    label: string | null;
    isCorrect: boolean;
    settings?: Record<string, unknown>;
  }>;
};

export type QuestionPatch = {
  id: number;
  question?: string;
  questionTypeId?: number;
  points?: number;
  order?: number;
  settings?: Record<string, unknown>;
  options?: Array<{
    id?: number;
    label?: string;
    isCorrect?: boolean;
    settings?: Record<string, unknown>;
  }>;
};

export type MergedOption = {
  id?: number;
  label: string;
  isCorrect: boolean;
  settings?: Record<string, unknown>;
};

export type MergedQuestion = {
  id: number;
  question: string;
  questionTypeId: number;
  points: number;
  order: number;
  settings?: Record<string, unknown>;
  options: MergedOption[];
};

export function buildUpdatedQuestions(
  currentQuestions: CurrentQuestionForPatch[],
  patches: QuestionPatch[],
  exerciseId: string
): MergedQuestion[] {
  const byId = new Map(currentQuestions.map((q) => [Number(q.id), q] as const));

  return patches.map((patch) => {
    const current = byId.get(patch.id);
    if (!current) {
      throw new AppError(
        `Question ${patch.id} does not belong to exercise ${exerciseId}`,
        'RESOURCE_NOT_IN_COURSE',
        404
      );
    }

    const currentOptions: MergedOption[] = (current.options || []).map((o) => ({
      id: Number(o.id),
      label: o.label || '',
      isCorrect: o.isCorrect,
      settings: o.settings ?? undefined
    }));

    const mergedSettings =
      patch.settings === undefined ? current.settings : { ...(current.settings ?? {}), ...patch.settings };

    let mergedOptions: MergedOption[];
    if (patch.options === undefined) {
      mergedOptions = currentOptions;
    } else {
      mergedOptions = patch.options.map((opt) => {
        if (opt.id != null) {
          const existingOpt = currentOptions.find((co) => co.id === opt.id);
          return {
            id: opt.id,
            label: opt.label ?? existingOpt?.label ?? '',
            isCorrect: opt.isCorrect ?? existingOpt?.isCorrect ?? false,
            settings: opt.settings ?? existingOpt?.settings
          };
        }

        return {
          label: opt.label ?? '',
          isCorrect: opt.isCorrect ?? false,
          settings: opt.settings
        };
      });
    }

    return {
      id: patch.id,
      question: patch.question ?? current.title ?? '',
      questionTypeId: patch.questionTypeId ?? current.questionTypeId,
      points: patch.points ?? current.points,
      order: patch.order ?? current.order,
      settings: mergedSettings,
      options: mergedOptions
    };
  });
}
