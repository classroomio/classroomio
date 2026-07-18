import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type UpdateProfileRequest = typeof classroomio.account.profile.$put;
export type UpdateProfileSuccess = Extract<InferResponseType<UpdateProfileRequest>, { success: true }>;
export type UpdateProfileResponseProfile = UpdateProfileSuccess['profile'];

export type GetUsageRequest = typeof classroomio.agent.usage.$get;
export type GetPurchasedRequest = (typeof classroomio.agent.usage)['purchased']['$get'];
export type GetLeaderboardRequest = (typeof classroomio.agent.usage)['leaderboard']['$get'];

type GetUsageSuccess = Extract<InferResponseType<GetUsageRequest>, { success: true }>;
type GetPurchasedSuccess = Extract<InferResponseType<GetPurchasedRequest>, { success: true }>;
type GetLeaderboardSuccess = Extract<InferResponseType<GetLeaderboardRequest>, { success: true }>;

export type AiUsageData = GetUsageSuccess['data'];
export type PurchasedSummaryData = GetPurchasedSuccess['data'];
export type LeaderboardData = GetLeaderboardSuccess['data'];
export type LeaderboardEntry = LeaderboardData['entries'][number];

export type GetMemberEmailNotificationsRequest =
  (typeof classroomio.organization.member)['email-notifications']['$get'];
export type UpdateMemberEmailNotificationsRequest =
  (typeof classroomio.organization.member)['email-notifications']['$put'];

export type GetMemberEmailNotificationsSuccess = Extract<
  InferResponseType<GetMemberEmailNotificationsRequest>,
  { success: true }
>;
export type MemberEmailNotificationPreferences = GetMemberEmailNotificationsSuccess['data'];
