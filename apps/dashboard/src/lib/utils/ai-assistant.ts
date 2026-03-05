import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

/**
 * Returns true when the AI course assistant is available for the current
 * deployment. The assistant is a cloud-only feature and is disabled when
 * running in self-hosted mode.
 */
export function isAiAssistantAvailable(): boolean {
  return PUBLIC_IS_SELFHOSTED !== 'true';
}
