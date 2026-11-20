import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ConvertImageRequest = (typeof classroomio.math)['convert-image']['$post'];
export type ImportWorksheetRequest = (typeof classroomio.math)['import-worksheet']['$post'];

export type ImportWorksheetSuccess = Extract<InferResponseType<ImportWorksheetRequest>, { success: true }>;
export type WorksheetQuestion = ImportWorksheetSuccess['data']['questions'][number];
export type WorksheetQuestionType = WorksheetQuestion['type'];

export type WorksheetDraft = WorksheetQuestion & {
  draftId: number;
  included: boolean;
  isEdited: boolean;
};

export interface ImportedQuestionInput {
  title: string;
  type: WorksheetQuestionType;
  points: number;
  settings: Record<string, unknown>;
  options: { label: string; isCorrect: boolean }[];
}

export type WorksheetFileMediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf';
