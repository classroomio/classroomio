import { pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';

/**
 * True when onboarding can call a model: AI is not switched off and at least one provider key is configured.
 */
export function isOnboardingAiAvailable(): boolean {
  if (process.env.PUBLIC_IS_AI_ENABLED === 'false') return false;

  return pickAnyConfiguredProvider() !== null;
}

/**
 * True when a website answer can build full courses from the site on the jobs worker: AI is on and there is a Claude
 * key. Without one (for example a self-hosted install with another provider) onboarding falls back to starter drafts.
 */
export function isCourseBuildAvailable(): boolean {
  if (process.env.PUBLIC_IS_AI_ENABLED === 'false') return false;

  return Boolean(process.env.ANTHROPIC_API_KEY);
}
