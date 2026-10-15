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

export function packageSinglePlugin(pluginDir) {
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

  const filesToPackage = [];

  // 1. plugin.json
  filesToPackage.push({
    path: 'plugin.json',
    content: Buffer.from(manifestRaw, 'utf8'),
    mode: 0o644
  });

  // 2. assets
  if (manifest.icon?.resource) {
    const iconPath = path.join(pluginDir, manifest.icon.resource);
    if (fs.existsSync(iconPath)) {
      filesToPackage.push({
        path: manifest.icon.resource,
        content: fs.readFileSync(iconPath),
        mode: 0o644
      });
    } else {
      console.warn(`Warning: Icon file not found at ${manifest.icon.resource}`);
    }
  }

  // 3. UI assets
  if (manifest.runtime?.ui) {
    const distDir = path.join(pluginDir, 'dist');
    if (!fs.existsSync(distDir)) {
      console.log(`Building UI assets for ${manifest.id}...`);
      const build = spawnSync('npm', ['run', 'build'], { cwd: pluginDir, stdio: 'inherit' });
      if (build.status !== 0) {
        throw new Error(`Build failed for ${manifest.id}`);
      }
    }

    if (!fs.existsSync(distDir)) {
      throw new Error(`Error: ${manifest.id} did not produce a dist directory at ${distDir}`);
    }

    for (const file of filesUnder(distDir)) {
      filesToPackage.push({
        path: `dist/${file.relativePath}`,
        content: fs.readFileSync(file.absolutePath),
        mode: 0o644
      });
    }
  }

  // 4. inventory.json
  const inventory = {
    schemaVersion: 1,
    pluginId: manifest.id,
    version: manifest.version,
    generatedAt: new Date().toISOString(),
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

export function buildAllPlugins(rootDir = '.') {
  const resolvedRoot = path.resolve(process.cwd(), rootDir);
  const outputRoot = path.join(resolvedRoot, '.plugin-artifacts');

  const singleManifest = path.join(resolvedRoot, 'plugin.json');
  let pluginDirs = [];

  if (fs.existsSync(singleManifest)) {
    pluginDirs = [resolvedRoot];
  } else {
    pluginDirs = fs
      .readdirSync(resolvedRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(resolvedRoot, entry.name, 'plugin.json')))
      .map((entry) => path.join(resolvedRoot, entry.name));
  }

  if (pluginDirs.length === 0) {
    throw new Error(`No plugin.json found in ${resolvedRoot} or its direct subdirectories.`);
  }

  const releases = [];

  for (const pluginDir of pluginDirs) {
    console.log(`Packaging plugin in ${path.relative(process.cwd(), pluginDir) || '.'}...`);
    const pkg = packageSinglePlugin(pluginDir);

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

export async function seedPlugins(targetDir = '.', options = {}) {
  const resolvedTarget = path.resolve(process.cwd(), targetDir);
  const host = (options.host || process.env.CLASSROOMIO_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const serverKey =
    options.serverKey ||
    options['server-key'] ||
    process.env.CLASSROOMIO_SERVER_KEY ||
    process.env.PRIVATE_SERVER_KEY ||
    '';
  const token = options.token || process.env.CLASSROOMIO_TOKEN || '';
  const autoInstall = Boolean(options.autoInstall || options['auto-install']);
  const organizationId = options.org || options.organizationId;
  const lane = options.lane;

  const releaseIndexPath = path.join(resolvedTarget, '.plugin-artifacts', 'release-index.json');
  let releases = [];

  if (fs.existsSync(releaseIndexPath)) {
    const data = JSON.parse(fs.readFileSync(releaseIndexPath, 'utf8'));
    releases = data.releases ?? [];
  } else {
    const built = buildAllPlugins(resolvedTarget);
    releases = built.releases;
  }

  if (releases.length === 0) {
    throw new Error(`No plugin releases found to seed in ${resolvedTarget}`);
  }

  const results = [];

  for (const release of releases) {
    const { manifest, artifactDigest } = release;
    console.log(`Seeding ${manifest.id}@${manifest.version} to ${host}...`);

    if (serverKey) {
      const res = await fetch(`${host}/internal/plugins/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverKey}`
        },
        body: JSON.stringify({
          manifest,
          artifactDigest
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to seed release ${manifest.id}@${manifest.version} (${res.status}): ${errText}`);
      }

      console.log(`✓ Registered and approved release ${manifest.id}@${manifest.version}`);
    } else {
      const intentHeaders = { 'Content-Type': 'application/json' };
      if (token) intentHeaders.Authorization = `Bearer ${token}`;

      const releaseLane =
        lane || (manifest.id.startsWith('com.classroomio.') ? 'first-party' : organizationId ? 'private' : 'community');

      const intentRes = await fetch(`${host}/plugins/submissions/intent`, {
        method: 'POST',
        headers: intentHeaders,
        body: JSON.stringify({
          pluginId: manifest.id,
          version: manifest.version,
          releaseLane,
          artifactDigest,
          ...(organizationId && { organizationId })
        })
      });

      if (!intentRes.ok) {
        const errText = await intentRes.text();
        throw new Error(`Submission intent failed for ${manifest.id} (${intentRes.status}): ${errText}`);
      }

      const { submission, uploadUrl } = (await intentRes.json()).data;

      const archiveCandidate = path.resolve(resolvedTarget, release.archive);
      if (!fs.existsSync(archiveCandidate)) {
        throw new Error(`Archive file not found: ${archiveCandidate}`);
      }
      const archiveBuffer = fs.readFileSync(archiveCandidate);

      const fullUploadUrl = uploadUrl.startsWith('http') ? uploadUrl : `${host}${uploadUrl}`;
      const uploadRes = await fetch(fullUploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/gzip' },
        body: archiveBuffer
      });

      if (!uploadRes.ok) {
        throw new Error(`Archive upload failed for ${manifest.id}`);
      }

      const completeHeaders = {};
      if (token) completeHeaders.Authorization = `Bearer ${token}`;
      const completeRes = await fetch(`${host}/plugins/submissions/${submission.id}/complete`, {
        method: 'POST',
        headers: completeHeaders
      });

      if (!completeRes.ok) {
        const errText = await completeRes.text();
        throw new Error(`Submission complete failed for ${manifest.id}: ${errText}`);
      }

      console.log(`✓ Submitted ${manifest.id}@${manifest.version}`);
    }

    let installedOrgs = [];
    if (autoInstall) {
      if (!serverKey) {
        console.warn(
          `Warning: --auto-install requires --server-key or CLASSROOMIO_SERVER_KEY. Skipping installation for ${manifest.id}.`
        );
      } else {
        const installRes = await fetch(`${host}/internal/plugins/dev-install`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serverKey}`
          },
          body: JSON.stringify({
            pluginId: manifest.id,
            version: manifest.version,
            ...(organizationId && { organizationId })
          })
        });

        if (!installRes.ok) {
          const errText = await installRes.text();
          console.warn(`Warning: Auto-install failed for ${manifest.id} (${installRes.status}): ${errText}`);
        } else {
          const installJson = await installRes.json();
          installedOrgs = installJson.data.installedOrgs || [];
          console.log(`✓ Auto-installed ${manifest.id}@${manifest.version} in ${installedOrgs.length} organization(s)`);
        }
      }
    }

    results.push({
      pluginId: manifest.id,
      version: manifest.version,
      installedOrgs
    });
  }

  return results;
}

function printUsage() {
  console.log(`
ClassroomIO Plugin CLI (cio-plugin)

Usage:
  cio-plugin validate [path]           Validate plugin.json manifest
  cio-plugin build [path] [--all]      Build and package canonical immutable plugin tarball (.tar.gz)
  cio-plugin pack [path]               Alias for build
  cio-plugin verify [path]             Verify built artifact directory and checksum integrity
  cio-plugin seed [path] [options]     Seed built plugins into ClassroomIO database via API
  cio-plugin publish [path] [options]  Publish plugin package to ClassroomIO registry
  cio-plugin status <submissionId>     Check status of a plugin submission
  cio-plugin digest <path>             Compute deterministic SHA-256 digest of a directory or file
  cio-plugin init [name]               Scaffold a new ClassroomIO plugin starter

Seed Options:
  --host <url>           ClassroomIO API host (default: $CLASSROOMIO_API_URL or http://localhost:3000)
  --server-key <key>     Server admin key for direct seed & auto-install ($CLASSROOMIO_SERVER_KEY)
  --token <token>        Publisher API token (default: $CLASSROOMIO_TOKEN)
  --auto-install         Automatically install seeded plugin across all dev organizations
  --org <orgId>          Target organization ID (optional)
  --lane <lane>          Release lane: first-party | private | community

Publish Options:
  --host <url>           ClassroomIO API host (default: $CLASSROOMIO_API_URL or http://localhost:3000)
  --token <token>        Publisher API token (default: $CLASSROOMIO_TOKEN)
  --lane <lane>          Release lane: first-party | private | community (default: auto-detected)
  --org <orgId>          Organization ID (required for private plugins)

Examples:
  npx cio-plugin build --all
  npx cio-plugin verify
  npx cio-plugin seed --auto-install
  npx cio-plugin publish ./my-plugin --host http://localhost:3000
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
  const command = cliOptions._[0] || (cliOptions.help || cliOptions.h ? 'help' : 'pack');
  const targetArg = cliOptions._[1] || '.';

  if (cliOptions.help || cliOptions.h || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  if (command === 'digest') {
    const target = path.resolve(process.cwd(), targetArg);
    if (!fs.existsSync(target)) {
      console.error(`Error: File or directory not found: ${target}`);
      process.exit(1);
    }
    const isDir = fs.statSync(target).isDirectory();
    const digest = isDir ? digestDirectory(target) : digestFile(target);
    console.log(digest);
    process.exit(0);
  }

  if (command === 'validate') {
    const targetDir = path.resolve(process.cwd(), targetArg);
    const manifestPath = fs.existsSync(path.join(targetDir, 'plugin.json'))
      ? path.join(targetDir, 'plugin.json')
      : path.resolve(process.cwd(), 'plugin.json');

    if (!fs.existsSync(manifestPath)) {
      console.error(`Error: plugin.json not found at ${manifestPath}`);
      process.exit(1);
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const result = validateManifest(manifest);
      if (!result.valid) {
        console.error(`\n✖ Manifest validation failed with ${result.errors.length} issue(s):`);
        for (const err of result.errors) {
          console.error(`  - ${err}`);
        }
        process.exit(1);
      }
      console.log(`✓ Valid plugin manifest: ${manifest.id}@${manifest.version} (${manifest.name})`);
      process.exit(0);
    } catch (err) {
      console.error(`Error parsing plugin.json: ${err.message}`);
      process.exit(1);
    }
  }

  if (command === 'init') {
    const pluginName = targetArg === '.' ? 'my-classroomio-plugin' : targetArg;
    const targetDir = path.resolve(process.cwd(), pluginName);

    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
      console.error(`Error: Target directory "${targetDir}" is not empty.`);
      process.exit(1);
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

    const slug = pluginName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '');
    const pluginId = `com.example.${slug}`;

    const manifest = {
      $schema: 'https://classroomio.com/schemas/plugin-manifest.v1.json',
      manifestVersion: 1,
      id: pluginId,
      slug,
      name: pluginName
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      version: '1.0.0',
      description: 'A custom plugin extension for ClassroomIO.',
      publisher: 'Community Developer',
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
        required: ['course.metadata:read'],
        optional: []
      },
      contributes: {
        pages: [
          {
            id: 'main-page',
            entrypoint: 'main',
            title: 'Plugin Main Page'
          }
        ],
        navigation: [
          {
            id: `${slug}-nav`,
            title: 'Plugin App',
            location: 'organization.settings',
            page: 'main-page'
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
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        validate: 'cio-plugin validate',
        pack: 'cio-plugin pack'
      },
      dependencies: {
        '@classroomio/plugin-sdk': '^1.0.0'
      },
      devDependencies: {
        typescript: '^5.5.2',
        vite: '^5.4.0'
      }
    };

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${manifest.name}</title>
  </head>
  <body class="bg-slate-50 p-6 font-sans text-slate-900">
    <div id="app">
      <h1 class="text-xl font-bold">${manifest.name}</h1>
      <p class="mt-2 text-sm text-slate-600">Welcome to your ClassroomIO plugin extension!</p>
    </div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
`;

    const mainTs = `import { createClassroomIOPluginClient } from '@classroomio/plugin-sdk';

console.log('ClassroomIO Plugin initialized');
`;

    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="18" height="18" x="3" y="3" rx="2" />
  <path d="M7 7h10" />
  <path d="M7 12h10" />
  <path d="M7 17h10" />
</svg>
`;

    fs.writeFileSync(path.join(targetDir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    fs.writeFileSync(path.join(targetDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
    fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml);
    fs.writeFileSync(path.join(targetDir, 'src/main.ts'), mainTs);
    fs.writeFileSync(path.join(targetDir, 'assets/icon.svg'), iconSvg);
    fs.writeFileSync(path.join(targetDir, '.gitignore'), `node_modules/\ndist/\n.plugin-artifacts/\n*.tar.gz\n`);

    console.log(`\n✓ Scaffolded ClassroomIO plugin starter in ${path.relative(process.cwd(), targetDir) || '.'}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${pluginName}`);
    console.log(`  npm install`);
    console.log(`  npm run dev`);
    console.log(`  npx cio-plugin pack\n`);
    process.exit(0);
  }

  if (command === 'pack' || command === 'build') {
    const rootDir = targetArg;
    try {
      console.log(`Building plugin artifacts...`);
      const { releases, outputRoot } = buildAllPlugins(rootDir);
      console.log(
        `\nSuccessfully packed ${releases.length} plugin release(s) into ${path.relative(process.cwd(), outputRoot) || outputRoot}`
      );
      process.exit(0);
    } catch (err) {
      console.error(`\n✖ ${err.message}`);
      process.exit(1);
    }
  }

  if (command === 'verify') {
    const targetDir = targetArg;
    console.log(`Verifying plugin artifacts in ${targetDir}...`);
    const result = verifyArtifacts(targetDir);
    if (!result.valid) {
      console.error(`\n✖ Plugin artifact verification failed with ${result.errors.length} violation(s):`);
      for (const err of result.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }
    console.log(`✓ Verified ${result.count} plugin artifact release(s). All checksums and resources intact.`);
    process.exit(0);
  }

  if (command === 'seed') {
    const targetDir = targetArg;
    const host = (cliOptions.host || process.env.CLASSROOMIO_API_URL || 'http://localhost:3000').replace(/\/$/, '');
    const serverKey =
      cliOptions['server-key'] ||
      cliOptions.serverKey ||
      process.env.CLASSROOMIO_SERVER_KEY ||
      process.env.PRIVATE_SERVER_KEY ||
      '';
    const token = cliOptions.token || process.env.CLASSROOMIO_TOKEN || '';
    const autoInstall = Boolean(cliOptions['auto-install'] || cliOptions.autoInstall);
    const organizationId = cliOptions.org || cliOptions.organizationId;
    const lane = cliOptions.lane;

    try {
      console.log(`Seeding plugins to ${host}...`);
      const results = await seedPlugins(targetDir, {
        host,
        serverKey,
        token,
        autoInstall,
        organizationId,
        lane
      });
      console.log(`\n✓ Successfully seeded ${results.length} plugin(s)!`);
      process.exit(0);
    } catch (err) {
      console.error(`\n✖ Seeding failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (command === 'publish' || command === 'submit') {
    const targetDir = path.resolve(process.cwd(), targetArg === 'publish' || targetArg === 'submit' ? '.' : targetArg);
    const host = (cliOptions.host || process.env.CLASSROOMIO_API_URL || 'http://localhost:3000').replace(/\/$/, '');
    const token = cliOptions.token || process.env.CLASSROOMIO_TOKEN || '';
    const orgId = cliOptions.org || cliOptions.organizationId;

    let pkg;
    try {
      pkg = packageSinglePlugin(targetDir);
    } catch (err) {
      console.error(`\n✖ ${err.message}`);
      process.exit(1);
    }

    const lane =
      cliOptions.lane ||
      (pkg.manifest.id.startsWith('com.classroomio.') ? 'first-party' : orgId ? 'private' : 'community');

    console.log(`\nSubmitting ${pkg.manifest.id}@${pkg.manifest.version} to ${host} (lane: ${lane})...`);

    try {
      // 1. Create intent
      const intentHeaders = { 'Content-Type': 'application/json' };
      if (token) intentHeaders['Authorization'] = `Bearer ${token}`;

      const intentBody = {
        pluginId: pkg.manifest.id,
        version: pkg.manifest.version,
        releaseLane: lane,
        artifactDigest: pkg.artifactDigest,
        ...(orgId && { organizationId: orgId })
      };

      const intentRes = await fetch(`${host}/plugins/submissions/intent`, {
        method: 'POST',
        headers: intentHeaders,
        body: JSON.stringify(intentBody)
      });

      if (!intentRes.ok) {
        const errText = await intentRes.text();
        console.error(`\n✖ Submission intent failed (${intentRes.status}): ${errText}`);
        process.exit(1);
      }

      const intentJson = await intentRes.json();
      const { submission, uploadUrl } = intentJson.data;
      console.log(`✓ Created submission intent (ID: ${submission.id})`);

      // 2. Upload archive to quarantine
      console.log(`Uploading archive package (${(pkg.tarGzBuffer.length / 1024).toFixed(1)} KB)...`);
      const fullUploadUrl = uploadUrl.startsWith('http') ? uploadUrl : `${host}${uploadUrl}`;
      const uploadRes = await fetch(fullUploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/gzip' },
        body: pkg.tarGzBuffer
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error(`\n✖ Archive upload failed (${uploadRes.status}): ${errText}`);
        process.exit(1);
      }
      console.log(`✓ Quarantined package archive uploaded successfully`);

      // 3. Finalize submission
      console.log(`Validating archive integrity and manifest on registry...`);
      const completeHeaders = {};
      if (token) completeHeaders['Authorization'] = `Bearer ${token}`;

      const completeRes = await fetch(`${host}/plugins/submissions/${submission.id}/complete`, {
        method: 'POST',
        headers: completeHeaders
      });

      if (!completeRes.ok) {
        const errText = await completeRes.text();
        console.error(`\n✖ Finalization failed (${completeRes.status}): ${errText}`);
        process.exit(1);
      }

      const completeJson = await completeRes.json();
      const finalSub = completeJson.data.submission;

      console.log(`\n========================================================`);
      if (finalSub.status === 'approved') {
        console.log(`✓ Plugin ${pkg.manifest.id}@${pkg.manifest.version} published and approved!`);
        console.log(`  Release Lane: ${finalSub.releaseLane}`);
        console.log(`  Digest:       ${finalSub.artifactDigest}`);
      } else if (finalSub.status === 'in_review') {
        console.log(`✓ Plugin submitted to marketplace review queue!`);
        console.log(`  Submission ID: ${finalSub.id}`);
        console.log(`  Status:        ${finalSub.status}`);
        console.log(`  Track status:  npx cio-plugin status ${finalSub.id} --host ${host}`);
      } else {
        console.log(`Submission status: ${finalSub.status}`);
      }
      console.log(`========================================================\n`);
      process.exit(0);
    } catch (err) {
      console.error(`\n✖ Network error during publish: ${err.message}`);
      process.exit(1);
    }
  }

  if (command === 'status') {
    const submissionId = targetArg;
    if (!submissionId || submissionId === '.') {
      console.error(`Error: Submission ID is required. Example: cio-plugin status <submissionId>`);
      process.exit(1);
    }

    const host = (cliOptions.host || process.env.CLASSROOMIO_API_URL || 'http://localhost:3000').replace(/\/$/, '');
    const token = cliOptions.token || process.env.CLASSROOMIO_TOKEN || '';

    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${host}/plugins/submissions/${submissionId}`, { headers });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`Error (${res.status}): ${errText}`);
        process.exit(1);
      }

      const json = await res.json();
      const sub = json.data;

      console.log(`\nSubmission Details:`);
      console.log(`  ID:           ${sub.id}`);
      console.log(`  Plugin:       ${sub.pluginId}@${sub.version}`);
      console.log(`  Lane:         ${sub.releaseLane}`);
      console.log(`  Status:       ${sub.status}`);
      console.log(`  Digest:       ${sub.artifactDigest}`);
      if (sub.reviewNotes) {
        console.log(`  Review Notes: ${sub.reviewNotes}`);
      }
      console.log(`  Submitted:    ${sub.createdAt}`);
      console.log(`  Updated:      ${sub.updatedAt}\n`);
      process.exit(0);
    } catch (err) {
      console.error(`\n✖ Network error checking status: ${err.message}`);
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
