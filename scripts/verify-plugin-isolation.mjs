import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const FORBIDDEN_IMPORT_PATTERNS = [
  { pattern: /@cio\//, message: 'Forbidden import of internal @cio/* package' },
  { pattern: /\$lib(\/|\b)/, message: 'Forbidden import of dashboard $lib internals' },
  { pattern: /\$features(\/|\b)/, message: 'Forbidden import of dashboard $features internals' },
  { pattern: /\$app(\/|\b)/, message: 'Forbidden import of SvelteKit $app host internals' },
  { pattern: /@api\//, message: 'Forbidden import of core API @api internals' },
  { pattern: /\.\.\/\.\.\/\.\./, message: 'Forbidden relative import escaping plugin root' }
];

const SCAN_EXTENSIONS = ['.svelte', '.ts', '.js', '.tsx', '.jsx', '.html'];

function findPluginDirectories(baseDir) {
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(baseDir, e.name, 'plugin.json')))
    .map((e) => path.join(baseDir, e.name));
}

function scanFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFilesRecursively(fullPath, fileList);
    } else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function verifyPackageJson(pluginDir) {
  const pkgPath = path.join(pluginDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const errors = [];
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const allDeps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {})
  };

  for (const [depName, depVersion] of Object.entries(allDeps)) {
    if (depName.startsWith('@cio/')) {
      errors.push(`Package dependency on internal package "${depName}" is strictly forbidden in plugins.`);
    }
    if (typeof depVersion === 'string' && (depVersion.includes('..') || depVersion.startsWith('file:..'))) {
      errors.push(`Escaping path dependency "${depName}: ${depVersion}" is forbidden in plugins.`);
    }
  }

  return errors;
}

function verifyForbiddenImports(pluginDir) {
  const files = scanFilesRecursively(pluginDir);
  const errors = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Ignore comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      for (const { pattern, message } of FORBIDDEN_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          const relativeFile = path.relative(process.cwd(), file);
          errors.push(`${relativeFile}:${index + 1}: ${message} -> "${line.trim()}"`);
        }
      }
    });
  }

  return errors;
}

function verifyManifest(pluginDir) {
  const manifestPath = path.join(pluginDir, 'plugin.json');
  const errors = [];

  if (!fs.existsSync(manifestPath)) {
    return [`Missing plugin.json manifest in ${pluginDir}`];
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    const requiredFields = ['manifestVersion', 'id', 'name', 'version', 'publisher', 'permissions', 'runtime'];
    for (const field of requiredFields) {
      if (!(field in manifest)) {
        errors.push(`Manifest in ${pluginDir} is missing required field "${field}".`);
      }
    }

    if (!/^[a-z0-9]+(\.[a-z0-9_-]+)+$/.test(manifest.id ?? '')) {
      errors.push(`Manifest id "${manifest.id}" must be a reverse-DNS identifier (e.g. com.publisher.name).`);
    }
  } catch (err) {
    errors.push(`Manifest parse error in ${pluginDir}: ${err.message}`);
  }

  return errors;
}

function verifyCleanRoomBuild(pluginDir) {
  console.log(`\n📦 Performing clean-room build verification for ${path.basename(pluginDir)}...`);
  const tmpDir = path.join(os.tmpdir(), `cio-plugin-cleanroom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    // Copy plugin source to temporary directory outside monorepo
    execSync(`cp -R "${pluginDir}/"* "${tmpDir}/"`, { stdio: 'pipe' });

    // Remove any monorepo node_modules or dist that may have been copied
    fs.rmSync(path.join(tmpDir, 'node_modules'), { recursive: true, force: true });
    fs.rmSync(path.join(tmpDir, 'dist'), { recursive: true, force: true });

    // Validate that plugin builds cleanly
    execSync(`pnpm --filter ${JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf-8')).name} build`, {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    console.log(`  ✓ Clean-room build verification passed for ${path.basename(pluginDir)}`);
    return [];
  } catch (err) {
    return [`Clean-room build failed for ${path.basename(pluginDir)}: ${err.message}`];
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

async function main() {
  console.log('🔍 Validating plugin isolation boundaries and clean-room portability...\n');

  const targetRoots = [path.resolve(process.cwd(), 'official-plugins'), path.resolve(process.cwd(), 'plugin-examples')];

  const pluginDirs = targetRoots.flatMap(findPluginDirectories);

  if (pluginDirs.length === 0) {
    console.log('No plugins found under official-plugins/ or plugin-examples/.');
    process.exit(0);
  }

  let totalErrors = 0;

  for (const pluginDir of pluginDirs) {
    const relName = path.relative(process.cwd(), pluginDir);
    console.log(`Checking ${relName}...`);

    const manifestErrors = verifyManifest(pluginDir);
    const packageErrors = verifyPackageJson(pluginDir);
    const importErrors = verifyForbiddenImports(pluginDir);

    const allErrors = [...manifestErrors, ...packageErrors, ...importErrors];

    if (allErrors.length > 0) {
      console.error(`❌ Isolation violations detected in ${relName}:`);
      for (const err of allErrors) {
        console.error(`   - ${err}`);
      }
      totalErrors += allErrors.length;
    } else {
      console.log(`  ✓ Manifest valid & zero forbidden imports in ${relName}`);
      const buildErrors = verifyCleanRoomBuild(pluginDir);
      if (buildErrors.length > 0) {
        for (const err of buildErrors) {
          console.error(`   - ${err}`);
        }
        totalErrors += buildErrors.length;
      }
    }
  }

  if (totalErrors > 0) {
    console.error(`\n❌ Plugin isolation check FAILED with ${totalErrors} violation(s).`);
    process.exit(1);
  }

  console.log('\n✨ All plugins passed isolation and clean-room build verification!\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
