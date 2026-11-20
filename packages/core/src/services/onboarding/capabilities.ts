import { pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';

/**
 * True when onboarding can call a model: AI is not switched off and at least one provider key is configured.
 */
export function isOnboardingAiAvailable(): boolean {
  if (process.env.PUBLIC_IS_AI_ENABLED === 'false') return false;

  return pickAnyConfiguredProvider() !== null;
}
