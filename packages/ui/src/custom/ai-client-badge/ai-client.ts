import { AI_CLIENT_ICON_PATHS } from './ai-client-icons';

export type AiClientKind =
  | 'claude-code'
  | 'claude'
  | 'codex'
  | 'chatgpt'
  | 'cursor'
  | 'opencode'
  | 'copilot'
  | 'vscode'
  | 'gemini-cli'
  | 'goose'
  | 'droid'
  | 'zed'
  | 'warp'
  | 'windsurf'
  | 'devin'
  | 'amp'
  | 'kiro'
  | 'cline'
  | 'grok'
  | 'muse'
  | 'generic';

export interface AiClientInfo {
  kind: AiClientKind;
  label: string;
  iconPath: string | null;
}

const KNOWN_CLIENTS: { kind: Exclude<AiClientKind, 'generic'>; label: string; pattern: RegExp }[] = [
  { kind: 'claude-code', label: 'Claude Code', pattern: /claude[\s_-]*code/i },
  { kind: 'claude', label: 'Claude', pattern: /claude|anthropic/i },
  { kind: 'codex', label: 'Codex', pattern: /codex/i },
  { kind: 'chatgpt', label: 'ChatGPT', pattern: /chatgpt|openai/i },
  { kind: 'cursor', label: 'Cursor', pattern: /cursor/i },
  { kind: 'opencode', label: 'OpenCode', pattern: /opencode|open[\s_-]code/i },
  { kind: 'copilot', label: 'GitHub Copilot', pattern: /copilot/i },
  { kind: 'vscode', label: 'VS Code', pattern: /visual[\s_-]*studio[\s_-]*code|vs[\s_-]*code/i },
  { kind: 'gemini-cli', label: 'Gemini CLI', pattern: /gemini/i },
  { kind: 'goose', label: 'Goose', pattern: /\bgoose\b/i },
  { kind: 'droid', label: 'Factory Droid', pattern: /\bdroid\b|factory/i },
  { kind: 'zed', label: 'Zed', pattern: /\bzed\b/i },
  { kind: 'warp', label: 'Warp', pattern: /\bwarp\b/i },
  { kind: 'windsurf', label: 'Windsurf', pattern: /windsurf/i },
  { kind: 'devin', label: 'Devin', pattern: /\bdevin\b/i },
  { kind: 'amp', label: 'Amp', pattern: /\bamp\b/i },
  { kind: 'kiro', label: 'Kiro', pattern: /kiro/i },
  { kind: 'cline', label: 'Cline', pattern: /\bcline\b/i },
  { kind: 'grok', label: 'Grok', pattern: /grok|xai/i },
  { kind: 'muse', label: 'Muse Code', pattern: /\bmuse\b/i }
];

/**
 * Maps a stored client name to the product it belongs to. Matching is case-insensitive and loose, so the
 * names clients really send as MCP `clientInfo.name` (`claude-ai`, `claude-code`, `codex-mcp-client`,
 * `cursor-vscode`, `Visual Studio Code`, `gemini-cli-mcp-client`, `Zed`, `goose-cli`, `openai-mcp`) and OAuth
 * client names all resolve. More specific products are listed before the broader ones they contain.
 * An unrecognised name is `generic` and keeps its own label.
 */
export function resolveAiClient(clientName: string | null | undefined): AiClientInfo {
  const name = clientName ?? '';
  const known = KNOWN_CLIENTS.find(({ pattern }) => pattern.test(name));

  if (!known) return { kind: 'generic', label: name, iconPath: null };

  return { kind: known.kind, label: known.label, iconPath: AI_CLIENT_ICON_PATHS[known.kind] ?? null };
}
