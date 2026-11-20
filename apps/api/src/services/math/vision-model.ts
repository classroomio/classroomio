import { AIProvider, type AIProviderConfig, createModel } from '@cio/ai-assistant';
import { pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { AppError } from '@api/utils/errors';

const VISION_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.ANTHROPIC]: 'claude-haiku-4-5-20251001',
  [AIProvider.GOOGLE]: 'gemini-3.1-flash-lite',
  [AIProvider.MOONSHOT]: 'kimi-k2.6'
};

/** Resolves a vision-capable model from the first configured provider; throws a 503 AppError when none is set up. */
export function getVisionModel() {
  const providerConfig: AIProviderConfig | null = pickAnyConfiguredProvider();
  if (!providerConfig) throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);

  const modelName = VISION_MODELS[providerConfig.provider];

  return {
    provider: providerConfig.provider,
    modelName,
    model: createModel({ ...providerConfig, model: modelName })
  };
}

/** Gemini 3.x counts thinking toward the output budget, so the vision calls switch it off. */
export function getVisionProviderOptions(provider: AIProvider) {
  return provider === AIProvider.GOOGLE ? { google: { thinkingConfig: { thinkingBudget: 0 } } } : undefined;
}
