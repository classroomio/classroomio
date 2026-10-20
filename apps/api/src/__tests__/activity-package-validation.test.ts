import { describe, expect, it } from 'vitest';

import { resolveUploadLimits, UPLOAD_DEFAULT_SCORM_MB } from '@cio/utils/config/upload-limits';
import { getLicenseFeaturesForPlan } from '@cio/utils/license/plan-features';
import { LICENSE_FEATURE } from '@cio/utils/license/constants';
import { PLAN } from '@cio/utils/plans/constants';
import { ALLOWED_SCORM_TYPES, isAllowedScormMimeType } from '@cio/utils/validation/constants';
import {
  ZPackageCreate,
  ZPackageMakeCurrent,
  ZPackageParam,
  ZPackageVersionParam
} from '@cio/utils/validation/activity/package';

describe('activity package validation', () => {
  it('accepts zip mime types and an empty type', () => {
    expect(ALLOWED_SCORM_TYPES).toContain('application/zip');
    expect(ALLOWED_SCORM_TYPES).toContain('application/x-zip-compressed');
    expect(isAllowedScormMimeType('application/zip')).toBe(true);
    expect(isAllowedScormMimeType('application/x-zip-compressed')).toBe(true);
    expect(isAllowedScormMimeType('')).toBe(true);
    expect(isAllowedScormMimeType(null)).toBe(true);
    expect(isAllowedScormMimeType(undefined)).toBe(true);
  });

  it('rejects non-zip mime types', () => {
    expect(isAllowedScormMimeType('application/pdf')).toBe(false);
    expect(isAllowedScormMimeType('video/mp4')).toBe(false);
  });

  it('defaults the SCORM limit to 500 MB with an env override', () => {
    expect(UPLOAD_DEFAULT_SCORM_MB).toBe(500);
    expect(resolveUploadLimits({}).scormMb).toBe(500);
    expect(resolveUploadLimits({}).scormBytes).toBe(500 * 1024 * 1024);
    expect(resolveUploadLimits({ UPLOAD_MAX_SCORM_MB: '100' }).scormMb).toBe(100);
    expect(resolveUploadLimits({ UPLOAD_MAX_SCORM_MB: '0' }).scormMb).toBe(500);
  });

  it('maps SCORM to every paid cloud plan', () => {
    expect(getLicenseFeaturesForPlan(PLAN.BASIC)).not.toContain(LICENSE_FEATURE.SCORM);
    expect(getLicenseFeaturesForPlan(null)).not.toContain(LICENSE_FEATURE.SCORM);
    expect(getLicenseFeaturesForPlan(PLAN.EARLY_ADOPTER)).toContain(LICENSE_FEATURE.SCORM);
    expect(getLicenseFeaturesForPlan(PLAN.ENTERPRISE)).toContain(LICENSE_FEATURE.SCORM);
  });

  it('validates package creation input', () => {
    const valid = ZPackageCreate.safeParse({ fileName: 'course.zip', fileSize: 1024 });
    expect(valid.success).toBe(true);

    expect(ZPackageCreate.safeParse({ fileName: 'course.pdf', fileSize: 1024 }).success).toBe(false);
    expect(ZPackageCreate.safeParse({ fileName: 'course.zip', fileSize: 0 }).success).toBe(false);
    expect(ZPackageCreate.safeParse({ fileName: '', fileSize: 1024 }).success).toBe(false);
  });

  it('validates package route params', () => {
    expect(ZPackageParam.safeParse({ assetId: 'asset-1' }).success).toBe(true);
    expect(ZPackageParam.safeParse({}).success).toBe(false);
    expect(ZPackageVersionParam.safeParse({ assetId: 'a', versionId: 'v' }).success).toBe(true);
    expect(ZPackageVersionParam.safeParse({ assetId: 'a' }).success).toBe(false);
    expect(ZPackageMakeCurrent.safeParse({}).data).toEqual({ closeOpenAttempts: false });
    expect(ZPackageMakeCurrent.safeParse({ closeOpenAttempts: true }).success).toBe(true);
  });
});
