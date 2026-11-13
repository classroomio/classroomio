import type { Context } from 'hono';
import { BLOCK_CHANGE_CLIENT_NAME_MAX_LENGTH, type TBlockChangeAttribution } from '@cio/utils/constants/lesson-version';
import type { TOrganizationApiKey } from '@cio/db/types';
import type { AuthSession } from '@api/types/auth';

export const MCP_CLIENT_HEADER = 'x-mcp-client-name';

const CONTROL_CHARACTERS = /\p{Cc}/gu;

/**
 * Cleans a client-supplied name for storage: control characters removed, whitespace collapsed, length capped.
 * @returns null when nothing printable is left.
 */
export function normalizeClientName(raw: string | null | undefined): string | null {
  const name = (raw ?? '').replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();

  return name ? name.slice(0, BLOCK_CHANGE_CLIENT_NAME_MAX_LENGTH) : null;
}

/**
 * Reads the percent-encoded name the MCP server sends. A value that is not valid percent-encoding is used as is.
 */
function decodeClientNameHeader(raw: string | null | undefined): string | null {
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Names the client behind a key request. An MCP client that identified itself (the `clientInfo` a stdio server
 * forwards in a header) wins over the key's label, which the key's creator typed; any other key uses its label.
 */
export function resolveKeyClientName(key: TOrganizationApiKey, mcpClientHeader?: string | null): string | null {
  const reported = key.type === 'mcp' ? normalizeClientName(decodeClientNameHeader(mcpClientHeader)) : null;

  return reported ?? normalizeClientName(key.label);
}

/**
 * Attribution for edits made in this request: the dashboard session writes as a person, and an MCP or
 * public API credential writes as the client it belongs to.
 */
export function getChangeAttribution(c: Context<AuthSession>): TBlockChangeAttribution {
  const automationKey = c.get('automationKey');

  if (!automationKey) return {};

  return { source: automationKey.type === 'mcp' ? 'mcp' : 'api', clientName: c.get('clientName') ?? null };
}
