import { getContext, setContext } from 'svelte';
import type { UploadLimits } from './upload-limits';

const UPLOAD_LIMITS_CONTEXT_KEY = Symbol('upload-limits');

export function setUploadLimitsContext(limits: UploadLimits) {
  setContext(UPLOAD_LIMITS_CONTEXT_KEY, limits);
}

export function getUploadLimitsContext(): UploadLimits | null {
  return getContext<UploadLimits | null>(UPLOAD_LIMITS_CONTEXT_KEY) ?? null;
}
