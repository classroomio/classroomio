import type { AutomationKeyType } from './types';
import { PUBLIC_API_BASE_URL } from '@cio/utils/openapi/public-api';

const PUBLIC_API_SETUP_SECRET_PLACEHOLDER = '<paste-your-api-key>';

function getServerPath() {
  return 'npx -y @classroomio/mcp';
}

export function getPublicApiSetupSecret(secret: string | null) {
  return secret ?? PUBLIC_API_SETUP_SECRET_PLACEHOLDER;
}

export function getPublicApiCurlSnippet(secret: string | null) {
  const apiKey = getPublicApiSetupSecret(secret);

  return `curl ${PUBLIC_API_BASE_URL}/audience \\
  -H "Authorization: Bearer ${apiKey}"`;
}

export function getPublicApiJavaScriptSnippet(secret: string | null) {
  const apiKey = getPublicApiSetupSecret(secret);

  return `const response = await fetch('${PUBLIC_API_BASE_URL}/audience', {
  headers: {
    Authorization: 'Bearer ${apiKey}'
  }
});

const { data } = await response.json();
console.log(data);`;
}

export function getPublicApiPythonSnippet(secret: string | null) {
  const apiKey = getPublicApiSetupSecret(secret);

  return `import requests

response = requests.get(
    "${PUBLIC_API_BASE_URL}/audience",
    headers={"Authorization": f"Bearer ${apiKey}"},
)
response.raise_for_status()

data = response.json()["data"]
print(data)`;
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

export function getOpenCodeSnippet(secret: string | null) {
  const apiKey = getAutomationSetupSecret(secret);

  return `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "classroomio": {
      "type": "local",
      "command": ["npx", "-y", "@classroomio/mcp"],
      "enabled": true,
      "environment": {
        "CLASSROOMIO_API_URL": "https://api.classroomio.com",
        "CLASSROOMIO_API_KEY": "${apiKey}"
      }
    }
  }
}`;
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
