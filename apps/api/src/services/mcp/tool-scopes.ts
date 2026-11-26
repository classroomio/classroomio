import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';
import { getPublicApiRouteScope } from '@api/middlewares/public-api-scopes';
import { MCP_V1_ROUTE_TOOL_MAP } from '@api/middlewares/v1-mcp-usage';

type TToolRoute = readonly [method: string, path: string];

/** Tools the route map doesn't name, because they share another tool's route or call several routes. */
const ROUTES_OF_UNMAPPED_TOOLS: Record<string, readonly TToolRoute[]> = {
  create_lesson: [
    ['POST', '/public-api/v1/courses/:courseId/lessons'],
    ['PUT', '/public-api/v1/courses/:courseId/lessons/:lessonId']
  ],
  update_lesson: [['PUT', '/public-api/v1/courses/:courseId/lessons/:lessonId']],
  tag_courses: [
    ['GET', '/public-api/v1/tags'],
    ['POST', '/public-api/v1/tags/groups'],
    ['POST', '/public-api/v1/tags'],
    ['PUT', '/public-api/v1/courses/:courseId']
  ]
};

/** Tools that call a dashboard route, listed with the scope that route checks. */
const SCOPES_OF_DASHBOARD_ROUTE_TOOLS: Record<string, readonly TOrganizationApiKeyScope[]> = {
  update_course_landing_page: ['course:write']
};

function addRouteScope(scopesByTool: Map<string, Set<TOrganizationApiKeyScope>>, tool: string, route: TToolRoute) {
  const scope = getPublicApiRouteScope(...route);
  const scopes = scopesByTool.get(tool) ?? new Set<TOrganizationApiKeyScope>();
  if (scope) scopes.add(scope);
  scopesByTool.set(tool, scopes);
}

function buildMcpToolScopes(): ReadonlyMap<string, ReadonlySet<TOrganizationApiKeyScope>> {
  const scopesByTool = new Map<string, Set<TOrganizationApiKeyScope>>();

  for (const [path, methods] of Object.entries(MCP_V1_ROUTE_TOOL_MAP)) {
    for (const [method, tool] of Object.entries(methods)) {
      if (tool) addRouteScope(scopesByTool, tool, [method, path]);
    }
  }

  for (const [tool, routes] of Object.entries(ROUTES_OF_UNMAPPED_TOOLS)) {
    for (const route of routes) addRouteScope(scopesByTool, tool, route);
  }

  for (const [tool, scopes] of Object.entries(SCOPES_OF_DASHBOARD_ROUTE_TOOLS)) {
    scopesByTool.set(tool, new Set(scopes));
  }

  return scopesByTool;
}

/** The scopes each MCP tool needs, from the same route rules the public API enforces. */
export const MCP_TOOL_SCOPES = buildMcpToolScopes();

/** Whether a credential with these scopes can use the tool; a tool with no known scope is hidden. */
export function isMcpToolAllowedForScopes(toolName: string, keyScopes: readonly string[]): boolean {
  if (keyScopes.includes('public_api:*')) return true;

  const required = MCP_TOOL_SCOPES.get(toolName);
  if (!required || required.size === 0) return false;

  return [...required].every((scope) => keyScopes.includes(scope));
}
