import { getContext, setContext } from 'svelte';
import { resolveUploadLimits, type UploadLimits } from '@cio/utils/config/upload-limits';
import type { UploadLimits as DashboardUploadLimits } from './upload-limits';

const UPLOAD_LIMITS_CONTEXT_KEY = Symbol('upload-limits');

export function setUploadLimitsContext(limits: DashboardUploadLimits) {
  setContext(UPLOAD_LIMITS_CONTEXT_KEY, limits);
}

export function getUploadLimitsContext(): DashboardUploadLimits | null {
  return getContext<DashboardUploadLimits | null>(UPLOAD_LIMITS_CONTEXT_KEY) ?? null;
}

/** Built-in defaults when layout context is absent (e.g. Storybook, isolated tests). */
export function getDefaultUploadLimits(): UploadLimits {
  return resolveUploadLimits({});
}

/** Layout-provided limits, or built-in defaults outside the dashboard layout tree. */
export function getResolvedUploadLimits(): UploadLimits {
  return getUploadLimitsContext() ?? getDefaultUploadLimits();
}
