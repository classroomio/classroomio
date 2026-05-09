/**
 * Shared registry of LLM models the AI assistant can use.
 *
 * - `AGENT_MODELS` is the full set the backend supports.
 * - `UI_PICKER_MODEL_IDS` is the subset shown in the dashboard model picker.
 *   Anthropic stays in `AGENT_MODELS` so backend code paths keep working
 *   even though it isn't currently exposed to users.
 */

export const AGENT_MODEL_IDS = ['gemini-2.5-flash', 'gpt-5.4-mini', 'claude-sonnet-3-5', 'kimi-k2.6'] as const;

export type AgentModelId = (typeof AGENT_MODEL_IDS)[number];
export type AgentModelProvider = 'google' | 'openai' | 'anthropic' | 'moonshot';
export type AgentModelCostTier = 'low' | 'high';

export interface AgentModelDescriptor {
  provider: AgentModelProvider;
  label: string;
  /** The exact model id passed to the provider SDK. */
  backendModelId: string;
  /** Whether this model is available on the free plan. */
  isFree: boolean;
  /** Cost tier shown in the model picker — 'low' ($) or 'high' ($$$). */
  costTier: AgentModelCostTier;
}

export const AGENT_MODELS: Record<AgentModelId, AgentModelDescriptor> = {
  'gemini-2.5-flash': {
    provider: 'google',
    label: 'Gemini 2.5 Flash',
    backendModelId: 'gemini-2.5-flash',
    isFree: true,
    costTier: 'low'
  },
  'gpt-5.4-mini': {
    provider: 'openai',
    label: 'GPT-5.4 Mini',
    backendModelId: 'gpt-5.4-mini',
    isFree: false,
    costTier: 'low'
  },
  'claude-sonnet-3-5': {
    provider: 'anthropic',
    label: 'Claude Sonnet 4.6',
    backendModelId: 'claude-sonnet-4-6',
    isFree: false,
    costTier: 'high'
  },
  'kimi-k2.6': {
    provider: 'moonshot',
    label: 'Kimi K2.6',
    backendModelId: 'kimi-k2.6',
    isFree: true,
    costTier: 'low'
  }
};

export const UI_PICKER_MODEL_IDS = [
  'gemini-2.5-flash',
  'kimi-k2.6',
  'gpt-5.4-mini',
  'claude-sonnet-3-5'
] as const satisfies readonly AgentModelId[];

export const DEFAULT_PICKER_MODEL_ID: AgentModelId = 'gemini-2.5-flash';
