import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { AIProvider, type AIProviderConfig } from '@cio/ai-assistant';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Cheap models used specifically for title generation to minimize token cost.
 */
const TITLE_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.ANTHROPIC]: 'claude-haiku-4-5-20251001',
  [AIProvider.GOOGLE]: 'gemini-2.5-flash',
  [AIProvider.MOONSHOT]: 'kimi-k2.6'
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
    case AIProvider.MOONSHOT: {
      const moonshot = createOpenAI({ apiKey: config.apiKey, baseURL: 'https://api.moonshot.cn/v1' });
      return moonshot(modelName);
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

  const systemPrompt =
    "Generate a short, descriptive title (2–5 words) for a chat conversation based on the user's first message. The title must be at least 2 words — never a single word. Return ONLY the title, no quotes, no punctuation at the end.";

  const truncatedMessage = firstMessageText.slice(0, 1000);

  // Gemini 2.5 counts thinking toward maxOutputTokens; disable thinking and allow headroom for the title text.
  const { text } = await generateText(
    providerConfig.provider === AIProvider.GOOGLE
      ? {
          model,
          system: systemPrompt,
          prompt: truncatedMessage,
          maxOutputTokens: 256,
          maxRetries: 0,
          providerOptions: {
            google: { thinkingConfig: { thinkingBudget: 0 } }
          }
        }
      : {
          model,
          system: systemPrompt,
          prompt: truncatedMessage,
          maxOutputTokens: 96,
          maxRetries: 0
        }
  );

  return text.trim().slice(0, 80);
}

const CourseMeta = z.object({
  title: z.string().describe('3–6 word course title, no quotes, no trailing punctuation'),
  description: z.string().describe('20–30 word description of what students will learn')
});

export async function generateCourseMeta(
  prompt: string,
  providerConfig: AIProviderConfig
): Promise<{ title: string; description: string }> {
  const model = createTitleModel(providerConfig);

  const { object } = await generateObject({
    model,
    schema: CourseMeta,
    system:
      "You are helping create an online course. Based on the user's course idea, generate a short title (3–6 words, no quotes, no trailing punctuation) and a concise description (20–30 words) explaining what students will learn.",
    prompt: prompt.slice(0, 1000),
    maxRetries: 0
  });

  return {
    title: object.title.trim().slice(0, 100),
    description: object.description.trim().slice(0, 300)
  };
}
