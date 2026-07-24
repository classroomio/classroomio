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

## Plan access

> **Paid Access** — On ClassroomIO Cloud, API key creation is available on **Early Adopter** and **Enterprise** plans. Self-hosted deployments require **Enterprise**.
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

export function enrichPublicApiOpenApiSpec<T extends OpenApiDocument>(spec: T): T {
  const components = (spec.components ?? {}) as Record<string, unknown>;
  const securitySchemes = (components.securitySchemes ?? {}) as Record<string, unknown>;
  const paths = (spec.paths ?? {}) as Record<string, unknown>;
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
