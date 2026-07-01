import { getHtmlDocument } from '@scalar/core/libs/html-rendering';
import {
  enrichPublicApiOpenApiSpec,
  PUBLIC_API_BEARER_SCHEME,
  PUBLIC_API_OPENAPI_URL
} from '@cio/utils/openapi/public-api';

export async function loader() {
  const response = await fetch(PUBLIC_API_OPENAPI_URL);

  if (!response.ok) {
    throw new Response('Failed to load the public API OpenAPI specification.', { status: 502 });
  }

  const spec = enrichPublicApiOpenApiSpec((await response.json()) as Record<string, unknown>);

  return new Response(
    getHtmlDocument({
      content: JSON.stringify(spec),
      pageTitle: 'ClassroomIO Public API Reference',
      theme: 'none',
      authentication: {
        preferredSecurityScheme: PUBLIC_API_BEARER_SCHEME
      }
    }),
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300'
      }
    }
  );
}
