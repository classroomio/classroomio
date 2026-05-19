import { generateText } from 'ai';
import { AIProvider, type AIProviderConfig, createModel } from '@cio/ai-assistant';

const TEXT_GEN_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.ANTHROPIC]: 'claude-haiku-4-5-20251001',
  [AIProvider.GOOGLE]: 'gemini-3.1-flash-lite',
  [AIProvider.MOONSHOT]: 'kimi-k2.6'
};

export interface GenerateFieldTextResult {
  text: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  modelName: string;
}

export async function generateFieldText(
  prompt: string,
  tone: string,
  format: 'plain' | 'html',
  context: string | undefined,
  providerConfig: AIProviderConfig
): Promise<GenerateFieldTextResult> {
  const modelName = TEXT_GEN_MODELS[providerConfig.provider];
  const model = createModel({ ...providerConfig, model: modelName });

  const contextLine = context ? `Context: ${context}.` : '';
  const formatLine =
    format === 'html'
      ? 'Return valid HTML (use <p>, <ul>, <li>, <strong> tags as appropriate). Never use heading tags (h1, h2, h3, h4, h5, h6). No surrounding code blocks or markdown.'
      : 'Return plain text only — no HTML tags, no markdown, no quotes, no labels.';
  const systemPrompt = [
    'You are a content writer helping build a landing page for an online course platform.',
    `Write text that matches the following description. Use a ${tone} tone.`,
    contextLine,
    formatLine
  ]
    .filter(Boolean)
    .join(' ');

  const { text, usage } = await generateText(
    providerConfig.provider === AIProvider.GOOGLE
      ? {
          model,
          system: systemPrompt,
          prompt: prompt.slice(0, 1000),
          maxOutputTokens: 512,
          maxRetries: 0,
          providerOptions: {
            google: { thinkingConfig: { thinkingBudget: 0 } }
          }
        }
      : {
          model,
          system: systemPrompt,
          prompt: prompt.slice(0, 1000),
          maxOutputTokens: 512,
          maxRetries: 0
        }
  );

  return {
    text: text.trim(),
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0
    },
    modelName
  };
}
