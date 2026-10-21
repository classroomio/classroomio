#!/usr/bin/env tsx

import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateSpecs } from 'hono-openapi';
import { app } from '../src/app';

export async function generatePluginOpenApiSpec() {
  const generated = (await generateSpecs(app, {
    documentation: {
      info: {
        title: 'ClassroomIO Plugin API',
        version: '1.0.0',
        description: 'Stable API exposed to independently developed ClassroomIO plugin backends.'
      },
      servers: [
        { url: 'https://api.classroomio.com', description: 'Production' },
        { url: 'http://localhost:3002', description: 'Local development' }
      ]
    }
  })) as Record<string, any>;

  const paths = Object.fromEntries(
    Object.entries((generated.paths ?? {}) as Record<string, unknown>).filter(([path]) =>
      path.startsWith('/plugin-api/v1/')
    )
  );
  if (Object.keys(paths).length === 0) {
    throw new Error('Generated Plugin API OpenAPI document has no routes');
  }

  const spec = {
    ...generated,
    paths,
    tags: [{ name: 'Plugin API v1', description: 'Public operations available to plugin backends.' }],
    components: {
      ...(generated.components ?? {}),
      securitySchemes: {
        ...(generated.components?.securitySchemes ?? {}),
        pluginBearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'ClassroomIO plugin access token'
        }
      }
    }
  };

  const outputDirectory = join(process.cwd(), 'dist', 'openapi', 'plugin-api');
  mkdirSync(outputDirectory, { recursive: true });
  const outputPath = join(outputDirectory, 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf8');

  return { outputPath, pathCount: Object.keys(paths).length };
}

if (process.argv[1]?.endsWith('generate-plugin-openapi-spec.ts')) {
  generatePluginOpenApiSpec()
    .then(({ outputPath, pathCount }) => {
      console.log(`Generated Plugin API OpenAPI document with ${pathCount} paths at ${outputPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
