import { classroomio, type InferResponseType } from '$lib/utils/services/api';

// Capabilities API
export type GetOrgCapabilitiesRequest = typeof classroomio.plugins.capabilities.$get;
export type UpdateOrgCapabilityRequest = (typeof classroomio.plugins.capabilities)[':capabilityId']['$put'];

export type GetCapabilitiesSuccess = Extract<InferResponseType<GetOrgCapabilitiesRequest>, { success: true }>;
export type OrgCapabilityItem = GetCapabilitiesSuccess['data'][number];

// Certificate Studio Presets API
export type GetCertPresetsRequest = (typeof classroomio.plugins)['certificate-studio']['presets']['$get'];
export type GetCertPresetRequest = (typeof classroomio.plugins)['certificate-studio']['presets'][':presetId']['$get'];
export type CreateCertPresetRequest = (typeof classroomio.plugins)['certificate-studio']['presets']['$post'];
export type UpdateCertPresetRequest =
  (typeof classroomio.plugins)['certificate-studio']['presets'][':presetId']['$put'];
export type DeleteCertPresetRequest =
  (typeof classroomio.plugins)['certificate-studio']['presets'][':presetId']['$delete'];

export type GetCertPresetsSuccess = Extract<InferResponseType<GetCertPresetsRequest>, { success: true }>;
export type OrgCertificatePreset = GetCertPresetsSuccess['data'][number];

// Course Apply Preset API
export type ApplyCertPresetRequest = (typeof classroomio.course)[':courseId']['certificate']['apply-preset']['$post'];
