#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function filesUnder(directory, root = directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) filesUnder(absolutePath, root, files);
    else files.push({ absolutePath, relativePath: path.relative(root, absolutePath) });
  }

  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function digestDirectory(directory) {
  const hash = createHash('sha256');
  for (const file of filesUnder(directory)) {
    hash.update(file.relativePath);
    hash.update('\0');
    hash.update(fs.readFileSync(file.absolutePath));
    hash.update('\0');
  }

  return `sha256-${hash.digest('hex')}`;
}

function printUsage() {
  console.log(`
ClassroomIO Plugin CLI (cio-plugin)

Usage:
  cio-plugin pack [path]       Build and package immutable plugin artifact(s)
  cio-plugin digest <dir>      Compute deterministic SHA-256 digest of a directory
  cio-plugin validate [path]   Validate plugin.json manifest

Examples:
  npx cio-plugin pack
  npx cio-plugin pack ./my-plugin
  npx cio-plugin digest ./dist
`);
}

const args = process.argv.slice(2);
const command = args[0] || 'pack';
const targetArg = args[1] || '.';

if (command === '--help' || command === '-h' || command === 'help') {
  printUsage();
  process.exit(0);
}

if (command === 'digest') {
  const targetDir = path.resolve(process.cwd(), targetArg);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`Error: Directory not found: ${targetDir}`);
    process.exit(1);
  }
  const digest = digestDirectory(targetDir);
  console.log(digest);
  process.exit(0);
}

if (command === 'validate') {
  const manifestPath = fs.existsSync(path.resolve(process.cwd(), targetArg, 'plugin.json'))
    ? path.resolve(process.cwd(), targetArg, 'plugin.json')
    : path.resolve(process.cwd(), 'plugin.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: plugin.json not found at ${manifestPath}`);
    process.exit(1);
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Manifest missing required fields: id, name, or version');
    }
    console.log(`✓ Valid plugin manifest: ${manifest.id}@${manifest.version}`);
  } catch (err) {
    console.error(`Error validating manifest: ${err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (command === 'pack' || command === 'build') {
  const rootDir = path.resolve(process.cwd(), targetArg);
  const outputRoot = path.join(rootDir, '.plugin-artifacts');

  // Check if current target directory itself is a plugin
  const singleManifest = path.join(rootDir, 'plugin.json');
  let pluginDirs = [];

  if (fs.existsSync(singleManifest)) {
    pluginDirs = [rootDir];
  } else {
    // Check subdirectories
    pluginDirs = fs
      .readdirSync(rootDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(rootDir, entry.name, 'plugin.json')))
      .map((entry) => path.join(rootDir, entry.name));
  }

  if (pluginDirs.length === 0) {
    console.error(`Error: No plugin.json found in ${rootDir} or its direct subdirectories.`);
    process.exit(1);
  }

  const releases = [];

  for (const pluginDir of pluginDirs) {
    const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, 'plugin.json'), 'utf8'));
    console.log(`Packaging ${manifest.id}@${manifest.version}...`);

    if (manifest.runtime?.ui) {
      const distDir = path.join(pluginDir, 'dist');
      if (!fs.existsSync(distDir)) {
        console.log(`Building UI assets for ${manifest.id}...`);
        const build = spawnSync('npm', ['run', 'build'], { cwd: pluginDir, stdio: 'inherit' });
        if (build.status !== 0) {
          console.error(`Build failed for ${manifest.id}`);
          process.exit(build.status ?? 1);
        }
      }

      if (!fs.existsSync(distDir)) {
        console.error(`Error: ${manifest.id} did not produce a dist directory at ${distDir}`);
        process.exit(1);
      }

      const artifactDigest = digestDirectory(distDir);
      const releaseDir = path.join(outputRoot, manifest.id, manifest.version, artifactDigest);
      fs.rmSync(releaseDir, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(releaseDir), { recursive: true });
      fs.cpSync(distDir, releaseDir, { recursive: true });

      releases.push({
        pluginId: manifest.id,
        version: manifest.version,
        artifactDigest,
        manifest,
        artifactDirectory: path.relative(rootDir, releaseDir)
      });
      console.log(`✓ Built artifact: ${manifest.id}@${manifest.version} (${artifactDigest})`);
    } else {
      releases.push({
        pluginId: manifest.id,
        version: manifest.version,
        artifactDigest: 'none',
        manifest
      });
      console.log(`✓ Registered backend-only plugin: ${manifest.id}@${manifest.version}`);
    }
  }

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'release-index.json'), `${JSON.stringify({ releases }, null, 2)}\n`);
  console.log(
    `\nSuccessfully packed ${releases.length} plugin release(s) in ${path.relative(process.cwd(), outputRoot)}`
  );
  process.exit(0);
}

printUsage();
process.exit(1);
