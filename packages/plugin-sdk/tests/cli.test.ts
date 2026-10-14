import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDeterministicTarGz, packageSinglePlugin, validateManifest } from '../bin/cio-plugin.mjs';

describe('Plugin CLI (cio-plugin)', () => {
  const validManifest = {
    manifestVersion: 1,
    id: 'com.example.test-plugin',
    slug: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin extension',
    publisher: 'Test Publisher',
    engines: {
      classroomio: '^1.0.0',
      pluginApi: '^1.0.0'
    },
    permissions: {
      required: ['course.metadata:read'],
      optional: []
    },
    dataPolicy: {
      storesCustomerData: false
    }
  };

  it('validates a correct manifest', () => {
    const result = validateManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an invalid manifest with detailed errors', () => {
    const invalidManifest = {
      ...validManifest,
      manifestVersion: 2,
      id: 'invalid id with spaces',
      version: 'not-semver'
    };
    const result = validateManifest(invalidManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('produces deterministic tar.gz archives with identical SHA-256 digests', () => {
    const files = [
      { path: 'plugin.json', content: Buffer.from(JSON.stringify(validManifest), 'utf8') },
      { path: 'dist/index.html', content: Buffer.from('<h1>Hello World</h1>', 'utf8') }
    ];

    const archive1 = createDeterministicTarGz(files);
    const archive2 = createDeterministicTarGz([...files].reverse());

    const digest1 = crypto.createHash('sha256').update(archive1).digest('hex');
    const digest2 = crypto.createHash('sha256').update(archive2).digest('hex');

    expect(digest1).toBe(digest2);
  });

  it('packages a plugin directory into a canonical archive with inventory.json', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-test-'));
    fs.writeFileSync(path.join(tempDir, 'plugin.json'), JSON.stringify(validManifest));

    const pkg = packageSinglePlugin(tempDir);
    expect(pkg.manifest.id).toBe('com.example.test-plugin');
    expect(pkg.slug).toBe('test-plugin');
    expect(pkg.artifactDigest).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(pkg.archiveFileName).toBe('com.example.test-plugin-1.0.0.tar.gz');

    const hasInventory = pkg.filesToPackage.some((f) => f.path === 'inventory.json');
    expect(hasInventory).toBe(true);
  });
});
