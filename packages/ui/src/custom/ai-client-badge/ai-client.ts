export type AiClientKind = 'claude' | 'chatgpt' | 'generic';

const CLIENT_PATTERNS: { kind: Exclude<AiClientKind, 'generic'>; pattern: RegExp }[] = [
  { kind: 'claude', pattern: /claude|anthropic/i },
  { kind: 'chatgpt', pattern: /chatgpt|openai/i }
];

export const AI_CLIENT_LABELS: Record<Exclude<AiClientKind, 'generic'>, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT'
};

/**
 * Maps a stored client name such as `Claude`, `claude-ai` or `openai-mcp` to the product it belongs to.
 * Matching is case-insensitive and loose; anything unrecognised is `generic`.
 */
export function resolveAiClient(clientName: string | null | undefined): AiClientKind {
  const name = clientName ?? '';

  return CLIENT_PATTERNS.find(({ pattern }) => pattern.test(name))?.kind ?? 'generic';
}
