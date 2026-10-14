import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = process.cwd();
const candidateRoots = [
  process.env.OFFICIAL_PLUGINS_PATH,
  path.resolve(repositoryRoot, '../classroomio-plugins'),
  path.resolve(repositoryRoot, '../../classroomio-plugins'),
  path.resolve(repositoryRoot, 'classroomio-plugins'),
  path.resolve(repositoryRoot, 'official-plugins')
].filter(Boolean);
const pluginsRepoRoot = candidateRoots.find((directory) => fs.existsSync(directory));

if (!pluginsRepoRoot) {
  throw new Error('Could not find the official plugins repository. Set OFFICIAL_PLUGINS_PATH.');
}

const artifactRoot = path.join(pluginsRepoRoot, '.plugin-artifacts');
const releaseIndexPath = path.join(artifactRoot, 'release-index.json');
if (!fs.existsSync(releaseIndexPath)) {
  throw new Error(`Artifact release index not found at ${releaseIndexPath}. Run pnpm plugins:build-artifacts first.`);
}

const releaseIndex = JSON.parse(fs.readFileSync(releaseIndexPath, 'utf8'));
const violations = [];

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
    violations.push(`${release.pluginId}: invalid artifact resource ${source}`);
    return;
  }

  const releaseDirectory = path.resolve(artifactRoot, release.pluginId, release.version, release.artifactDigest);
  if (!resolvedPath.startsWith(`${releaseDirectory}${path.sep}`) || !fs.existsSync(resolvedPath)) {
    violations.push(`${release.pluginId}: missing artifact resource ${resource}`);
  }
}

function resolveEntrypoint(manifest, entrypointName) {
  const entrypoint = manifest.runtime?.ui?.entrypoints?.[entrypointName];
  return typeof entrypoint === 'string' ? entrypoint : entrypoint?.resource;
}

for (const release of releaseIndex.releases ?? []) {
  const releaseDirectory = path.resolve(artifactRoot, release.pluginId, release.version, release.artifactDigest);
  if (!fs.existsSync(releaseDirectory)) {
    violations.push(`${release.pluginId}: missing release directory`);
    continue;
  }

  const manifest = release.manifest ?? {};
  const entrypoints = manifest.runtime?.ui?.entrypoints ?? {};
  if (manifest.icon?.resource) checkResource(release, manifest.icon.resource, 'plugin icon');
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
    if (action.icon?.resource) checkResource(release, action.icon.resource, `action ${action.id} icon`);
  }

  for (const page of manifest.contributes?.pages ?? []) {
    checkResource(release, resolveEntrypoint(manifest, page.entrypoint), `page ${page.id}`);
  }

  for (const navigation of manifest.contributes?.navigation ?? []) {
    if (navigation.icon?.resource) checkResource(release, navigation.icon.resource, `navigation ${navigation.id} icon`);
  }

  if (!/^sha256-[a-f0-9]{64}$/.test(release.artifactDigest)) {
    violations.push(`${release.pluginId}: invalid artifact digest ${release.artifactDigest}`);
  }

  if (release.archive) {
    const archivePath = path.resolve(artifactRoot, release.archive);
    if (!fs.existsSync(archivePath)) {
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

if (violations.length > 0) {
  for (const violation of violations) console.error(`plugin artifact violation: ${violation}`);
  process.exit(1);
}

console.log(`Verified ${releaseIndex.releases?.length ?? 0} plugin artifact release(s).`);
