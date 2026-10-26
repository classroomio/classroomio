import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
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

const hideUuidPatterns = (value) => {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (!Array.isArray(value) && value.format === 'uuid') {
    delete value.pattern;
  }

  for (const child of Object.values(value)) {
    hideUuidPatterns(child);
  }
};

const writeDocsSpec = async (spec) => {
  hideUuidPatterns(spec);
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(spec, null, 2)}\n`);
};

const reuseExistingSpec = async () => {
  const cachedSpec = JSON.parse(await readFile(OUTPUT, 'utf-8'));
  await writeDocsSpec(cachedSpec);
};

let response;

try {
  response = await fetch(PUBLIC_API_OPENAPI_URL);
} catch (error) {
  if (await exists(OUTPUT)) {
    await reuseExistingSpec();
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
    await reuseExistingSpec();
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
await writeDocsSpec(spec);

console.log(`[docs] Wrote enriched OpenAPI spec to ${OUTPUT}`);
