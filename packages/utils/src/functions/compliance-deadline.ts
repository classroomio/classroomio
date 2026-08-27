/**
 * A published COMPLIANCE course must have a completion deadline.
 * Draft courses, non-compliance types, and downloadable certificates do not require one.
 */
export function isPublishedComplianceMissingDeadline(params: {
  type: string | null | undefined;
  isPublished: boolean | null | undefined;
  deadline: string | null | undefined;
}): boolean {
  if (params.isPublished !== true) {
    return false;
  }

  if (params.type !== 'COMPLIANCE') {
    return false;
  }

  return !params.deadline?.trim();
}

/**
 * Course updates replace the certificate JSON value when `certificate` is sent.
 * If the patch omits `deadline`, the stored deadline is cleared.
 */
export function resolveCourseCertificateDeadline(
  currentDeadline: string | null | undefined,
  certificatePatch: { deadline?: string | null } | null | undefined
): string | null | undefined {
  if (certificatePatch === undefined) {
    return currentDeadline;
  }

  if (certificatePatch === null) {
    return null;
  }

  return certificatePatch.deadline ?? null;
}
