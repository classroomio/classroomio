import type { ImportedQuestionInput, WorksheetDraft, WorksheetQuestion } from './types';

export const WORKSHEET_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const;
export const WORKSHEET_MAX_BYTES = 10 * 1024 * 1024;

/** Verified questions start included; anything the engine could not confirm starts excluded until the teacher ticks it. */
export function toWorksheetDrafts(questions: WorksheetQuestion[]): WorksheetDraft[] {
  return questions.map((question, index) => ({
    ...question,
    draftId: index,
    included: question.verified,
    isEdited: false
  }));
}

export function getIncludedQuestions(drafts: WorksheetDraft[]): ImportedQuestionInput[] {
  return drafts
    .filter((draft) => draft.included)
    .map(({ title, type, points, settings, options }) => ({ title, type, points, settings, options }));
}

/** Reads the single answer of a MATH_EXPRESSION or NUMERIC draft as LaTeX. */
export function getDraftAnswer(draft: Pick<WorksheetDraft, 'type' | 'settings'>): string {
  if (draft.type === 'NUMERIC') return String(draft.settings.correctValue ?? '');

  const acceptedAnswers = draft.settings.acceptedAnswers;

  return Array.isArray(acceptedAnswers) ? String(acceptedAnswers[0] ?? '') : '';
}

export function withDraftAnswer(draft: WorksheetDraft, latex: string): WorksheetDraft {
  const settings =
    draft.type === 'NUMERIC'
      ? { ...draft.settings, correctValue: latex }
      : { ...draft.settings, acceptedAnswers: [latex] };

  return { ...draft, settings, isEdited: true };
}

export function withCorrectOption(draft: WorksheetDraft, correctIndex: number): WorksheetDraft {
  const options = draft.options.map((option, index) => ({ ...option, isCorrect: index === correctIndex }));

  return { ...draft, options, isEdited: true };
}

export function withOptionLabel(draft: WorksheetDraft, optionIndex: number, label: string): WorksheetDraft {
  const options = draft.options.map((option, index) => (index === optionIndex ? { ...option, label } : option));

  return { ...draft, options, isEdited: true };
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
