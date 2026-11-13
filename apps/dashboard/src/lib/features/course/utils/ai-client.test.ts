import { describe, expect, it } from 'vitest';

import { resolveAiClient } from '@cio/ui/custom/ai-client-badge/ai-client';

const REAL_LOGO = [
  ['claude-ai', 'claude', 'Claude'],
  ['Anthropic', 'claude', 'Claude'],
  ['claude-code', 'claude-code', 'Claude Code'],
  ['openai-mcp', 'chatgpt', 'ChatGPT'],
  ['ChatGPT', 'chatgpt', 'ChatGPT'],
  ['cursor-vscode', 'cursor', 'Cursor'],
  ['opencode', 'opencode', 'OpenCode'],
  ['github-copilot-developer', 'copilot', 'GitHub Copilot'],
  ['copilot-cli', 'copilot', 'GitHub Copilot'],
  ['gemini-cli-mcp-client', 'gemini-cli', 'Gemini CLI'],
  ['Zed', 'zed', 'Zed'],
  ['warp', 'warp', 'Warp'],
  ['Windsurf', 'windsurf', 'Windsurf'],
  ['windsurf-client', 'windsurf', 'Windsurf'],
  ['amp', 'amp', 'Amp'],
  ['Cline', 'cline', 'Cline']
] as const;

const MONOGRAM = [
  ['codex-mcp-client', 'codex', 'Codex'],
  ['openai-mcp (Codex)', 'codex', 'Codex'],
  ['Visual Studio Code', 'vscode', 'VS Code'],
  ['goose-cli', 'goose', 'Goose'],
  ['goose-desktop', 'goose', 'Goose'],
  ['Factory Droid', 'droid', 'Factory Droid'],
  ['Devin', 'devin', 'Devin'],
  ['kiro-cli', 'kiro', 'Kiro'],
  ['Grok Build', 'grok', 'Grok'],
  ['Muse Code', 'muse', 'Muse Code']
] as const;

describe('resolveAiClient', () => {
  it.each(REAL_LOGO)('maps %s to %s with a logo', (name, kind, label) => {
    const client = resolveAiClient(name);

    expect(client.kind).toBe(kind);
    expect(client.label).toBe(label);
    expect(client.iconPath).toBeTruthy();
  });

  it.each(MONOGRAM)('maps %s to %s without a logo', (name, kind, label) => {
    const client = resolveAiClient(name);

    expect(client.kind).toBe(kind);
    expect(client.label).toBe(label);
    expect(client.iconPath).toBeNull();
  });

  it('matches case-insensitively', () => {
    expect(resolveAiClient('CLAUDE CODE').kind).toBe('claude-code');
    expect(resolveAiClient('chatgpt').kind).toBe('chatgpt');
  });

  it('keeps more specific products ahead of the broader ones they contain', () => {
    expect(resolveAiClient('cursor-vscode').kind).toBe('cursor');
    expect(resolveAiClient('claude-code').kind).toBe('claude-code');
    expect(resolveAiClient('openai-mcp (Codex)').kind).toBe('codex');
  });

  it('does not match a product name inside an unrelated word', () => {
    expect(resolveAiClient('authorized-client').kind).toBe('generic');
    expect(resolveAiClient('example').kind).toBe('generic');
    expect(resolveAiClient('android-agent').kind).toBe('generic');
    expect(resolveAiClient('mongoose-client').kind).toBe('generic');
  });

  it.each(['My Custom Agent', '', null, undefined])('falls back to generic for %s', (name) => {
    const client = resolveAiClient(name);

    expect(client.kind).toBe('generic');
    expect(client.label).toBe(name ?? '');
    expect(client.iconPath).toBeNull();
  });
});
