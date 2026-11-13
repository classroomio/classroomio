import { describe, expect, it } from 'vitest';

import { resolveAiClient } from '@cio/ui/custom/ai-client-badge/ai-client';

describe('resolveAiClient', () => {
  it.each(['Claude', 'claude-ai', 'CLAUDE CODE', 'Anthropic'])('maps %s to Claude', (name) => {
    expect(resolveAiClient(name)).toBe('claude');
  });

  it.each(['ChatGPT', 'chatgpt', 'openai-mcp', 'OpenAI'])('maps %s to ChatGPT', (name) => {
    expect(resolveAiClient(name)).toBe('chatgpt');
  });

  it.each(['Cursor', '', null, undefined])('falls back to generic for %s', (name) => {
    expect(resolveAiClient(name)).toBe('generic');
  });
});
