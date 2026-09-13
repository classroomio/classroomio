import { classroomio, type InferResponseType } from '$lib/utils/services/api';

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
