/**
 * Fetches the public API OpenAPI spec from R2 and enriches it with the bearer
 * auth scheme, so Blume can render the API reference statically at build time.
 *
 * This replaces the old SSR route that fetched the spec on every request. The
 * page now refreshes when the docs are rebuilt — .github/workflows/upload-openapi-spec.yml
 * triggers a docs deploy after it publishes a new spec.
 *
 * If the fetch fails but a previously fetched spec is on disk, that one is
 * reused: a network blip should not stop you building or previewing the docs.
 * With no spec at all there is nothing to render, so the build fails.
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { enrichPublicApiOpenApiSpec, PUBLIC_API_OPENAPI_URL } from '@cio/utils/openapi/public-api';

const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../openapi/public-api.json');

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

let response;

try {
  response = await fetch(PUBLIC_API_OPENAPI_URL);
} catch (error) {
  if (await exists(OUTPUT)) {
    console.warn(
      `[docs] Could not reach ${PUBLIC_API_OPENAPI_URL} (${error.cause?.code ?? error.message}). Reusing the spec already in openapi/.`
    );
    process.exit(0);
  }

  throw new Error(
    `Failed to reach the OpenAPI spec at ${PUBLIC_API_OPENAPI_URL}, and no previously fetched copy exists in openapi/. The API reference cannot be built.`,
    { cause: error }
  );
}

if (!response.ok) {
  if (await exists(OUTPUT)) {
    console.warn(
      `[docs] ${PUBLIC_API_OPENAPI_URL} returned ${response.status} ${response.statusText}. Reusing the spec already in openapi/.`
    );
    process.exit(0);
  }

  throw new Error(
    `Failed to fetch the OpenAPI spec from ${PUBLIC_API_OPENAPI_URL}: ${response.status} ${response.statusText}`
  );
}

const spec = enrichPublicApiOpenApiSpec(await response.json());

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`[docs] Wrote enriched OpenAPI spec to ${OUTPUT}`);
