import type { AutomationKeyType } from './types';

function getServerPath() {
  return 'npx -y @classroomio/mcp';
}

export function getAutomationSetupSecret(secret: string | null) {
  return secret ?? '<paste-your-mcp-key>';
}

export function getClaudeCodeSnippet(secret: string | null) {
  const apiKey = getAutomationSetupSecret(secret);

  return `claude mcp add-json classroomio '{
  "command": "npx",
  "args": ["-y", "@classroomio/mcp"],
  "env": {
    "CLASSROOMIO_API_URL": "https://api.classroomio.com",
    "CLASSROOMIO_API_KEY": "${apiKey}"
  }
}'`;
}

export function getCodexSnippet(secret: string | null) {
  const apiKey = getAutomationSetupSecret(secret);

  return `codex mcp add classroomio \\
  --env CLASSROOMIO_API_URL=https://api.classroomio.com \\
  --env CLASSROOMIO_API_KEY=${apiKey} \\
  -- npx -y @classroomio/mcp`;
}

export function getCursorSnippet(secret: string | null) {
  const apiKey = getAutomationSetupSecret(secret);

  return `{
  "mcpServers": {
    "classroomio": {
      "command": "npx",
      "args": ["-y", "@classroomio/mcp"],
      "env": {
        "CLASSROOMIO_API_URL": "https://api.classroomio.com",
        "CLASSROOMIO_API_KEY": "${apiKey}"
      }
    }
  }
}`;
}

export function getDefaultAutomationKeyLabel(type: AutomationKeyType) {
  switch (type) {
    case 'mcp':
      return 'ClassroomIO MCP';
    case 'api':
      return 'ClassroomIO API';
    case 'zapier':
      return 'ClassroomIO Zapier';
  }
}

export function getAutomationKeyTypeLabel(type: AutomationKeyType) {
  switch (type) {
    case 'mcp':
      return 'MCP';
    case 'api':
      return 'API';
    case 'zapier':
      return 'Zapier';
  }
}

export function getMaskedAutomationSecret(prefix: string) {
  return `${prefix}...`;
}

export function getCopyableServerCommand() {
  return getServerPath();
}
