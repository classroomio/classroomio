import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { AIProvider, type AIProviderConfig } from '../types';

const DEFAULT_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-5.4-mini',
  [AIProvider.ANTHROPIC]: 'claude-sonnet-4-20250514',
  [AIProvider.GOOGLE]: 'gemini-3.1-flash-lite',
  [AIProvider.MOONSHOT]: 'kimi-k2.6'
};

const PROVIDER_API_KEY_ENV: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'OPENAI_API_KEY',
  [AIProvider.ANTHROPIC]: 'ANTHROPIC_API_KEY',
  [AIProvider.GOOGLE]: 'GOOGLE_API_KEY',
  [AIProvider.MOONSHOT]: 'MOONSHOT_API_KEY'
};

/**
 * Creates an AI SDK LanguageModel from provider configuration.
 * Normalizes OpenAI, Anthropic, and Google into a single interface for streamText().
 */
export function createModel(config: AIProviderConfig) {
  const modelName = config.model || DEFAULT_MODELS[config.provider];

  switch (config.provider) {
    case AIProvider.OPENAI: {
      const openai = createOpenAI({ apiKey: config.apiKey });
      return openai(modelName);
    }
    case AIProvider.ANTHROPIC: {
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      return anthropic(modelName);
    }
    case AIProvider.GOOGLE: {
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
      return google(modelName);
    }
    case AIProvider.MOONSHOT: {
      const moonshot = createMoonshotAI({ apiKey: config.apiKey });
      return moonshot(modelName);
    }
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Reads the API key for a specific provider from its dedicated env var.
 * Returns null when the key is unset, so callers can decide whether to 503.
 */
export function getProviderConfigForProvider(provider: AIProvider): AIProviderConfig | null {
  const apiKey = process.env[PROVIDER_API_KEY_ENV[provider]];
  if (!apiKey) return null;

  return { provider, apiKey };
}

/**
 * Returns the first provider that has a key configured, in preference order.
 * Used by routes that don't take an explicit model (status check, title generation).
 */
export function pickAnyConfiguredProvider(): AIProviderConfig | null {
  const order: AIProvider[] = [AIProvider.GOOGLE, AIProvider.OPENAI, AIProvider.ANTHROPIC];

  for (const provider of order) {
    const config = getProviderConfigForProvider(provider);
    if (config) return config;
  }

  return null;
}
