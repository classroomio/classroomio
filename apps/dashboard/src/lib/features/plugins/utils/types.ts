import { classroomio, type InferRequestType, type InferResponseType } from '$lib/utils/services/api';
import type { PluginCapabilityDefinition } from '@cio/sdk';

// Capabilities API
export type GetOrgCapabilitiesRequest = typeof classroomio.plugins.capabilities.$get;
export type UpdateOrgCapabilityRequest = (typeof classroomio.plugins.capabilities)[':capabilityId']['$put'];

export type GetCapabilitiesSuccess = Extract<InferResponseType<GetOrgCapabilitiesRequest>, { success: true }>;
export type EnabledCapabilityIds = GetCapabilitiesSuccess['data'];

export interface OrgCapabilityItem extends PluginCapabilityDefinition {
  isEnabled: boolean;
}

// Certificate Studio Presets API
export type GetCertPresetsRequest = (typeof classroomio.plugins)['certificate-studio']['presets']['$get'];
export type GetCertPresetRequest = (typeof classroomio.plugins)['certificate-studio']['presets'][':presetId']['$get'];
export type CreateCertPresetRequest = (typeof classroomio.plugins)['certificate-studio']['presets']['$post'];
export type UpdateCertPresetRequest =
  (typeof classroomio.plugins)['certificate-studio']['presets'][':presetId']['$put'];
export type DeleteCertPresetRequest =
  (typeof classroomio.plugins)['certificate-studio']['presets'][':presetId']['$delete'];

export type CreateCertPresetPayload = InferRequestType<CreateCertPresetRequest>['json'];
export type UpdateCertPresetPayload = InferRequestType<UpdateCertPresetRequest>['json'];

export type GetCertPresetsSuccess = Extract<InferResponseType<GetCertPresetsRequest>, { success: true }>;
export type OrgCertificatePreset = GetCertPresetsSuccess['data'][number];

// Course Apply Preset API
export type ApplyCertPresetRequest = (typeof classroomio.course)[':courseId']['certificate']['apply-preset']['$post'];
