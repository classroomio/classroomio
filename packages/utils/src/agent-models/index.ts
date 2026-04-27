/**
 * Shared registry of LLM models the AI assistant can use.
 *
 * - `AGENT_MODELS` is the full set the backend supports.
 * - `UI_PICKER_MODEL_IDS` is the subset shown in the dashboard model picker.
 *   Anthropic stays in `AGENT_MODELS` so backend code paths keep working
 *   even though it isn't currently exposed to users.
 */

export const AGENT_MODEL_IDS = ['gemini-2.5-flash', 'gpt-4o', 'claude-sonnet-4-5'] as const;

export type AgentModelId = (typeof AGENT_MODEL_IDS)[number];
export type AgentModelProvider = 'google' | 'openai' | 'anthropic';

export interface AgentModelDescriptor {
  provider: AgentModelProvider;
  label: string;
  /** The exact model id passed to the provider SDK. */
  backendModelId: string;
}

export const AGENT_MODELS: Record<AgentModelId, AgentModelDescriptor> = {
  'gemini-2.5-flash': {
    provider: 'google',
    label: 'Gemini 2.5 Flash',
    backendModelId: 'gemini-2.5-flash'
  },
  'gpt-4o': {
    provider: 'openai',
    label: 'GPT-4o',
    backendModelId: 'gpt-4o'
  },
  'claude-sonnet-4-5': {
    provider: 'anthropic',
    label: 'Claude Sonnet 4.5',
    backendModelId: 'claude-sonnet-4-5-20250929'
  }
};

export const UI_PICKER_MODEL_IDS = ['gemini-2.5-flash', 'gpt-4o'] as const satisfies readonly AgentModelId[];

export const DEFAULT_PICKER_MODEL_ID: AgentModelId = 'gemini-2.5-flash';
