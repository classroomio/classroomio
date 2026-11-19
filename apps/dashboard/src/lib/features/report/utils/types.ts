import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type CreateContentReportRequest = typeof classroomio.report.$post;
export type CreateContentReportSuccess = Extract<InferResponseType<CreateContentReportRequest>, { success: true }>;
export type CreateContentReportData = CreateContentReportSuccess['data'];
