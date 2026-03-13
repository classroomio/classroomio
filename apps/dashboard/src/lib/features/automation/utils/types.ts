import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListAutomationKeysRequest = (typeof classroomio.organization)['automation']['keys']['$get'];
export type CreateAutomationKeyRequest = (typeof classroomio.organization)['automation']['keys']['$post'];
export type RevokeAutomationKeyRequest = (typeof classroomio.organization)['automation']['keys'][':keyId']['$delete'];
export type RotateAutomationKeyRequest =
  (typeof classroomio.organization)['automation']['keys'][':keyId']['rotate']['$post'];

export type ListAutomationKeysSuccess = Extract<InferResponseType<ListAutomationKeysRequest>, { success: true }>;
export type CreateAutomationKeySuccess = Extract<InferResponseType<CreateAutomationKeyRequest>, { success: true }>;
export type RevokeAutomationKeySuccess = Extract<InferResponseType<RevokeAutomationKeyRequest>, { success: true }>;
export type RotateAutomationKeySuccess = Extract<InferResponseType<RotateAutomationKeyRequest>, { success: true }>;

export type AutomationKey = ListAutomationKeysSuccess['data'][number];
export type AutomationKeyType = AutomationKey['type'];
