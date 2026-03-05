export interface SupportedModel {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: "Google's latest Flash — fast and highly capable",
    recommended: true
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Balanced speed and quality for content work'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: "OpenAI's flagship model — best quality"
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable'
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'Excellent writing quality, very affordable'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Open source, extremely affordable'
  }
];

export const DEFAULT_MODEL = SUPPORTED_MODELS[0].id;

export const SUPPORTED_MODEL_IDS = new Set(SUPPORTED_MODELS.map((m) => m.id));
