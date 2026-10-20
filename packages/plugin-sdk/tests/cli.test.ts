import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildAllPlugins,
  createDeterministicTarGz,
  packageSinglePlugin,
  scaffoldPlugin,
  validateManifest,
  verifyArtifacts
} from '../bin/cio-plugin.mjs';

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

  it('produces the same package digest at different build times', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-deterministic-'));
    fs.writeFileSync(path.join(tempDir, 'plugin.json'), JSON.stringify(validManifest));

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const firstPackage = packageSinglePlugin(tempDir);
      vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
      const secondPackage = packageSinglePlugin(tempDir);

      expect(secondPackage.artifactDigest).toBe(firstPackage.artifactDigest);
      expect(secondPackage.tarGzBuffer.equals(firstPackage.tarGzBuffer)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('builds and verifies all plugin artifacts in a multi-plugin directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-multi-'));
    const pluginA = path.join(tempDir, 'plugin-a');
    const distDir = path.join(pluginA, 'dist');
    fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<h1>Plugin</h1>');
    fs.writeFileSync(path.join(distDir, 'assets', 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" />');
    fs.writeFileSync(
      path.join(pluginA, 'plugin.json'),
      JSON.stringify({
        ...validManifest,
        icon: { resource: 'assets/icon.svg' },
        runtime: {
          ui: {
            entrypoints: {
              main: { renderMode: 'custom', resource: 'dist/index.html' }
            }
          }
        },
        contributes: {
          pages: [{ id: 'main', entrypoint: 'main', title: 'Main' }]
        }
      })
    );

    const buildResult = buildAllPlugins(tempDir);
    expect(buildResult.releases).toHaveLength(1);
    expect(fs.existsSync(path.join(tempDir, '.plugin-artifacts', 'release-index.json'))).toBe(true);

    const release = buildResult.releases[0];
    const artifactDirectory = path.join(tempDir, release.artifactDirectory);
    expect(fs.existsSync(path.join(artifactDirectory, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(artifactDirectory, 'assets', 'icon.svg'))).toBe(true);
    expect(fs.existsSync(path.join(artifactDirectory, 'dist', 'index.html'))).toBe(false);

    const verifyResult = verifyArtifacts(tempDir);
    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.count).toBe(1);
    expect(verifyResult.errors).toHaveLength(0);
  });

  it('scaffolds a buildable plugin starter with the SDK lifecycle scripts', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-scaffold-'));
    const targetDir = path.join(tempDir, 'course-insights');

    const result = scaffoldPlugin(targetDir, {
      id: 'com.acme.course-insights',
      publisher: 'Acme Inc.'
    });

    expect(result.manifest).toMatchObject({
      id: 'com.acme.course-insights',
      slug: 'course-insights',
      publisher: 'Acme Inc.',
      version: '0.1.0'
    });
    expect(validateManifest(result.manifest).valid).toBe(true);
    expect(result.packageJson.scripts).toMatchObject({
      dev: 'vite',
      build: 'vite build',
      'build:ui': 'vite build',
      pack: 'cio-plugin build',
      seed: 'cio-plugin dev',
      preview: 'vite preview'
    });
    expect(result.packageJson.scripts.publish).toBeUndefined();
    expect(fs.readFileSync(path.join(targetDir, 'vite.config.ts'), 'utf8')).toContain("base: './'");
    expect(fs.readFileSync(path.join(targetDir, 'src', 'main.ts'), 'utf8')).toContain('createClassroomIOClient');
    expect(fs.existsSync(path.join(targetDir, 'public', 'assets', 'icon.svg'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'README.md'))).toBe(true);
  });

  it('builds plugins declared in a registry file and skips unreleased entries', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-registry-'));
    const pluginA = path.join(tempDir, 'plugins', 'plugin-a');
    const pluginB = path.join(tempDir, 'plugins', 'plugin-b');

    fs.mkdirSync(path.join(pluginA, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(pluginA, 'dist', 'index.html'), '<h1>A</h1>');
    fs.writeFileSync(
      path.join(pluginA, 'plugin.json'),
      JSON.stringify({ ...validManifest, id: 'com.example.plugin-a', slug: 'plugin-a' })
    );

    fs.mkdirSync(path.join(pluginB, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(pluginB, 'dist', 'index.html'), '<h1>B</h1>');
    fs.writeFileSync(
      path.join(pluginB, 'plugin.json'),
      JSON.stringify({ ...validManifest, id: 'com.example.plugin-b', slug: 'plugin-b' })
    );

    const registryDir = path.join(tempDir, 'registry');
    fs.mkdirSync(registryDir, { recursive: true });
    const registryPath = path.join(registryDir, 'plugins.json');
    fs.writeFileSync(
      registryPath,
      JSON.stringify({
        schemaVersion: 1,
        plugins: [
          { id: 'com.example.plugin-a', path: 'plugins/plugin-a', kind: 'community', release: true },
          { id: 'com.example.plugin-b', path: 'plugins/plugin-b', kind: 'fixture', release: false }
        ]
      })
    );

    const buildResult = buildAllPlugins(tempDir, { registry: registryPath });
    expect(buildResult.releases).toHaveLength(1);
    expect(buildResult.releases[0].pluginId).toBe('com.example.plugin-a');
    expect(buildResult.releases[0].kind).toBe('community');
  });

  it('rejects duplicate and namespace-violating registry entries', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-registry-policy-'));
    const pluginDir = path.join(tempDir, 'plugin-a');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({ ...validManifest, id: 'com.classroomio.plugin-a', slug: 'plugin-a' })
    );

    const registryDir = path.join(tempDir, 'registry');
    fs.mkdirSync(registryDir, { recursive: true });
    const registryPath = path.join(registryDir, 'plugins.json');
    fs.writeFileSync(
      registryPath,
      JSON.stringify({
        schemaVersion: 1,
        plugins: [
          { id: 'com.classroomio.plugin-a', path: 'plugin-a', kind: 'community', release: true },
          { id: 'com.classroomio.plugin-a', path: 'plugin-a', kind: 'community', release: true }
        ]
      })
    );

    expect(() => buildAllPlugins(tempDir, { registry: registryPath })).toThrow(/namespace policy|Duplicate/);
  });

  it('refuses to scaffold over a non-empty directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-cli-scaffold-existing-'));
    fs.writeFileSync(path.join(tempDir, 'keep.txt'), 'keep');

    expect(() => scaffoldPlugin(tempDir)).toThrow('is not empty');
  });
});
