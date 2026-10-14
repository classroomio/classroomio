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

function printUsage() {
  console.log(`
ClassroomIO Plugin CLI (cio-plugin)

Usage:
  cio-plugin validate [path]   Validate plugin.json manifest
  cio-plugin pack [path]       Build and package canonical immutable plugin tarball (.tar.gz)
  cio-plugin digest <path>     Compute deterministic SHA-256 digest of a directory or file
  cio-plugin init [name]       Scaffold a new ClassroomIO plugin starter

Examples:
  npx cio-plugin validate
  npx cio-plugin pack ./my-plugin
  npx cio-plugin init my-awesome-plugin
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
  const rootDir = path.resolve(process.cwd(), targetArg);
  const outputRoot = path.join(rootDir, '.plugin-artifacts');

  const singleManifest = path.join(rootDir, 'plugin.json');
  let pluginDirs = [];

  if (fs.existsSync(singleManifest)) {
    pluginDirs = [rootDir];
  } else {
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
    const manifestPath = path.join(pluginDir, 'plugin.json');
    const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestRaw);

    const validation = validateManifest(manifest);
    if (!validation.valid) {
      console.error(`\n✖ Invalid manifest in ${path.relative(process.cwd(), pluginDir)}:`);
      for (const err of validation.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }

    console.log(`Packaging ${manifest.id}@${manifest.version}...`);

    const filesToPackage = [];

    // 1. plugin.json
    filesToPackage.push({
      path: 'plugin.json',
      content: Buffer.from(manifestRaw, 'utf8'),
      mode: 0o644
    });

    // 2. assets (e.g. icon if present outside dist)
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

    // 3. UI assets in dist/ if runtime.ui declared
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

      for (const file of filesUnder(distDir)) {
        filesToPackage.push({
          path: `dist/${file.relativePath}`,
          content: fs.readFileSync(file.absolutePath),
          mode: 0o644
        });
      }
    }

    // 4. Generate inventory.json
    const inventory = {
      schemaVersion: 1,
      pluginId: manifest.id,
      version: manifest.version,
      generatedAt: new Date().toISOString(),
      files: filesToPackage.map((f) => {
        return {
          path: f.path,
          size: f.content.length,
          digest: digestBuffer(f.content)
        };
      })
    };

    const inventoryBuffer = Buffer.from(JSON.stringify(inventory, null, 2) + '\n', 'utf8');
    filesToPackage.push({
      path: 'inventory.json',
      content: inventoryBuffer,
      mode: 0o644
    });

    // 5. Generate deterministic tar.gz
    const tarGzBuffer = createDeterministicTarGz(filesToPackage);
    const artifactDigest = digestBuffer(tarGzBuffer);
    const archiveFileName = `${manifest.id}-${manifest.version}.tar.gz`;

    // 6. Write to output directory
    const pluginOutputDir = path.join(outputRoot, manifest.id, manifest.version);
    fs.mkdirSync(pluginOutputDir, { recursive: true });

    const archivePath = path.join(pluginOutputDir, archiveFileName);
    fs.writeFileSync(archivePath, tarGzBuffer);

    // Also extract for local dev backwards compatibility
    const unpackedDir = path.join(pluginOutputDir, artifactDigest);
    fs.rmSync(unpackedDir, { recursive: true, force: true });
    fs.mkdirSync(unpackedDir, { recursive: true });

    for (const f of filesToPackage) {
      const destPath = path.join(unpackedDir, f.path);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, f.content);
    }

    const slug = manifest.slug || manifest.id.replace(/^([a-z0-9_-]+\.)+/i, '');

    releases.push({
      pluginId: manifest.id,
      slug,
      version: manifest.version,
      artifactDigest,
      archive: path.relative(rootDir, archivePath),
      manifest,
      inventory: inventory.files,
      artifactDirectory: path.relative(rootDir, unpackedDir)
    });

    console.log(`✓ Built canonical package: ${archiveFileName} (${artifactDigest})`);
    console.log(`  Included ${filesToPackage.length} files in archive`);
  }

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'release-index.json'), `${JSON.stringify({ releases }, null, 2)}\n`);
  console.log(
    `\nSuccessfully packed ${releases.length} plugin release(s) into ${path.relative(process.cwd(), outputRoot)}`
  );
  process.exit(0);
}

printUsage();
process.exit(1);
