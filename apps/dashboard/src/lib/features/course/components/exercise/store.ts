import { DEFAULT_QUESTION_TYPE, QUESTION_TEMPLATE } from '$features/ui/question/constants';
import type {
  AnswerData,
  ExerciseSectionAfterBehavior,
  ExerciseSectionColorTheme,
  ExerciseSectionDisplayMode
} from '@cio/question-types';

import type { Question } from '$features/course/types';
import { STATUS } from './constants';
import type { Writable } from 'svelte/store';
import { isUUID } from '$lib/utils/functions/isUUID';
import { writable } from 'svelte/store';
import { UNTITLED_EXERCISE_SECTION_TITLE } from '$features/course/utils/exercise-section-utils';

export const isQuestionnaireFetching = writable(false);
export const deleteConfirmation = writable({ open: false });
export const questionnaireOrder = writable({ open: false });

export interface ExerciseEditorFieldErrors {
  option?: string;
  title?: string;
  points?: string;
  description?: string;
}

export type ExerciseEditorErrors = Record<string, ExerciseEditorFieldErrors>;

// {'question-or-section-id': { option: '', title: '', description: '', ... }}
export const questionnaireValidation = writable<ExerciseEditorErrors>({});

export interface QuestionnaireMetaData {
  answers: Record<string, AnswerData | undefined>;
  scores: Record<string, number>;
  grades: Record<string, number>;
  totalPossibleGrade: number;
  finalTotalGrade: number;
  currentQuestionIndex: number;
  isFinished: boolean;
  progressValue: number;
  status: number;
  comment: string;
  /** Set when exercise is finished so route knows not to overwrite questionnaire */
  exerciseId: string | null;
  currentSectionIndex: number;
  sectionPhase: 'overview' | 'questions';
}

export interface ExerciseSectionState {
  id: string;
  title: string;
  description: string | null;
  order: number;
  colorTheme: ExerciseSectionColorTheme;
  afterBehavior: ExerciseSectionAfterBehavior;
  isDirty?: boolean;
  deletedAt?: string;
}

export interface QuestionnaireState {
  title?: string | null;
  dueBy?: string | null;
  isDueByDirty?: boolean;
  isTitleDirty?: boolean;
  description?: string | null;
  isDescriptionDirty?: boolean;
  questions: Question[];
  sections: ExerciseSectionState[];
  sectionDisplayMode: ExerciseSectionDisplayMode;
  totalSubmissions: number;
  allowMultipleAttempts?: boolean;
  completionPolicy?: 'submitted' | 'passed';
  passThreshold?: number | null;
  slug?: string | null;
}

const initAnswerState: QuestionnaireMetaData = {
  answers: {},
  scores: {},
  grades: {},
  totalPossibleGrade: 0,
  finalTotalGrade: 0,
  currentQuestionIndex: 0,
  isFinished: false,
  progressValue: 0,
  status: STATUS.PENDING,
  comment: '',
  exerciseId: null,
  currentSectionIndex: 0,
  sectionPhase: 'overview'
};

export const questionnaireMetaData: Writable<QuestionnaireMetaData> = writable(initAnswerState);

export const questionnaire: Writable<QuestionnaireState> = writable({
  title: '',
  dueBy: '',
  isDueByDirty: false,
  isTitleDirty: false,
  description: '',
  isDescriptionDirty: false,
  questions: [],
  sections: [],
  sectionDisplayMode: 'one_question',
  totalSubmissions: 0,
  allowMultipleAttempts: false,
  completionPolicy: 'submitted',
  passThreshold: 100,
  slug: ''
});

export function clearQuestionnaireValidation() {
  questionnaireValidation.set({});
}

export function reset() {
  questionnaireMetaData.update((metaData) => ({
    ...metaData,
    answers: {},
    scores: {},
    grades: {},
    currentQuestionIndex: 0,
    isFinished: false,
    exerciseId: null,
    totalPossibleGrade: 0,
    finalTotalGrade: 0,
    status: STATUS.PENDING,
    comment: '',
    progressValue: 100,
    currentSectionIndex: 0,
    sectionPhase: 'overview'
  }));

  clearQuestionnaireValidation();
}

/** Clears take-exercise state so the student can start another attempt (when allowed). */
export function resetStudentExerciseTake() {
  questionnaireMetaData.set({
    ...initAnswerState,
    exerciseId: null
  });
  clearQuestionnaireValidation();
}

/**
 * Maps Zod validation errors to UI format: { questionId: { option: 'error message' } }
 * This is used to display errors in the edit-mode component
 */
export function mapZodErrorsToQuestionErrors(
  zodErrors: Record<string, string>,
  questions: Question[]
): ExerciseEditorErrors {
  const errors: ExerciseEditorErrors = {};
  for (const [path, message] of Object.entries(zodErrors)) {
    const pathParts = path.split('.');
    const questionIndex = pathParts[0] === 'questions' ? parseInt(pathParts[1]) : -1;

    if (questionIndex >= 0 && questionIndex < questions.length) {
      const question = questions[questionIndex];
      if (question && !question.deletedAt) {
        const qErrors = errors[question.id] || {};

        // Check if error is related to options
        if (path.includes('options')) {
          qErrors.option = message;
        } else if (path.includes('question')) {
          qErrors.title = message;
        } else if (path.includes('points')) {
          qErrors.points = message;
        }

        errors[question.id] = { ...qErrors };
      }
    }
  }

  return errors;
}

export function hasSections(sections: ExerciseSectionState[]) {
  return sections.some((section) => !section.deletedAt);
}

function compareQuestionsByOrder(leftQuestion: Question, rightQuestion: Question) {
  const leftOrder = leftQuestion.order ?? 0;
  const rightOrder = rightQuestion.order ?? 0;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;

  return String(leftQuestion.id).localeCompare(String(rightQuestion.id), undefined, { numeric: true });
}

export function getQuestionsForSection(questions: Question[], exerciseSectionId: string) {
  return questions
    .filter((question) => !question.deletedAt && question.exerciseSectionId === exerciseSectionId)
    .sort(compareQuestionsByOrder);
}

export function handleAddQuestion(exerciseSectionId?: string | null) {
  let nextQuestionId: string | number = '';

  questionnaire.update((q) => {
    const { questions } = q;
    const activeSections = q.sections.filter((section) => !section.deletedAt);
    const nextExerciseSectionId = exerciseSectionId ?? (activeSections.length > 0 ? activeSections[0].id : null);
    nextQuestionId = `${questions.length + 1}-form`;

    return {
      ...q,
      questions: [
        ...questions,
        {
          ...QUESTION_TEMPLATE,
          id: nextQuestionId,
          name: `${nextQuestionId}`,
          value: '',
          points: 0,
          order: questions.length,
          exerciseSectionId: nextExerciseSectionId,
          questionType: DEFAULT_QUESTION_TYPE,
          questionTypeId: DEFAULT_QUESTION_TYPE.id,
          options: [
            {
              id: '1-form',
              label: '',
              value: null,
              isCorrect: false
            }
          ]
        }
      ]
    };
  });

  return nextQuestionId;
}

export function handleAddSection() {
  let nextSectionId = '';

  questionnaire.update((q) => {
    const activeSections = q.sections.filter((section) => !section.deletedAt);
    const firstAvailableSectionOrder =
      activeSections.reduce((highestOrder, section) => Math.max(highestOrder, section.order), -1) + 1;
    const activeUnsectionedQuestions = q.questions.filter(
      (question) => !question.deletedAt && !question.exerciseSectionId
    );
    const nextSectionDisplayNumber = activeSections.length + (activeUnsectionedQuestions.length > 0 ? 2 : 1);
    const nextSections = [...q.sections];
    let questions = q.questions;
    let nextSectionOrder = firstAvailableSectionOrder;

    if (activeUnsectionedQuestions.length > 0) {
      const untitledSectionId = crypto.randomUUID();
      const untitledSection: ExerciseSectionState = {
        id: untitledSectionId,
        title: UNTITLED_EXERCISE_SECTION_TITLE,
        description: null,
        order: nextSectionOrder,
        colorTheme: 'blue',
        afterBehavior: { action: 'continue' },
        isDirty: true
      };

      nextSectionOrder += 1;
      nextSections.push(untitledSection);
      questions = q.questions.map((question) => {
        if (question.deletedAt || question.exerciseSectionId) return question;

        return {
          ...question,
          exerciseSectionId: untitledSectionId,
          isDirty: true
        };
      });
    }

    const sectionId = crypto.randomUUID();
    nextSectionId = sectionId;
    const nextSection: ExerciseSectionState = {
      id: sectionId,
      title: `Section ${nextSectionDisplayNumber}`,
      description: null,
      order: nextSectionOrder,
      colorTheme: 'blue',
      afterBehavior: { action: 'continue' },
      isDirty: true
    };

    return {
      ...q,
      questions,
      sections: [...nextSections, nextSection]
    };
  });

  return nextSectionId;
}

export function handleRemoveSection(exerciseSectionId: string, moveQuestionsToExerciseSectionId?: string | null) {
  questionnaire.update((q) => {
    const activeSections = q.sections.filter((section) => !section.deletedAt);
    const remainingSections = activeSections.filter((section) => section.id !== exerciseSectionId);
    const shouldClearSections = remainingSections.length === 0;
    const deletedAt = new Date().toString();

    return {
      ...q,
      sections: q.sections.map((section) =>
        section.id === exerciseSectionId ? { ...section, deletedAt, isDirty: true } : section
      ),
      questions: q.questions.map((question) => {
        if (question.exerciseSectionId !== exerciseSectionId) return question;

        if (moveQuestionsToExerciseSectionId || shouldClearSections) {
          return {
            ...question,
            exerciseSectionId: shouldClearSections ? null : moveQuestionsToExerciseSectionId,
            isDirty: true
          };
        }

        return {
          ...question,
          deletedAt,
          isDirty: true
        };
      })
    };
  });
}

export function handleMoveQuestionToSection(questionId: string | number, exerciseSectionId: string | null) {
  questionnaire.update((q) => ({
    ...q,
    questions: q.questions.map((question) =>
      question.id === questionId ? { ...question, exerciseSectionId, isDirty: true } : question
    )
  }));
}

export function handleUpdateSectionAfterBehavior(
  exerciseSectionId: string,
  afterBehavior: ExerciseSectionAfterBehavior
) {
  questionnaire.update((q) => ({
    ...q,
    sections: q.sections.map((section) =>
      section.id === exerciseSectionId ? { ...section, afterBehavior, isDirty: true } : section
    )
  }));
}

export function handleUpdateSectionColorTheme(exerciseSectionId: string, colorTheme: ExerciseSectionColorTheme) {
  questionnaire.update((q) => ({
    ...q,
    sections: q.sections.map((section) =>
      section.id === exerciseSectionId ? { ...section, colorTheme, isDirty: true } : section
    )
  }));
}

export function handleUpdateSectionTitle(exerciseSectionId: string, title: string) {
  questionnaire.update((q) => ({
    ...q,
    sections: q.sections.map((section) =>
      section.id === exerciseSectionId ? { ...section, title, isDirty: true } : section
    )
  }));
}

export function handleUpdateSectionDescription(exerciseSectionId: string, description: string | null) {
  questionnaire.update((q) => ({
    ...q,
    sections: q.sections.map((section) =>
      section.id === exerciseSectionId ? { ...section, description, isDirty: true } : section
    )
  }));
}

export function handleReorderSections(orderedSectionIds: string[]) {
  const orderBySectionId = new Map(orderedSectionIds.map((sectionId, index) => [sectionId, index]));

  questionnaire.update((q) => ({
    ...q,
    sections: q.sections.map((section) => {
      const nextOrder = orderBySectionId.get(section.id);
      if (nextOrder === undefined || nextOrder === section.order) return section;

      return { ...section, order: nextOrder, isDirty: true };
    })
  }));
}

export function handleReorderQuestionsInSection(exerciseSectionId: string, orderedQuestionIds: Array<string | number>) {
  questionnaire.update((q) => {
    const activeSections = [...q.sections].filter((section) => !section.deletedAt).sort((a, b) => a.order - b.order);
    const sectionExists = activeSections.some((section) => section.id === exerciseSectionId);
    if (!sectionExists) return q;

    const questionById = new Map(q.questions.map((question) => [String(question.id), question]));
    const orderedQuestionIdSet = new Set(orderedQuestionIds.map((questionId) => String(questionId)));
    const reorderedActiveQuestions: Question[] = [];

    for (const section of activeSections) {
      const sectionQuestions = getQuestionsForSection(q.questions, section.id);

      if (section.id !== exerciseSectionId) {
        reorderedActiveQuestions.push(...sectionQuestions);
        continue;
      }

      const orderedSectionQuestions = orderedQuestionIds
        .map((questionId) => questionById.get(String(questionId)))
        .filter(
          (question): question is Question =>
            Boolean(question) && !question?.deletedAt && question?.exerciseSectionId === exerciseSectionId
        );
      const missingSectionQuestions = sectionQuestions.filter(
        (question) => !orderedQuestionIdSet.has(String(question.id))
      );
      reorderedActiveQuestions.push(...orderedSectionQuestions, ...missingSectionQuestions);
    }

    const activeUnsectionedQuestions = q.questions
      .filter((question) => !question.deletedAt && !question.exerciseSectionId)
      .sort(compareQuestionsByOrder);
    const nextOrderByQuestionId = new Map(
      [...reorderedActiveQuestions, ...activeUnsectionedQuestions].map((question, index) => [
        String(question.id),
        index + 1
      ])
    );

    return {
      ...q,
      questions: q.questions.map((question) => {
        const nextOrder = nextOrderByQuestionId.get(String(question.id));
        if (nextOrder === undefined || question.order === nextOrder) return question;

        return { ...question, order: nextOrder, isDirty: true };
      })
    };
  });
}

export function handleAddOption(questionId) {
  return () => {
    questionnaire.update((_questionnaire) => {
      const { questions } = _questionnaire;
      return {
        ..._questionnaire,
        questions: questions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              options: [
                ...question.options,
                {
                  id: `${new Date().getTime()}-form`,
                  label: '',
                  value: '',
                  isCorrect: false
                }
              ]
            };
          }

          return question;
        })
      };
    });
  };
}

export function handleRemoveOption(questionId, optionId) {
  return () => {
    questionnaire.update((q) => {
      const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
      if (questionIndex === -1) return q;

      const optionsIndex = q.questions[questionIndex].options.findIndex((oItem) => oItem.id === optionId);
      if (optionsIndex === -1) return q;

      q.questions[questionIndex].options[optionsIndex].deletedAt = new Date().toString();
      q.questions[questionIndex].options[optionsIndex].isDirty = true;
      q.questions[questionIndex].isDirty = true; // Mark as dirty if needed

      return q;
    });
  };
}

export function handleRemoveQuestion(questionId) {
  return () => {
    questionnaire.update((q) => {
      const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
      if (questionIndex === -1) return q;

      q.questions[questionIndex].deletedAt = new Date().toString();

      return q;
    });
  };
}

export function handleCode(questionId, shouldAdd = true) {
  questionnaire.update((q) => {
    const questionIndex = q.questions.findIndex((qItem) => qItem.id === questionId);
    if (questionIndex === -1) return q;

    const question = q.questions[questionIndex];
    q.questions[questionIndex].code = shouldAdd ? question.code || '' : undefined;

    return q;
  });
}

export function handleAnswerSelect(questionId, optionId) {
  return () => {
    questionnaire.update((q) => {
      const { questions } = q;

      return {
        ...q,
        questions: questions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              options: question.options.map((option) => {
                if (option.id === optionId) {
                  option.isCorrect = !option.isCorrect;
                  option.isDirty = true;
                }
                return option;
              })
            };
          }

          return question;
        })
      };
    });
  };
}

export function addDynamicValue(questionId, optionId) {
  return (e) => {
    questionnaire.update((q) => {
      const { questions } = q;

      return {
        ...q,
        questions: questions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              options: question.options.map((option) => {
                if (option.id === optionId) {
                  const label = e.target.value;

                  if (!isUUID(option.value || '')) {
                    option.value = label.split(' ').join('-');
                  }

                  option.label = label;
                  option.isDirty = true;
                }

                return option;
              })
            };
          }

          return question;
        })
      };
    });
  };
}
