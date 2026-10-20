#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const REVERSE_DOMAIN_ID_REGEX = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i;
const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ALLOWED_CAPABILITIES = new Set([
  'identity.profile:read',
  'organization.profile:read',
  'organization.members:read',
  'course.metadata:read',
  'course.content:read',
  'course.metadata:write',
  'course.enrollment:read',
  'course.enrollment:write',
  'lesson.metadata:read',
  'lesson.content:read',
  'lesson:write',
  'learner.profile:read',
  'learner.progress:read',
  'learner.progress:write',
  'exercise.metadata:read',
  'submission:read',
  'submission:write',
  'grade:read',
  'grade:write',
  'certificate.issued:read',
  'certificate.issuance:write',
  'certificate.revocation:write',
  'certificate.template:read',
  'certificate.template:write',
  'cohort.metadata:read',
  'cohort.membership:read',
  'analytics.summary:read',
  'notification:write',
  'plugin.storage:read',
  'plugin.storage:write'
]);

function isSafeRelativePath(p) {
  if (typeof p !== 'string' || !p.trim()) return false;
  if (p.startsWith('/') || p.startsWith('\\')) return false;
  const segments = p.split(/[/\\]/);
  return !segments.includes('..');
}

function isValidHttpOrigin(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const isSecure = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.hostname === 'localhost');
    return (
      isSecure &&
      parsed.origin === urlStr.replace(/\/$/, '') &&
      parsed.pathname === '/' &&
      !parsed.search &&
      !parsed.hash &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a JSON object'] };
  }

  if (manifest.manifestVersion !== 1) {
    errors.push('manifestVersion must be 1');
  }

  if (!manifest.id || typeof manifest.id !== 'string' || !REVERSE_DOMAIN_ID_REGEX.test(manifest.id)) {
    errors.push('id must be in reverse-domain format (e.g. "com.classroomio.certificate-studio")');
  }

  if (manifest.slug !== undefined) {
    if (typeof manifest.slug !== 'string' || !KEBAB_CASE_REGEX.test(manifest.slug)) {
      errors.push('slug must be lowercase kebab-case (e.g. "certificate-studio")');
    }
  }

  if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length < 2) {
    errors.push('name must be a string of at least 2 characters');
  }

  if (!manifest.version || typeof manifest.version !== 'string' || !SEMVER_REGEX.test(manifest.version)) {
    errors.push('version must follow SemVer 2.0 (e.g. "1.0.0")');
  }

  if (!manifest.description || typeof manifest.description !== 'string' || manifest.description.trim().length < 5) {
    errors.push('description must be a string of at least 5 characters');
  }

  if (!manifest.publisher || typeof manifest.publisher !== 'string' || manifest.publisher.trim().length < 2) {
    errors.push('publisher must be a string of at least 2 characters');
  }

  if (!manifest.engines || typeof manifest.engines !== 'object') {
    errors.push('engines object is required with "classroomio" and "pluginApi" properties');
  } else {
    if (!manifest.engines.classroomio) errors.push('engines.classroomio requirement is required');
    if (!manifest.engines.pluginApi) errors.push('engines.pluginApi version requirement is required');
  }

  if (manifest.icon) {
    if (!manifest.icon.resource || !isSafeRelativePath(manifest.icon.resource)) {
      errors.push('icon.resource must be a safe relative asset path');
    }
  }

  if (manifest.permissions) {
    const required = manifest.permissions.required ?? [];
    const optional = manifest.permissions.optional ?? [];

    for (const scope of required) {
      if (!ALLOWED_CAPABILITIES.has(scope)) {
        errors.push(`permissions.required contains unrecognized scope "${scope}"`);
      }
    }
    for (const scope of optional) {
      if (!ALLOWED_CAPABILITIES.has(scope)) {
        errors.push(`permissions.optional contains unrecognized scope "${scope}"`);
      }
    }
  }

  if (manifest.networkAccess?.allowedDomains) {
    for (const domain of manifest.networkAccess.allowedDomains) {
      if (!isValidHttpOrigin(domain)) {
        errors.push(`networkAccess.allowedDomains item "${domain}" must be an exact HTTPS origin or localhost origin`);
      }
    }
  }

  const declaredEntrypoints = manifest.runtime?.ui?.entrypoints ?? {};
  for (const [key, entrypoint] of Object.entries(declaredEntrypoints)) {
    const resource = typeof entrypoint === 'string' ? entrypoint : entrypoint?.resource;
    if (!resource || !isSafeRelativePath(resource)) {
      errors.push(`runtime.ui.entrypoints["${key}"] must specify a safe relative asset path`);
    }
  }

  if (manifest.contributes?.pages) {
    for (const page of manifest.contributes.pages) {
      if (!page.id) errors.push('Each page in contributes.pages must have an id');
      if (!page.entrypoint || !declaredEntrypoints[page.entrypoint]) {
        errors.push(`Page "${page.id}" references undeclared ui.entrypoint "${page.entrypoint}"`);
      }
    }
  }

  if (manifest.contributes?.navigation) {
    const declaredPageIds = new Set((manifest.contributes.pages ?? []).map((p) => p.id));
    for (const item of manifest.contributes.navigation) {
      if (!item.id || !item.page) {
        errors.push('Each navigation item in contributes.navigation must have an id and page');
      } else if (!declaredPageIds.has(item.page)) {
        errors.push(`Navigation item "${item.id}" references undeclared page "${item.page}"`);
      }
    }
  }

  if (manifest.contributes?.slots) {
    for (const slot of manifest.contributes.slots) {
      if (!slot.id || !slot.target) {
        errors.push('Each slot in contributes.slots must have an id and target');
      }
      if (slot.entrypoint && !declaredEntrypoints[slot.entrypoint]) {
        errors.push(`Slot "${slot.id}" references undeclared ui.entrypoint "${slot.entrypoint}"`);
      }
    }
  }

  if (manifest.contributes?.actions) {
    for (const action of manifest.contributes.actions) {
      if (!action.id) errors.push('Each action in contributes.actions must have an id');
      if (action.entrypoint && !declaredEntrypoints[action.entrypoint]) {
        errors.push(`Action "${action.id}" references undeclared ui.entrypoint "${action.entrypoint}"`);
      }
    }
  }

  if (manifest.storage?.documents) {
    const seen = new Set();
    for (const doc of manifest.storage.documents) {
      const key = `${doc.scope}:${doc.namespace}`;
      if (seen.has(key)) {
        errors.push(`Duplicate storage document namespace "${doc.namespace}" in scope "${doc.scope}"`);
      }
      seen.add(key);
    }
  }

  if (manifest.dataPolicy) {
    if (typeof manifest.dataPolicy.storesCustomerData !== 'boolean') {
      errors.push('dataPolicy.storesCustomerData boolean is required');
    }
    if (manifest.dataPolicy.storesCustomerData && !manifest.dataPolicy.privacyPolicyUrl) {
      errors.push('dataPolicy.privacyPolicyUrl is required when storesCustomerData is true');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function filesUnder(directory, root = directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) filesUnder(absolutePath, root, files);
    else files.push({ absolutePath, relativePath: path.relative(root, absolutePath) });
  }

  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function digestFile(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return `sha256-${hash.digest('hex')}`;
}

function digestBuffer(buf) {
  const hash = createHash('sha256');
  hash.update(buf);
  return `sha256-${hash.digest('hex')}`;
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

function createTarHeader(filePath, size, mode = 0o644) {
  const buf = Buffer.alloc(512);
  let name = filePath;
  let prefix = '';

  if (Buffer.byteLength(name, 'utf8') > 100) {
    const lastSlash = name.lastIndexOf('/', 155);
    if (lastSlash !== -1 && lastSlash <= 155) {
      prefix = name.slice(0, lastSlash);
      name = name.slice(lastSlash + 1);
    }
  }

  buf.write(name, 0, 100, 'utf8');
  buf.write(mode.toString(8).padStart(7, '0') + '\0', 100, 8, 'ascii');
  buf.write((0).toString(8).padStart(7, '0') + '\0', 108, 8, 'ascii'); // uid 0
  buf.write((0).toString(8).padStart(7, '0') + '\0', 116, 8, 'ascii'); // gid 0
  buf.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii');
  buf.write((0).toString(8).padStart(11, '0') + '\0', 136, 12, 'ascii'); // mtime 0
  buf.fill(0x20, 148, 156);
  buf.write('0', 156, 1, 'ascii'); // regular file
  buf.write('ustar\0', 257, 6, 'ascii');
  buf.write('00', 263, 2, 'ascii');
  if (prefix) {
    buf.write(prefix, 345, 155, 'utf8');
  }

  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += buf[i];
  buf.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
  return buf;
}

export function createDeterministicTarGz(files) {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const chunks = [];
  for (const file of sorted) {
    const data = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);
    chunks.push(createTarHeader(file.path, data.length, file.mode ?? 0o644));
    chunks.push(data);
    const pad = (512 - (data.length % 512)) % 512;
    if (pad > 0) chunks.push(Buffer.alloc(pad));
  }
  chunks.push(Buffer.alloc(1024));
  const tarBuf = Buffer.concat(chunks);
  return zlib.gzipSync(tarBuf, { mtime: 0 });
}

export function packageSinglePlugin(pluginDir, options = {}) {
  const manifestPath = path.join(pluginDir, 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`plugin.json not found in ${pluginDir}`);
  }
  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const validation = validateManifest(manifest);
  if (!validation.valid) {
    throw new Error(
      `Invalid manifest in ${path.relative(process.cwd(), pluginDir)}:\n${validation.errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  const packagedFiles = new Map();
  packagedFiles.set('plugin.json', {
    path: 'plugin.json',
    content: Buffer.from(manifestRaw, 'utf8'),
    mode: 0o644
  });

  if (manifest.runtime?.ui) {
    const distDir = path.join(pluginDir, 'dist');
    const packageJsonPath = path.join(pluginDir, 'package.json');
    if (options.rebuildUi && fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const buildScript = packageJson.scripts?.['build:ui'] ? 'build:ui' : packageJson.scripts?.build ? 'build' : null;
      if (buildScript) {
        fs.rmSync(distDir, { recursive: true, force: true });
        const build = spawnSync('pnpm', ['run', buildScript], { cwd: pluginDir, stdio: 'inherit' });
        if (build.status !== 0) {
          throw new Error(`Build failed for ${manifest.id}`);
        }
      }
    } else if (!fs.existsSync(distDir)) {
      console.log(`Building UI assets for ${manifest.id}...`);
      const build = spawnSync('npm', ['run', 'build:ui'], { cwd: pluginDir, stdio: 'inherit' });
      if (build.status !== 0) {
        throw new Error(`Build failed for ${manifest.id}`);
      }
    }

    if (!fs.existsSync(distDir)) {
      throw new Error(`Error: ${manifest.id} did not produce a dist directory at ${distDir}`);
    }

    for (const file of filesUnder(distDir)) {
      packagedFiles.set(file.relativePath, {
        path: file.relativePath,
        content: fs.readFileSync(file.absolutePath),
        mode: 0o644
      });
    }
  }

  if (manifest.icon?.resource && !packagedFiles.has(manifest.icon.resource)) {
    const iconCandidates = [
      path.join(pluginDir, manifest.icon.resource),
      path.join(pluginDir, 'public', manifest.icon.resource)
    ];
    const iconPath = iconCandidates.find((candidate) => fs.existsSync(candidate));
    if (iconPath) {
      packagedFiles.set(manifest.icon.resource, {
        path: manifest.icon.resource,
        content: fs.readFileSync(iconPath),
        mode: 0o644
      });
    } else {
      console.warn(`Warning: Icon file not found at ${manifest.icon.resource}`);
    }
  }

  const filesToPackage = Array.from(packagedFiles.values()).sort((left, right) => left.path.localeCompare(right.path));
  const inventory = {
    schemaVersion: 1,
    pluginId: manifest.id,
    version: manifest.version,
    files: filesToPackage.map((f) => ({
      path: f.path,
      size: f.content.length,
      digest: digestBuffer(f.content)
    }))
  };

  const inventoryBuffer = Buffer.from(JSON.stringify(inventory, null, 2) + '\n', 'utf8');
  filesToPackage.push({
    path: 'inventory.json',
    content: inventoryBuffer,
    mode: 0o644
  });

  const tarGzBuffer = createDeterministicTarGz(filesToPackage);
  const artifactDigest = digestBuffer(tarGzBuffer);
  const archiveFileName = `${manifest.id}-${manifest.version}.tar.gz`;
  const slug = manifest.slug || manifest.id.replace(/^([a-z0-9_-]+\.)+/i, '');

  return {
    manifest,
    slug,
    filesToPackage,
    inventory: inventory.files,
    tarGzBuffer,
    artifactDigest,
    archiveFileName
  };
}

export function findPluginDirectories(rootDir = '.') {
  const resolvedRoot = path.resolve(process.cwd(), rootDir);
  const singleManifest = path.join(resolvedRoot, 'plugin.json');
  if (fs.existsSync(singleManifest)) {
    return [resolvedRoot];
  }

  if (!fs.existsSync(resolvedRoot)) {
    return [];
  }

  return fs
    .readdirSync(resolvedRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(resolvedRoot, entry.name, 'plugin.json')))
    .map((entry) => path.join(resolvedRoot, entry.name));
}

export function buildAllPlugins(rootDir = '.', options = {}) {
  const resolvedRoot = path.resolve(process.cwd(), rootDir);
  const outputRoot = path.join(resolvedRoot, '.plugin-artifacts');
  let pluginCandidates = [];

  if (options.registry) {
    const candidatePaths = [
      path.resolve(process.cwd(), options.registry),
      path.resolve(resolvedRoot, options.registry)
    ];
    const registryPath = candidatePaths.find((p) => fs.existsSync(p));
    if (!registryPath) {
      throw new Error(`Registry file not found at: ${options.registry}`);
    }

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.plugins)) {
      throw new Error(`Invalid registry file at ${registryPath}: expected schemaVersion 1 and a "plugins" array.`);
    }

    const registryIds = new Set();
    const registryPaths = new Set();
    for (const item of registry.plugins) {
      if (
        !item ||
        typeof item.id !== 'string' ||
        typeof item.path !== 'string' ||
        !['first-party', 'community', 'fixture'].includes(item.kind) ||
        typeof item.release !== 'boolean'
      ) {
        throw new Error('Every registry entry must define id, path, kind, and release.');
      }
      if (registryIds.has(item.id) || registryPaths.has(item.path)) {
        throw new Error(`Duplicate plugin registry ID or path: ${item.id}`);
      }
      registryIds.add(item.id);
      registryPaths.add(item.path);

      const usesReservedNamespace = item.id.startsWith('com.classroomio.');
      if (item.release && usesReservedNamespace !== (item.kind === 'first-party')) {
        throw new Error(`Invalid namespace policy for registry entry "${item.id}".`);
      }
      if (item.kind === 'fixture' && item.release) {
        throw new Error(`Fixture registry entry "${item.id}" cannot be released.`);
      }

      const foundDir = path.resolve(resolvedRoot, item.path);
      if (!foundDir.startsWith(`${resolvedRoot}${path.sep}`)) {
        throw new Error(`Registry path escapes the repository root: ${item.path}`);
      }
      if (!fs.existsSync(foundDir) || !fs.existsSync(path.join(foundDir, 'plugin.json'))) {
        throw new Error(
          `Plugin directory or plugin.json not found for registry entry "${item.id}" at path "${item.path}".`
        );
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(foundDir, 'plugin.json'), 'utf8'));
      if (manifest.id !== item.id) {
        throw new Error(`Registry ID mismatch: registry declared "${item.id}" but plugin.json has "${manifest.id}".`);
      }

      if (item.release === false) continue;
      pluginCandidates.push({ directory: foundDir, kind: item.kind });
    }
  } else {
    pluginCandidates = findPluginDirectories(resolvedRoot).map((directory) => ({ directory, kind: undefined }));
  }

  if (pluginCandidates.length === 0) {
    throw new Error(`No plugin.json found in ${resolvedRoot} or its direct subdirectories.`);
  }

  const releases = [];

  for (const pluginCandidate of pluginCandidates) {
    const pluginDir = pluginCandidate.directory;
    console.log(`Packaging plugin in ${path.relative(process.cwd(), pluginDir) || '.'}...`);
    const pkg = packageSinglePlugin(pluginDir, { rebuildUi: Boolean(options.registry) });

    const pluginOutputDir = path.join(outputRoot, pkg.manifest.id, pkg.manifest.version);
    fs.mkdirSync(pluginOutputDir, { recursive: true });

    const archivePath = path.join(pluginOutputDir, pkg.archiveFileName);
    fs.writeFileSync(archivePath, pkg.tarGzBuffer);

    const unpackedDir = path.join(pluginOutputDir, pkg.artifactDigest);
    fs.rmSync(unpackedDir, { recursive: true, force: true });
    fs.mkdirSync(unpackedDir, { recursive: true });

    for (const f of pkg.filesToPackage) {
      const destPath = path.join(unpackedDir, f.path);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, f.content);
    }

    releases.push({
      pluginId: pkg.manifest.id,
      slug: pkg.slug,
      version: pkg.manifest.version,
      kind: pluginCandidate.kind,
      artifactDigest: pkg.artifactDigest,
      archive: path.relative(resolvedRoot, archivePath),
      manifest: pkg.manifest,
      inventory: pkg.inventory,
      artifactDirectory: path.relative(resolvedRoot, unpackedDir)
    });

    console.log(`✓ Built canonical package: ${pkg.archiveFileName} (${pkg.artifactDigest})`);
    console.log(`  Included ${pkg.filesToPackage.length} files in archive`);
  }

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'release-index.json'), `${JSON.stringify({ releases }, null, 2)}\n`);

  return { releases, outputRoot };
}

export function verifyArtifacts(targetDir = '.') {
  const resolvedTarget = path.resolve(process.cwd(), targetDir);
  const candidateArtifactRoots = [path.join(resolvedTarget, '.plugin-artifacts'), resolvedTarget];
  const artifactRoot = candidateArtifactRoots.find((d) => fs.existsSync(path.join(d, 'release-index.json')));

  if (!artifactRoot) {
    return {
      valid: false,
      errors: [`Release index not found. Looked in ${candidateArtifactRoots.join(', ')}. Run cio-plugin build first.`],
      count: 0
    };
  }

  const releaseIndexPath = path.join(artifactRoot, 'release-index.json');
  let releaseIndex;
  try {
    releaseIndex = JSON.parse(fs.readFileSync(releaseIndexPath, 'utf8'));
  } catch (err) {
    return {
      valid: false,
      errors: [`Failed to parse release index at ${releaseIndexPath}: ${err.message}`],
      count: 0
    };
  }

  const violations = [];
  const releases = releaseIndex.releases ?? [];

  function artifactPath(release, resource) {
    if (typeof resource !== 'string' || resource.length === 0 || resource.startsWith('/') || resource.includes('..')) {
      return null;
    }
    const normalizedResource = resource.startsWith('dist/') ? resource.slice('dist/'.length) : resource;
    return path.resolve(artifactRoot, release.pluginId, release.version, release.artifactDigest, normalizedResource);
  }

  function checkResource(release, resource, source) {
    const resolvedPath = artifactPath(release, resource);
    if (!resolvedPath) {
      violations.push(`${release.pluginId}: invalid artifact resource for ${source}`);
      return;
    }
    const releaseDirectory = path.resolve(artifactRoot, release.pluginId, release.version, release.artifactDigest);
    if (!resolvedPath.startsWith(`${releaseDirectory}${path.sep}`) || !fs.existsSync(resolvedPath)) {
      violations.push(`${release.pluginId}: missing artifact resource "${resource}" for ${source}`);
    }
  }

  function resolveEntrypoint(manifest, entrypointName) {
    const entrypoint = manifest.runtime?.ui?.entrypoints?.[entrypointName];
    return typeof entrypoint === 'string' ? entrypoint : entrypoint?.resource;
  }

  for (const release of releases) {
    const releaseDirectory = path.resolve(artifactRoot, release.pluginId, release.version, release.artifactDigest);
    if (!fs.existsSync(releaseDirectory)) {
      violations.push(`${release.pluginId}: missing release directory ${releaseDirectory}`);
      continue;
    }

    const manifest = release.manifest ?? {};
    const entrypoints = manifest.runtime?.ui?.entrypoints ?? {};

    if (manifest.icon?.resource) {
      checkResource(release, manifest.icon.resource, 'plugin icon');
    }

    for (const [entrypointName, entrypoint] of Object.entries(entrypoints)) {
      const resource = typeof entrypoint === 'string' ? entrypoint : entrypoint?.resource;
      checkResource(release, resource, `entrypoint ${entrypointName}`);
    }

    for (const slot of manifest.contributes?.slots ?? []) {
      if (slot.renderMode === 'custom' || !slot.renderMode) {
        checkResource(release, resolveEntrypoint(manifest, slot.entrypoint), `slot ${slot.id}`);
      }
    }

    for (const action of manifest.contributes?.actions ?? []) {
      if (action.renderMode === 'custom') {
        checkResource(release, resolveEntrypoint(manifest, action.entrypoint), `action ${action.id}`);
      }
      if (action.icon?.resource) {
        checkResource(release, action.icon.resource, `action ${action.id} icon`);
      }
    }

    for (const page of manifest.contributes?.pages ?? []) {
      checkResource(release, resolveEntrypoint(manifest, page.entrypoint), `page ${page.id}`);
    }

    for (const navigation of manifest.contributes?.navigation ?? []) {
      if (navigation.icon?.resource) {
        checkResource(release, navigation.icon.resource, `navigation ${navigation.id} icon`);
      }
    }

    if (!/^sha256-[a-f0-9]{64}$/.test(release.artifactDigest)) {
      violations.push(`${release.pluginId}: invalid artifact digest ${release.artifactDigest}`);
    }

    if (release.archive) {
      const archivePathCandidates = [
        path.resolve(path.dirname(artifactRoot), release.archive),
        path.resolve(artifactRoot, release.archive),
        path.resolve(artifactRoot, release.pluginId, release.version, path.basename(release.archive))
      ];
      const archivePath = archivePathCandidates.find((p) => fs.existsSync(p));
      if (!archivePath) {
        violations.push(`${release.pluginId}: missing archive file ${release.archive}`);
      } else {
        const hash = createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
        const expectedDigest = `sha256-${hash}`;
        if (release.artifactDigest !== expectedDigest) {
          violations.push(
            `${release.pluginId}: archive digest mismatch: expected ${expectedDigest}, got ${release.artifactDigest}`
          );
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    errors: violations,
    count: releases.length
  };
}

function toPluginSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPluginName(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function scaffoldPlugin(target = 'my-classroomio-plugin', options = {}) {
  const targetDir = path.resolve(process.cwd(), target);
  const directoryName = path.basename(targetDir);
  const slug = toPluginSlug(options.slug || directoryName);

  if (!slug || !KEBAB_CASE_REGEX.test(slug)) {
    throw new Error('Plugin name must contain at least one letter or number and produce a kebab-case slug.');
  }

  const pluginId = options.id || `com.example.${slug}`;
  if (!REVERSE_DOMAIN_ID_REGEX.test(pluginId)) {
    throw new Error('Plugin ID must use reverse-domain format, for example com.example.my-plugin.');
  }

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Target directory "${targetDir}" is not empty.`);
  }

  const displayName = options.name || toPluginName(slug);
  const publisher = options.publisher || 'Community Developer';
  const manifest = {
    $schema: 'https://classroomio.com/schemas/plugin-manifest.v1.json',
    manifestVersion: 1,
    id: pluginId,
    slug,
    name: displayName,
    version: '0.1.0',
    description: `${displayName} for ClassroomIO.`,
    publisher,
    icon: { resource: 'assets/icon.svg' },
    license: 'MIT',
    engines: {
      classroomio: '>=1.0.0',
      pluginApi: '1.0.0'
    },
    runtime: {
      ui: {
        entrypoints: {
          main: {
            renderMode: 'custom',
            resource: 'dist/index.html'
          }
        }
      }
    },
    permissions: {
      required: [],
      optional: []
    },
    contributes: {
      pages: [
        {
          id: 'main',
          entrypoint: 'main',
          title: displayName
        }
      ],
      navigation: [
        {
          id: `${slug}-navigation`,
          title: displayName,
          location: 'organization.settings',
          page: 'main'
        }
      ]
    },
    dataPolicy: {
      storesCustomerData: false,
      retentionAfterUninstallDays: 0
    }
  };
  const packageJson = {
    name: slug,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      'build:ui': 'vite build',
      pack: 'cio-plugin build',
      seed: 'cio-plugin dev',
      preview: 'vite preview'
    },
    dependencies: {
      '@classroomio/plugin-sdk': '^1.0.0'
    },
    devDependencies: {
      typescript: '^5.5.2',
      vite: '^5.4.0'
    }
  };
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${displayName}</title>
  </head>
  <body>
    <main class="card">
      <img src="./assets/icon.svg" alt="" width="48" height="48" />
      <h1>${displayName}</h1>
      <p id="status">Connecting to ClassroomIO…</p>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
  const mainTs = `import { createClassroomIOClient } from '@classroomio/plugin-sdk/client';
import './style.css';

const client = createClassroomIOClient();
const status = document.querySelector<HTMLParagraphElement>('#status');

void client.context.get().then((context) => {
  if (status) status.textContent = \`Connected to \${context.pluginId}\`;
});
`;
  const styleCss = `:root {
  color: var(--cio-foreground, #172033);
  background: var(--cio-background, #f8fafc);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  padding: 2rem;
}

.card {
  max-width: 36rem;
  padding: 1.5rem;
  border: 1px solid var(--cio-border, #dbe2ea);
  border-radius: 0.75rem;
  background: var(--cio-card, #ffffff);
}

h1 {
  margin: 1rem 0 0.5rem;
}

p {
  margin: 0;
  color: var(--cio-muted-foreground, #64748b);
}
`;
  const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  base: './'
});
`;
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      useDefineForClassFields: true,
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      noEmit: true,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      types: ['vite/client']
    },
    include: ['src', 'vite.config.ts']
  };
  const readme = `# ${displayName}

## Develop the UI

\`\`\`bash
npm install
npm run dev
\`\`\`

To install a packaged development release in one local ClassroomIO organization, run this with the
Vite server stopped:

\`\`\`bash
export CLASSROOMIO_API_URL=http://localhost:3002
export CLASSROOMIO_DEV_TOKEN=<organization-api-key-with-plugin-development-scope>
export CLASSROOMIO_ORG_ID=<organization-id>
npm run seed -- --org "$CLASSROOMIO_ORG_ID"
\`\`\`

## Build the UI

\`\`\`bash
npm run build
\`\`\`

To create the immutable plugin archive, run \`npm run pack\` after the UI build.

## Contributing

To publish this plugin to ClassroomIO:
1. Ensure \`npm run build\` and \`npm run pack\` pass locally.
2. Fork \`classroomio-plugins\` on GitHub.
3. Add your plugin directory and register it in \`registry/plugins.json\`.
4. Submit a pull request to \`classroomio-plugins\`.
5. Once merged, trusted release CI publishes the approved artifact to production storage and registers the release.
`;
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="18" height="18" x="3" y="3" rx="2" />
  <path d="M7 7h10M7 12h10M7 17h10" />
</svg>
`;

  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'public', 'assets'), { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(targetDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), `${JSON.stringify(tsconfig, null, 2)}\n`);
  fs.writeFileSync(path.join(targetDir, 'vite.config.ts'), viteConfig);
  fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(targetDir, 'src', 'main.ts'), mainTs);
  fs.writeFileSync(path.join(targetDir, 'src', 'style.css'), styleCss);
  fs.writeFileSync(path.join(targetDir, 'public', 'assets', 'icon.svg'), iconSvg);
  fs.writeFileSync(path.join(targetDir, '.gitignore'), 'node_modules/\ndist/\n.plugin-artifacts/\n*.tar.gz\n');
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);

  return { targetDir, manifest, packageJson };
}

function printUsage() {
  console.log(`
ClassroomIO Plugin CLI (cio-plugin)

Usage:
  cio-plugin create [directory]        Scaffold a new ClassroomIO plugin starter
  cio-plugin build [path] [options]    Validate, build, and package immutable plugin artifacts
  cio-plugin dev [path] [options]      Install a local development release into one organization

Create Options:
  --id <pluginId>        Reverse-domain plugin ID (default: com.example.<slug>)
  --name <displayName>   Human-readable plugin name
  --publisher <name>     Publisher shown in the catalog

Build Options:
  --registry <path>      Path to plugins.json registry (e.g. registry/plugins.json)

Development Options:
  --host <url>           ClassroomIO API host (default: $CLASSROOMIO_API_URL or http://localhost:3002)
  --token <token>        Development API token (default: $CLASSROOMIO_DEV_TOKEN)
  --org <orgId>          Development organization (default: $CLASSROOMIO_ORG_ID)

Examples:
  npx cio-plugin create my-plugin --id com.acme.my-plugin --publisher "Acme Inc."
  npx cio-plugin build --registry registry/plugins.json
  npx cio-plugin dev --org <organization-id>
`);
}

function parseCliArgs(rawArgs) {
  const options = { _: [] };
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('--')) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      options._.push(arg);
    }
  }
  return options;
}

export async function runCli(argv = process.argv.slice(2)) {
  const cliOptions = parseCliArgs(argv);
  const command = cliOptions._[0] || 'help';
  const targetArg = cliOptions._[1] || '.';

  if (cliOptions.help || cliOptions.h || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  if (command === 'create') {
    const pluginDirectory = targetArg === '.' ? 'my-classroomio-plugin' : targetArg;

    try {
      const result = scaffoldPlugin(pluginDirectory, {
        id: cliOptions.id,
        name: cliOptions.name,
        publisher: cliOptions.publisher,
        slug: cliOptions.slug
      });
      console.log(
        `\n✓ Scaffolded ClassroomIO plugin starter in ${path.relative(process.cwd(), result.targetDir) || '.'}`
      );
    } catch (error) {
      console.error(`\n✖ ${error.message}`);
      process.exit(1);
    }

    console.log(`\nNext steps:`);
    console.log(`  cd ${pluginDirectory}`);
    console.log(`  npm install`);
    console.log(`  npm run build`);
    console.log(`  npm run dev\n`);
    console.log(`  npm run pack`);
    console.log(`  npm run seed -- --org <organization-id>\n`);
    process.exit(0);
  }

  if (command === 'build') {
    const rootDir = targetArg;
    try {
      console.log(`Building plugin artifacts...`);
      const { releases, outputRoot } = buildAllPlugins(rootDir, { registry: cliOptions.registry });
      const verification = verifyArtifacts(outputRoot);
      if (!verification.valid) {
        throw new Error(verification.errors.join('\n'));
      }
      console.log(
        `\nSuccessfully built ${releases.length} plugin release(s) into ${path.relative(process.cwd(), outputRoot) || outputRoot}`
      );
      process.exit(0);
    } catch (err) {
      console.error(`\n✖ ${err.message}`);
      process.exit(1);
    }
  }

  if (command === 'dev') {
    const targetDir = path.resolve(process.cwd(), targetArg === command ? '.' : targetArg);
    const host = (cliOptions.host || process.env.CLASSROOMIO_API_URL || 'http://localhost:3002').replace(/\/$/, '');
    const token = cliOptions.token || process.env.CLASSROOMIO_DEV_TOKEN || '';
    const organizationId = cliOptions.org || process.env.CLASSROOMIO_ORG_ID || '';

    if (!token) {
      console.error('\n✖ Local development requires --token or CLASSROOMIO_DEV_TOKEN.');
      process.exit(1);
    }

    if (!organizationId) {
      console.error('\n✖ Local development requires --org or CLASSROOMIO_ORG_ID.');
      process.exit(1);
    }

    let pkg;
    try {
      pkg = packageSinglePlugin(targetDir);
    } catch (err) {
      console.error(`\n✖ ${err.message}`);
      process.exit(1);
    }

    try {
      const response = await fetch(`${host}/plugins/development/releases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          manifest: pkg.manifest,
          artifactDigest: pkg.artifactDigest,
          archive: pkg.tarGzBuffer.toString('base64'),
          organizationId
        })
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      console.log(`✓ Installed ${pkg.manifest.id}@${pkg.manifest.version} in ${organizationId}.`);
      process.exit(0);
    } catch (error) {
      console.error(`\n✖ Local development release failed: ${error.message}`);
      process.exit(1);
    }
  }

  printUsage();
  process.exit(1);
}

const isMain =
  process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
    process.argv[1].endsWith('cio-plugin.mjs') ||
    process.argv[1].endsWith('cio-plugin'));

if (isMain) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
