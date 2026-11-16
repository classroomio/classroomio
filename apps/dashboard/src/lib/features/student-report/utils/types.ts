import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type CreateStudentReportRequest = (typeof classroomio.course)[':courseId']['student-report']['$post'];
export type CreateStudentReportSuccess = Extract<InferResponseType<CreateStudentReportRequest>, { success: true }>;
export type CreatedStudentReport = CreateStudentReportSuccess['data']['reports'][number];

export type ListStudentReportsRequest = (typeof classroomio.course)[':courseId']['student-report']['$get'];
export type ListStudentReportsSuccess = Extract<InferResponseType<ListStudentReportsRequest>, { success: true }>;
export type StudentReportHistoryItem = ListStudentReportsSuccess['data'][number];

export type RevokeStudentReportRequest =
  (typeof classroomio.course)[':courseId']['student-report'][':reportId']['$delete'];

export type PublicStudentReportRequest = (typeof classroomio)['student-report'][':token']['$get'];
export type PublicStudentReportSuccess = Extract<InferResponseType<PublicStudentReportRequest>, { success: true }>;
export type PublicStudentReport = PublicStudentReportSuccess['data'];

export type ReportStudent = { profileId: string; name: string };
