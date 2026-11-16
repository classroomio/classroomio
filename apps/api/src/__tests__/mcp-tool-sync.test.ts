import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { ClassroomIoApiClient, createMcpServer } from '@classroomio/mcp/server';
import { MCP_V1_ROUTE_TOOL_MAP } from '@api/middlewares/v1-mcp-usage';
import { MCP_TOOL_CREDIT_COST } from '@cio/utils/plans';

const README_PATH = path.resolve(__dirname, '../../../../packages/mcp/README.md');

type RegisteredTools = Record<string, unknown>;

function registeredToolNames(includeLocalFileTools: boolean): string[] {
  const apiClient = new ClassroomIoApiClient({
    CLASSROOMIO_API_URL: 'https://api.example.com',
    CLASSROOMIO_API_KEY: 'cio_mcp_test',
    CLASSROOMIO_USER_AGENT: 'test'
  });
  const server = createMcpServer(apiClient, { includeLocalFileTools });
  const registered = (server as unknown as { _registeredTools: RegisteredTools })._registeredTools;

  return Object.keys(registered).sort();
}

function readReadme(): string {
  return readFileSync(README_PATH, 'utf8');
}

function readmeToolSurfaceBullets(): string[] {
  const readme = readReadme();
  const surfaceStart = readme.indexOf('## Tool Surface');
  const surfaceEnd = readme.indexOf('\n## ', surfaceStart + 1);
  const surface = readme.slice(surfaceStart, surfaceEnd);
  const names = [...surface.matchAll(/^\s*- `([a-z][a-z0-9_]*)`\s*$/gm)].map((match) => match[1]!);

  return [...new Set(names)].sort();
}

const REGISTERED_WITHOUT_CREDIT_COST = ['create_lesson', 'update_lesson'];
const CREDIT_COST_WITHOUT_REGISTERED_TOOL = ['create_course_exercise_from_template'];

const remoteTools = registeredToolNames(false);
const allTools = registeredToolNames(true);
const localOnlyTools = allTools.filter((name) => !remoteTools.includes(name));

describe('MCP tool surface stays in sync', () => {
  it('registers tools', () => {
    expect(remoteTools.length).toBeGreaterThan(50);
  });

  it('prices every remotely served tool and no tool that is not registered, bar the known exceptions', () => {
    const priced = Object.keys(MCP_TOOL_CREDIT_COST).filter(
      (name) => !CREDIT_COST_WITHOUT_REGISTERED_TOOL.includes(name)
    );
    const expected = remoteTools.filter((name) => !REGISTERED_WITHOUT_CREDIT_COST.includes(name));

    expect(priced.sort()).toEqual(expected);
  });

  it('keeps the known exceptions honest', () => {
    for (const name of REGISTERED_WITHOUT_CREDIT_COST) {
      expect(remoteTools).toContain(name);
      expect(Object.keys(MCP_TOOL_CREDIT_COST)).not.toContain(name);
    }

    for (const name of CREDIT_COST_WITHOUT_REGISTERED_TOOL) {
      expect(remoteTools).not.toContain(name);
      expect(Object.keys(MCP_TOOL_CREDIT_COST)).toContain(name);
    }
  });

  it('keeps the local-only tools out of the credit table, since they never reach the API', () => {
    for (const name of localOnlyTools) {
      expect(Object.keys(MCP_TOOL_CREDIT_COST)).not.toContain(name);
    }
  });

  it('mentions every registered tool in the package README', () => {
    const readme = readReadme();

    for (const name of allTools) {
      expect(readme, `${name} is missing from packages/mcp/README.md`).toContain(`\`${name}\``);
    }
  });

  it('lists only registered tools in the README tool surface', () => {
    for (const name of readmeToolSurfaceBullets()) {
      expect(allTools, `${name} is listed in packages/mcp/README.md but not registered`).toContain(name);
    }
  });

  it('lists the analytics tools of every page in the README tool surface', () => {
    const documented = readmeToolSurfaceBullets();
    const analyticsTools = allTools.filter((name) => /analytics|academy|overview|compliance|marketing/.test(name));

    for (const name of analyticsTools) {
      expect(documented, `${name} is not listed in the README tool surface`).toContain(name);
    }
  });

  it('routes only to registered tools', () => {
    const routed = Object.values(MCP_V1_ROUTE_TOOL_MAP).flatMap((methods) => Object.values(methods));

    for (const toolName of routed) {
      expect(remoteTools, `${toolName} is routed but not registered`).toContain(toolName);
    }
  });
});
