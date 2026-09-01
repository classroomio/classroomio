export const PUBLIC_API_BASE_URL = 'https://api.classroomio.com/public-api/v1';
export const PUBLIC_API_OPENAPI_URL = 'https://api.cdn.clsrio.com/openapi/public-api/openapi-latest.json';
export const PUBLIC_API_BEARER_SCHEME = 'bearerAuth';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

export const PUBLIC_API_OPENAPI_DESCRIPTION = `Use the ClassroomIO public API to manage audience members and courses with organization-scoped API keys.

# Authentication

All public API endpoints require an **organization-scoped API key** sent as a Bearer token.

## Get an API key

1. Sign in to [ClassroomIO](https://app.classroomio.com) as an **organization admin**.
2. In the org sidebar, open the **Automation** section, then **API** ([/org/*/api](https://app.classroomio.com/org/*/api) — \`*\` picks your current organization automatically).
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

## Rate limits

Requests to this API are rate limited per API key: **100 requests per minute** per key. A separate API key has its own budget, so traffic from one key does not affect another. Requests over the limit receive a \`429 Too Many Requests\` response with a \`Retry-After\` header.

Two caveats to be aware of:

- Rate limiting is only enforced when the API runs with NODE_ENV=production; it is disabled in development and test environments. This applies regardless of hosting a self-hosted production deployment with Redis available does enforce the per-key budget.
- If the shared Redis store is unavailable, requests are served without rate limiting (fail open).

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

// hono-openapi sets `description` per operation but never `summary`. Scalar's
// endpoint list prefers `summary` and falls back to the raw path when it's
// missing — since every path here starts with `/public-api/v1/...`, every
// entry in the reference's sidebar rendered as a near-duplicate route string.
// Keyed by "METHOD /path" (the exact template, including `{param}` braces).
const OPERATION_SUMMARIES: Record<string, string> = {
  'GET /public-api/v1/audience': 'List audience members',
  'POST /public-api/v1/audience': 'Invite an audience member',
  'POST /public-api/v1/audience/assign-courses': 'Assign members to courses',
  'GET /public-api/v1/audience/{memberId}': 'Get an audience member',
  'PUT /public-api/v1/audience/{memberId}': "Update a member's email",
  'DELETE /public-api/v1/audience/{memberId}': 'Remove an audience member',
  'GET /public-api/v1/courses': 'List courses',
  'POST /public-api/v1/courses': 'Create a course',
  'GET /public-api/v1/courses/{courseId}': 'Get a course',
  'PUT /public-api/v1/courses/{courseId}': 'Update a course',
  'DELETE /public-api/v1/courses/{courseId}': 'Delete a course',
  'GET /public-api/v1/courses/{courseId}/students': 'List course students',
  'GET /public-api/v1/courses/{courseId}/export': 'Export course structure',
  'GET /public-api/v1/courses/{courseId}/structure': 'Get course structure',
  'PUT /public-api/v1/courses/{courseId}/structure': 'Sync course structure'
};

// Scalar groups its sidebar by tag when the spec declares top-level `tags`
// with descriptions; without this, operations list flat with no section
// headers at all.
const OPERATION_TAGS = [
  {
    name: 'Public API Audience',
    description:
      "Manage your organization's audience — invite, assign to courses, update, and remove members."
  },
  {
    name: 'Public API Courses',
    description: 'Create and manage courses, read their structure, and list enrolled students.'
  }
];

function applySummariesToOperations(paths: Record<string, unknown>) {
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method];

      if (!operation || typeof operation !== 'object') {
        continue;
      }

      const summary = OPERATION_SUMMARIES[`${method.toUpperCase()} ${path}`];
      if (summary && !(operation as Record<string, unknown>).summary) {
        (operation as Record<string, unknown>).summary = summary;
      }
    }
  }
}

export function enrichPublicApiOpenApiSpec<T extends OpenApiDocument>(spec: T): T {
  const components = (spec.components ?? {}) as Record<string, unknown>;
  const securitySchemes = (components.securitySchemes ?? {}) as Record<string, unknown>;
  const paths = (spec.paths ?? {}) as Record<string, unknown>;
  const info = (spec.info ?? {}) as Record<string, unknown>;
  const tags = (spec.tags ?? []) as Array<{ name: string }>;
  const existingTagNames = new Set(tags.map((tag) => tag.name));

  applySecurityToOperations(paths);
  applySummariesToOperations(paths);

  return {
    ...spec,
    info: {
      ...info,
      title: typeof info.title === 'string' ? info.title : 'ClassroomIO Public API',
      version: typeof info.version === 'string' ? info.version : '1.0.0',
      description: PUBLIC_API_OPENAPI_DESCRIPTION
    },
    paths,
    tags: [...tags, ...OPERATION_TAGS.filter((tag) => !existingTagNames.has(tag.name))],
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
