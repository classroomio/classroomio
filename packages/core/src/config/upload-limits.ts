import { env } from './env';
import { resolveUploadLimits } from '@cio/utils/config/upload-limits';

export type { UploadLimits } from '@cio/utils/config/upload-limits';

export function getUploadLimits() {
  return resolveUploadLimits(env);
}
