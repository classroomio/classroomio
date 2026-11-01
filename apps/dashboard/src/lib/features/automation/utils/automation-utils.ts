import type { AutomationKeyType } from './types';
import { PUBLIC_API_BASE_URL } from '@cio/utils/openapi/public-api';

const PUBLIC_API_SETUP_SECRET_PLACEHOLDER = '<paste-your-api-key>';

export const MCP_DOCS_URL = 'https://classroomio.com/docs/developers/mcp';
export const PUBLIC_API_DOCS_URL = 'https://classroomio.com/docs/api';
export const WEBHOOKS_DOCS_URL = 'https://classroomio.com/docs/developers/webhooks';
export const WEBHOOKS_VERIFY_SIGNATURE_DOCS_URL = `${WEBHOOKS_DOCS_URL}#verify-the-signature`;

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

export function getPublicApiGoSnippet(secret: string | null) {
  const apiKey = getPublicApiSetupSecret(secret);

  return `package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	req, err := http.NewRequest(http.MethodGet, "${PUBLIC_API_BASE_URL}/audience", nil)
	if err != nil {
		panic(err)
	}

	req.Header.Set("Authorization", "Bearer ${apiKey}")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		panic(err)
	}

	if res.StatusCode >= 400 {
		panic(fmt.Sprintf("request failed: %s", body))
	}

	var payload struct {
		Data json.RawMessage \`json:"data"\`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		panic(err)
	}

	fmt.Println(string(payload.Data))
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
