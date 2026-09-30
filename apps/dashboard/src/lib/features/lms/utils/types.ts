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
  status?: 'all' | 'in_progress' | 'completed';
  search?: string;
};

export type GetPathJourneyRequest = (typeof classroomio)['learning-path'][':pathId']['journey']['$get'];
export type GetPathJourneySuccess = Extract<InferResponseType<GetPathJourneyRequest>, { success: true }>;
export type PathJourney = GetPathJourneySuccess['data'];
export type PathJourneyCourse = PathJourney['courses'][number];
export type PathJourneyCertificate = NonNullable<PathJourney['certificate']>;

export type ListMyPathCertificatesRequest = (typeof classroomio.organization)['learning-paths']['certificates']['$get'];
export type ListMyPathCertificatesSuccess = Extract<
  InferResponseType<ListMyPathCertificatesRequest>,
  { success: true }
>;
export type MyPathCertificate = ListMyPathCertificatesSuccess['data'][number];
