import type { AiAssistantMessage, AiAssistantMessageMetadata } from './types';

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_TOOL_OUTPUT_CHARS = 2000;

export interface ContextUsage {
  /** Tokens used by the latest model request, or an estimate before the first response */
  usedTokens: number;
  /** Maximum context window size for the model */
  maxTokens: number;
  /** Percentage of context used (0-100) */
  percentage: number;
  /** Whether the context is nearly full (>= threshold) */
  isNearlyFull: boolean;
  /** Whether the context is completely full (>= 100%) */
  isFull: boolean;
}

/** Threshold percentage at which we consider context "nearly full" */
export const CONTEXT_NEARLY_FULL_THRESHOLD = 90;

/** Threshold percentage at which we consider context "full" and block input */
export const CONTEXT_FULL_THRESHOLD = 95;

function getSerializedLength(value: unknown): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === 'string') {
    return value.length;
  }

  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

function estimatePartChars(part: unknown): number {
  if (!part || typeof part !== 'object') {
    return getSerializedLength(part);
  }

  const record = part as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type : '';

  if (type === 'step-start') {
    return 0;
  }

  if (type.startsWith('tool-')) {
    const outputChars =
      record.state === 'output-available' ? Math.min(getSerializedLength(record.output), MAX_TOOL_OUTPUT_CHARS) : 0;

    return type.length + getSerializedLength(record.input) + outputChars + getSerializedLength(record.errorText);
  }

  if (typeof record.text === 'string') {
    return record.text.length;
  }

  return getSerializedLength(record);
}

function estimateContextTokens(messages: AiAssistantMessage[]): number {
  const chars = messages.reduce((messageTotal, message) => {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const partsChars = parts.reduce((partTotal, part) => partTotal + estimatePartChars(part), 0);

    return messageTotal + message.role.length + partsChars;
  }, 0);

  return Math.ceil(chars / APPROX_CHARS_PER_TOKEN);
}

/**
 * Tracks the latest provider-reported request size as the context guard.
 * Do not sum historical usage: every assistant turn can include a full prompt
 * replay, so summing turns overstates current context. The character estimate
 * is only a fallback before the first provider usage report exists.
 */
export function calculateContextUsage(messages: AiAssistantMessage[], contextWindow: number): ContextUsage {
  const latestTokenUsage = [...messages]
    .reverse()
    .map((message) => (message.metadata as AiAssistantMessageMetadata | undefined)?.tokenUsage)
    .find((tokenUsage) => tokenUsage !== undefined);
  const usedTokens = latestTokenUsage?.totalTokens ?? estimateContextTokens(messages);

  const percentage = contextWindow > 0 ? Math.min(100, Math.round((usedTokens / contextWindow) * 100)) : 0;

  return {
    usedTokens,
    maxTokens: contextWindow,
    percentage,
    isNearlyFull: percentage >= CONTEXT_NEARLY_FULL_THRESHOLD,
    isFull: percentage >= CONTEXT_FULL_THRESHOLD
  };
}

/**
 * Formats token count for display (e.g., "125K" for 125000)
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }

  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }

  return tokens.toString();
}
