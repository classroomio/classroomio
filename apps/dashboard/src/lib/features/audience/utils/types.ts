import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { AudienceBulkAction } from '$features/org/utils/types';

export type GetAudienceAnalyticsRequest = (typeof classroomio.organization.audience)[':userId']['analytics']['$get'];
export type GetAudienceAnalyticsSuccess = Extract<InferResponseType<GetAudienceAnalyticsRequest>, { success: true }>;
export type AudienceAnalytics = GetAudienceAnalyticsSuccess['data'];
export type AudienceAnalyticsCourse = AudienceAnalytics['courses'][number];
export type AudienceAnalyticsExercise = AudienceAnalyticsCourse['exercises'][number];
export type AudienceAnalyticsUser = AudienceAnalytics['user'];

/** What the import page hands to its route so the header can drive the step. */
export type ImportControls = {
  step: 'upload' | 'preview' | 'result';
  /** Rows that will actually be invited; the submit label counts these. */
  readyCount: number;
  isSubmitting: boolean;
  submit: () => Promise<void> | void;
  startOver: () => void;
};

/** What the audience page hands to its route so the selection bar can sit
 *  beside `Page.Body`, where a sticky bar actually has somewhere to stick. */
export type AudienceSelectionControls = {
  selectedCount: number;
  totalMatching: number;
  allMatchingSelected: boolean;
  isApplying: boolean;
  loadDocument: () => Promise<unknown>;
  selectAllMatching: () => void;
  clear: () => void;
  openAssign: () => void;
  act: (action: AudienceBulkAction) => void;
};
