import { generateText } from 'ai';
import { AIProvider, type AIProviderConfig } from '@cio/ai-assistant';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Cheap models used specifically for title generation to minimize token cost.
 */
const TITLE_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.ANTHROPIC]: 'claude-haiku-4-20250414',
  [AIProvider.GOOGLE]: 'gemini-2.5-flash'
};

function createTitleModel(config: AIProviderConfig) {
  const modelName = TITLE_MODELS[config.provider];

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
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Generates a short conversational title from the user's first message.
 * Uses the cheapest available model to minimize token cost.
 */
export async function generateConversationTitle(
  firstMessageText: string,
  providerConfig: AIProviderConfig
): Promise<string> {
  const model = createTitleModel(providerConfig);

  const { text } = await generateText({
    model,
    system:
      "Generate a short title (max 6 words) for a chat conversation based on the user's first message. Return ONLY the title, no quotes, no punctuation at the end. Be concise and descriptive.",
    prompt: firstMessageText,
    maxOutputTokens: 30
  });

  return text.trim().slice(0, 80);
}
