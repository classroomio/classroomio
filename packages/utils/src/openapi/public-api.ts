export const PUBLIC_API_BASE_URL = 'https://api.classroomio.com/public-api/v1';
export const PUBLIC_API_OPENAPI_URL = 'https://api.cdn.clsrio.com/openapi/public-api/openapi-latest.json';
export const PUBLIC_API_BEARER_SCHEME = 'bearerAuth';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

export const PUBLIC_API_OPENAPI_DESCRIPTION = `Use the ClassroomIO public API to manage audience members and courses with organization-scoped API keys.

# Authentication

All public API endpoints require an **organization-scoped API key** sent as a Bearer token.

## Get an API key

1. Sign in to [ClassroomIO](https://app.classroomio.com) as an **organization admin**.
2. In the org sidebar, open the **Automation** section, then **API** (\`app.classroomio.com/org/*/api\`, where \`*\` is automatically your current organization).
3. Click **Generate API key** and copy the secret immediately (it is shown only once).
4. Keys look like \`cio_api_...\` and include the \`public_api:*\` scope.

## Send requests

Add the key to every request:

\`\`\`
Authorization: Bearer cio_api_your_key_here
\`\`\`

Base URL: \`${PUBLIC_API_BASE_URL}\`

## Try requests in this reference

Use the **Authorize** button (lock icon) on this page, choose **bearerAuth**, paste your full API key, then run **Try it** on any endpoint.

## Plan access

> **Paid Access** — On ClassroomIO Cloud, API key creation is available on **Early Adopter** and **Enterprise** plans. Self-hosted deployments require **Enterprise**.

# HTTP methods

The public API uses standard HTTP verbs:

| Method | Use | Example |
| --- | --- | --- |
| \`GET\` | Fetch a resource or list | \`GET /public-api/v1/courses\` |
| \`POST\` | Create a resource | \`POST /public-api/v1/audience\` |
| \`PUT\` | Replace or update a resource | \`PUT /public-api/v1/courses/{courseId}\` |
| \`DELETE\` | Remove a resource | \`DELETE /public-api/v1/audience/{memberId}\` |

# Pagination

List endpoints (\`GET /courses\`, \`GET /audience\`) accept:

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| \`page\` | integer | \`1\` | 1-indexed |
| \`limit\` | integer | \`20\` | Maximum \`100\` |

Responses wrap results in a shared shape:

\`\`\`json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
  "query": { "page": 1, "limit": 20 }
}
\`\`\`

\`pagination\` reports the actual result set; \`query\` echoes back the resolved request parameters (including any filters, e.g. \`search\` or \`tags\`).

# Rate limiting

Requests are limited **per API key**: 100 requests per minute. Every response includes:

| Header | Meaning |
| --- | --- |
| \`X-RateLimit-Limit\` | Requests allowed in the current window |
| \`X-RateLimit-Remaining\` | Requests left in the current window |
| \`X-RateLimit-Reset\` | When the current window resets |

Exceeding the limit returns \`429\` with a \`Retry-After\` header (seconds until you can retry).

# Errors

Failed requests return:

\`\`\`json
{
  "success": false,
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "field": "optional.field.path"
}
\`\`\`

\`field\` is only present for validation errors that can be traced to a specific input.

| Status | Meaning |
| --- | --- |
| \`400\` | Invalid request body or query: \`code\` is \`VALIDATION_ERROR\`, \`field\` identifies the offending input when known |
| \`401\` | Missing or invalid API key |
| \`403\` | The key is missing a required scope, or the organization's plan doesn't allow public API access |
| \`404\` | The requested resource doesn't exist (or doesn't belong to your organization) |
| \`429\` | Rate limit exceeded. See [Rate limiting](#rate-limiting): this response uses a different body, \`{ "error": "Too Many Requests", "message": "...", "retryAfter": 42 }\`, not the shape above |
| \`500\` | Unexpected server error |
`;

type OpenApiDocument = Record<string, unknown>;

/**
 * `PUBLIC_API_BASE_URL`'s pathname, e.g. `/public-api/v1`. Path keys in the spec
 * carry this same prefix (Hono reports each route's full mounted path), so it
 * must be stripped or a client resolves `servers[0].url + path` with the prefix
 * doubled.
 */
const PUBLIC_API_PATH_PREFIX = new URL(PUBLIC_API_BASE_URL).pathname;

function stripBasePathPrefix(paths: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(paths).map(([path, value]) => [
      path.startsWith(PUBLIC_API_PATH_PREFIX) ? path.slice(PUBLIC_API_PATH_PREFIX.length) || '/' : path,
      value
    ])
  );
}

function applySecurityToOperations(paths: Record<string, unknown>) {
  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method];

      if (!operation || typeof operation !== 'object') {
        continue;
      }

      (operation as Record<string, unknown>).security = [{ [PUBLIC_API_BEARER_SCHEME]: [] }];
    }
  }
}

export function enrichPublicApiOpenApiSpec<T extends OpenApiDocument>(spec: T): T {
  const components = (spec.components ?? {}) as Record<string, unknown>;
  const securitySchemes = (components.securitySchemes ?? {}) as Record<string, unknown>;
  const paths = stripBasePathPrefix((spec.paths ?? {}) as Record<string, unknown>);
  const info = (spec.info ?? {}) as Record<string, unknown>;

  applySecurityToOperations(paths);

  return {
    ...spec,
    info: {
      ...info,
      title: typeof info.title === 'string' ? info.title : 'ClassroomIO Public API',
      version: typeof info.version === 'string' ? info.version : '1.0.0',
      description: PUBLIC_API_OPENAPI_DESCRIPTION
    },
    servers: [{ url: PUBLIC_API_BASE_URL, description: 'Public API v1' }],
    paths,
    components: {
      ...components,
      securitySchemes: {
        ...securitySchemes,
        [PUBLIC_API_BEARER_SCHEME]: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description:
            'Organization API key from Automation → API in your org dashboard. Paste the full `cio_api_...` value as the Bearer token.'
        }
      }
    },
    security: [{ [PUBLIC_API_BEARER_SCHEME]: [] }]
  };
}
