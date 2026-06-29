import { env } from './env';
import { resolveUploadLimits, type UploadLimits } from '@cio/utils/config/upload-limits';

export type { UploadLimits } from '@cio/utils/config/upload-limits';

let cachedLimits: UploadLimits | null = null;

export function getUploadLimits(): UploadLimits {
  if (cachedLimits) {
    return cachedLimits;
  }

  cachedLimits = resolveUploadLimits(env);
  return cachedLimits;
}
