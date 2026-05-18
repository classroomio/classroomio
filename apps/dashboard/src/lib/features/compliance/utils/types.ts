import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ComplianceOverviewRequest = (typeof classroomio.dash)['compliance-overview']['$get'];

export type ComplianceOverviewSuccess = Extract<InferResponseType<ComplianceOverviewRequest>, { success: true }>;

export type ComplianceOverviewData = ComplianceOverviewSuccess['data'];

export type ComplianceStatus = ComplianceOverviewData['summary']['counts'] extends Record<infer K, number> ? K : never;

export type ComplianceCourseRow = ComplianceOverviewData['courses'][number];
export type ComplianceLearnerRow = ComplianceOverviewData['learners'][number];
