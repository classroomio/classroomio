/**
 * Fetches the public API OpenAPI spec from R2 and enriches it with the bearer
 * auth scheme, so Blume can render the API reference statically at build time.
 *
 * This replaces the old SSR route that fetched the spec on every request. The
 * page now refreshes when the docs are rebuilt — .github/workflows/upload-openapi-spec.yml
 * triggers a docs deploy after it publishes a new spec.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  enrichPublicApiOpenApiSpec,
  PUBLIC_API_OPENAPI_URL
} from '@cio/utils/openapi/public-api';

const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../openapi/public-api.json'
);

const response = await fetch(PUBLIC_API_OPENAPI_URL);

if (!response.ok) {
  throw new Error(
    `Failed to fetch the OpenAPI spec from ${PUBLIC_API_OPENAPI_URL}: ${response.status} ${response.statusText}`
  );
}

const spec = enrichPublicApiOpenApiSpec(await response.json());

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`[docs] Wrote enriched OpenAPI spec to ${OUTPUT}`);
