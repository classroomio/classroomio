import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetPendingOrgInviteRequest = (typeof classroomio.invite.organization)['pending']['$get'];
type GetPendingOrgInviteResponse = Extract<InferResponseType<GetPendingOrgInviteRequest>, { success: true }>;
export type PendingOrgInvite = NonNullable<GetPendingOrgInviteResponse['data']>;

export type GetEnrolledRequest = (typeof classroomio.organization)['enrolled']['$get'];
export type GetEnrolledSuccess = Extract<InferResponseType<GetEnrolledRequest>, { success: true }>;
export type EnrolledItems = GetEnrolledSuccess['data'];
export type EnrolledItem = EnrolledItems[number];
export type EnrolledCourse = Extract<EnrolledItem, { kind: 'course' }>['data'];
export type EnrolledPath = Extract<EnrolledItem, { kind: 'learning_path' }>['data'];
export type EnrolledPagination = GetEnrolledSuccess['pagination'];
export type EnrolledCounts = GetEnrolledSuccess['counts'];
export type EnrolledQuery = {
  page?: number;
  limit?: number;
  status?: 'all' | 'not_started' | 'in_progress';
  kind?: 'all' | 'course' | 'learning_path';
  search?: string;
};

export type GetPathJourneyRequest = (typeof classroomio)['learning-path'][':pathId']['journey']['$get'];
export type GetPathJourneySuccess = Extract<InferResponseType<GetPathJourneyRequest>, { success: true }>;
export type PathJourney = GetPathJourneySuccess['data'];
export type PathJourneyCourse = PathJourney['courses'][number];

export type GetEarnedCertificatesRequest = (typeof classroomio.organization)['certificates']['$get'];
export type GetEarnedCertificatesSuccess = Extract<InferResponseType<GetEarnedCertificatesRequest>, { success: true }>;
export type EarnedCertificates = GetEarnedCertificatesSuccess['data'];
export type EarnedCertificate = EarnedCertificates[number];
export type EarnedCertificatesPagination = GetEarnedCertificatesSuccess['pagination'];
export type EarnedCertificatesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};
