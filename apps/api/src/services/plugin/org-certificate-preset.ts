import {
  getOrgCertificatePresets,
  getOrgCertificatePreset,
  createOrgCertificatePreset,
  updateOrgCertificatePreset,
  deactivateOrgCertificatePreset
} from '@cio/db/queries/plugins/org-certificate-preset';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TOrgCertificatePreset } from '@db/types';
import type { TCreateOrgCertificatePreset, TUpdateOrgCertificatePreset } from '@cio/utils/validation/plugins';
import { CERTIFICATE_TEMPLATES } from '@cio/certificates';
import { assertOrgCapabilityEnabled } from './org-capability';

function assertValidRendererId(rendererId: string) {
  const isBuiltIn = CERTIFICATE_TEMPLATES.some((t) => t.id === rendererId);

  if (!isBuiltIn) {
    throw new AppError(`Unknown certificate renderer "${rendererId}"`, ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/**
 * Lists all active custom certificate presets for an organization.
 */
export async function listOrgCertificatePresetsService(
  orgId: string,
  includeInactive = false
): Promise<TOrgCertificatePreset[]> {
  if (!orgId) {
    throw new AppError('Organization ID is required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return getOrgCertificatePresets(orgId, includeInactive);
}

/**
 * Gets a single certificate preset within an organization.
 */
export async function getOrgCertificatePresetService(orgId: string, presetId: string): Promise<TOrgCertificatePreset> {
  if (!orgId || !presetId) {
    throw new AppError('Organization ID and preset ID are required', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const preset = await getOrgCertificatePreset(orgId, presetId);

  if (!preset) {
    throw new AppError('Certificate preset not found', ErrorCodes.NOT_FOUND, 404);
  }

  return preset;
}

/**
 * Creates a new certificate preset for an organization.
 * Asserts that the Certificate Studio capability is active.
 */
export async function createOrgCertificatePresetService(
  orgId: string,
  userId: string,
  data: TCreateOrgCertificatePreset
): Promise<TOrgCertificatePreset> {
  await assertOrgCapabilityEnabled(orgId, 'certificate_studio');

  const rendererId = data.design.rendererTemplateId ?? data.design.templateId;
  if (rendererId) {
    assertValidRendererId(rendererId);
  }

  const preset = await createOrgCertificatePreset({
    orgId,
    createdBy: userId,
    name: data.name,
    description: data.description ?? null,
    design: data.design
  });

  return preset;
}

/**
 * Updates an existing certificate preset.
 * Asserts that the Certificate Studio capability is active.
 */
export async function updateOrgCertificatePresetService(
  orgId: string,
  presetId: string,
  data: TUpdateOrgCertificatePreset
): Promise<TOrgCertificatePreset> {
  await assertOrgCapabilityEnabled(orgId, 'certificate_studio');

  const existing = await getOrgCertificatePreset(orgId, presetId);

  if (!existing) {
    throw new AppError('Certificate preset not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (data.design) {
    const rendererId = data.design.rendererTemplateId ?? data.design.templateId;
    if (rendererId) {
      assertValidRendererId(rendererId);
    }
  }

  const updated = await updateOrgCertificatePreset(orgId, presetId, {
    name: data.name,
    description: data.description === null ? undefined : (data.description ?? undefined),
    design: data.design
  });

  if (!updated) {
    throw new AppError('Failed to update certificate preset', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return updated;
}

/**
 * Soft-deletes a certificate preset (marks isActive=false).
 * Asserts that the Certificate Studio capability is active.
 * The preset is never hard-deleted so existing course snapshots are preserved.
 */
export async function deleteOrgCertificatePresetService(orgId: string, presetId: string): Promise<void> {
  await assertOrgCapabilityEnabled(orgId, 'certificate_studio');

  const existing = await getOrgCertificatePreset(orgId, presetId);

  if (!existing) {
    throw new AppError('Certificate preset not found', ErrorCodes.NOT_FOUND, 404);
  }

  await deactivateOrgCertificatePreset(orgId, presetId);
}
