#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLUGINS_DIR = join(ROOT, 'plugins');
const EN_TRANSLATIONS_PATH = join(ROOT, 'apps', 'dashboard', 'src', 'lib', 'utils', 'translations', 'en.json');
const PLUGINS_BARREL_PATH = join(PLUGINS_DIR, 'index.ts');
const JOURNAL_PATH = join(PLUGINS_DIR, 'meta', '_journal.json');

const VALID_CATEGORIES = ['activity', 'block', 'integration', 'certificate', 'landing', 'enrollment'];

const VALID_SLOTS = [
  'lms.banner',
  'lesson.activity',
  'lesson.sidebar',
  'course.sidebar',
  'course.format',
  'lesson.after',
  'landing.sections',
  'landing.hero.after',
  'landing.footer.before',
  'certificate.template',
  'certificate.actions',
  'enrollment.flow'
];

// CLI Args parsing
const args = process.argv.slice(2);
let filterPlugin = null;
let strictMode = false;
let jsonMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--plugin' || args[i] === '-p') {
    filterPlugin = args[++i];
  } else if (args[i] === '--strict') {
    strictMode = true;
  } else if (args[i] === '--json') {
    jsonMode = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
ClassroomIO Generic Plugin Verifier

Usage:
  node scripts/verify-plugins.mjs [options]

Options:
  -p, --plugin <name|id>   Audit only a specific plugin (matches folder or plugin id)
  --strict                 Exit with code 1 if any warnings are encountered
  --json                   Output full report in machine-readable JSON format
  -h, --help               Show this help message
`);
    process.exit(0);
  }
}

// Helpers
async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function getRecursiveFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
        files.push(...(await getRecursiveFiles(fullPath)));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignore unreadable
  }
  return files;
}

/** Recursively discover all plugins by locating index.ts files that define a plugin */
async function discoverPlugins(dir) {
  const discovered = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (['node_modules', 'dist', 'meta', 'scripts'].includes(entry.name)) continue;

    const subDir = join(dir, entry.name);
    const indexPath = join(subDir, 'index.ts');

    if (existsSync(indexPath)) {
      const content = await readFile(indexPath, 'utf8');
      if (content.includes('definePlugin') || content.includes('PluginDefinition')) {
        discovered.push({
          dir: subDir,
          relDir: relative(PLUGINS_DIR, subDir).replace(/\\/g, '/'),
          indexPath
        });
        continue;
      }
    }

    // Check nested subdirectories (e.g. plugins/certificate/*, plugins/engagement/*)
    const nested = await discoverPlugins(subDir);
    discovered.push(...nested);
  }

  return discovered;
}

function getNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/** Comprehensive audit of a single discovered plugin */
async function auditPlugin(plugin, enTranslations, barrelContent, journalEntries = []) {
  const errors = [];
  const warnings = [];
  const indexContent = await readFile(plugin.indexPath, 'utf8');
  const allFiles = await getRecursiveFiles(plugin.dir);
  const svelteFiles = allFiles.filter((f) => f.endsWith('.svelte'));

  // 1. Extract Plugin Metadata from index.ts
  const idMatch = indexContent.match(/id:\s*['"]([^'"]+)['"]/);
  const nameMatch = indexContent.match(/name:\s*['"]([^'"]+)['"]/);
  const categoryMatch = indexContent.match(/category:\s*['"]([^'"]+)['"]/);
  const capabilityMatch = indexContent.match(/capabilityId:\s*['"]([^'"]+)['"]/);
  const nameKeyMatch = indexContent.match(/nameKey:\s*['"]([^'"]+)['"]/);
  const descKeyMatch = indexContent.match(/descriptionKey:\s*['"]([^'"]+)['"]/);

  const pluginId = idMatch ? idMatch[1] : null;
  const pluginName = nameMatch ? nameMatch[1] : plugin.relDir;
  const category = categoryMatch ? categoryMatch[1] : null;

  if (!pluginId) {
    errors.push('Manifest error: Missing or unparseable `id` in index.ts');
  }

  if (!category) {
    errors.push('Manifest error: Missing or unparseable `category` in index.ts');
  } else if (!VALID_CATEGORIES.includes(category)) {
    errors.push(`Manifest error: Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // 2. ID Pattern and Category Prefix Guardrail
  if (pluginId && category) {
    const idPattern = /^[a-z0-9]+_[a-z0-9_]+$/;
    if (!idPattern.test(pluginId)) {
      errors.push(
        `Manifest error: Plugin id "${pluginId}" must match {category}_{slug} using lowercase letters and single underscores.`
      );
    }
    const expectedPrefix = `${category}_`;
    if (!pluginId.startsWith(expectedPrefix)) {
      errors.push(`SDK Conformance: Plugin id "${pluginId}" does not start with category prefix "${expectedPrefix}".`);
    }
  }

  // 3. Capability & Translation Verification
  if (capabilityMatch) {
    const capabilityId = capabilityMatch[1];
    if (nameKeyMatch) {
      const nameKey = nameKeyMatch[1];
      if (!getNestedProperty(enTranslations, nameKey)) {
        warnings.push(`Translation missing in en.json: "${nameKey}"`);
      }
    } else {
      warnings.push(`Activation capability "${capabilityId}" is missing nameKey in manifest.`);
    }

    if (descKeyMatch) {
      const descKey = descKeyMatch[1];
      if (!getNestedProperty(enTranslations, descKey)) {
        warnings.push(`Translation missing in en.json: "${descKey}"`);
      }
    } else {
      warnings.push(`Activation capability "${capabilityId}" is missing descriptionKey in manifest.`);
    }
  }

  // 4. Slots Validation
  const slotsBlockMatch = indexContent.match(/slots:\s*\{([^}]+)\}/s);
  if (slotsBlockMatch) {
    const slotsContent = slotsBlockMatch[1];
    const slotLines = slotsContent.split('\n');
    for (const line of slotLines) {
      const slotMatch = line.match(/['"]([^'"]+)['"]\s*:\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/);
      if (slotMatch) {
        const slotName = slotMatch[1];
        const importTarget = slotMatch[2];

        if (!VALID_SLOTS.includes(slotName)) {
          errors.push(`SDK Conformance: Unknown slot name "${slotName}". Valid slots are: ${VALID_SLOTS.join(', ')}`);
        }

        // Verify target file exists
        const targetResolved = resolve(plugin.dir, importTarget);
        const candidates = [targetResolved, `${targetResolved}.svelte`, `${targetResolved}.ts`, `${targetResolved}.js`];
        const exists = candidates.some((c) => existsSync(c));
        if (!exists) {
          errors.push(`Broken slot loader: "${importTarget}" not found on disk.`);
        }
      }
    }
  }

  // 5. Central Barrel Registration (plugins/index.ts)
  if (barrelContent) {
    if (pluginId && !barrelContent.includes(pluginId) && !barrelContent.includes(plugin.relDir)) {
      warnings.push(`Not registered: Plugin "${plugin.relDir}" is not imported or exported in plugins/index.ts.`);
    }
  }

  // 6. Component Quality and "The Cage" Guardrails
  let totalLines = 0;
  for (const file of allFiles) {
    const relFile = relative(plugin.dir, file).replace(/\\/g, '/');
    const content = await readFile(file, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;

    // Rule: Never import from 'lucide-svelte' (must be '@lucide/svelte')
    if (content.includes("from 'lucide-svelte'") || content.includes('from "lucide-svelte"')) {
      errors.push(`Forbidden import: ${relFile} imports 'lucide-svelte'. Must use '@lucide/svelte'.`);
    }

    // Rule: Never import direct DB queries in UI plugins
    if (content.includes('@cio/db/queries') || content.includes('@cio/db')) {
      errors.push(
        `Architecture violation: ${relFile} directly imports database queries. Plugins must use slot contexts, API client, or SDK.`
      );
    }

    if (file.endsWith('.svelte')) {
      // Rule: Svelte 5 runes conformance - no deprecated export let
      if (/export\s+let\s+[a-zA-Z0-9_]+/.test(content)) {
        warnings.push(`Legacy Svelte syntax: ${relFile} uses 'export let'. Use $props() runes instead.`);
      }

      // Rule: Avoid svelte:component in runes mode
      if (content.includes('<svelte:component')) {
        warnings.push(
          `Deprecated syntax: ${relFile} uses '<svelte:component>'. In Svelte 5 runes mode, components are dynamic by default.`
        );
      }

      // Rule: Avoid non-reactive Set / Map in Svelte 5
      if (/let\s+[a-zA-Z0-9_]+\s*=\s*new\s+(Set|Map)\b/.test(content)) {
        warnings.push(
          `Non-reactive collection: ${relFile} instantiates new Set/Map. Prefer SvelteSet/SvelteMap from 'svelte/reactivity'.`
        );
      }

      // Rule: Avoid hardcoded hex colors when design tokens should be used
      const hexMatches = content.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
      if (hexMatches && hexMatches.length > 4 && !content.includes('/* allow-hex */')) {
        warnings.push(
          `Design token violation: ${relFile} contains multiple hardcoded hex colors (${hexMatches.slice(0, 3).join(', ')}). Use @cio/ui theme tokens.`
        );
      }

      // Rule: Pass-through wrapper check (shallow pass-through with no added styling or logic)
      if (
        lines < 15 &&
        content.includes('<') &&
        content.includes('/>') &&
        content.split('<').length <= 3 &&
        !content.includes('<script') &&
        !content.includes('class=')
      ) {
        warnings.push(`Suspected unnecessary pass-through wrapper: ${relFile}`);
      }

      // Rule: Monolith check - warn if single component exceeds 500 lines without compound split
      if (lines > 500) {
        warnings.push(
          `Component size alert: ${relFile} is ${lines} lines. Consider decomposing into compound subcomponents.`
        );
      }
    }
  }

  // 6. Journal Ledger Verification
  if (pluginId && Array.isArray(journalEntries)) {
    const journalEntry = journalEntries.find((e) => e.id === pluginId);
    if (!journalEntry) {
      warnings.push(`Journal Ledger: Plugin "${pluginId}" is not registered in plugins/meta/_journal.json.`);
    }
  }

  const status = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARN' : 'PASS';

  return {
    id: pluginId || plugin.relDir,
    name: pluginName,
    relDir: plugin.relDir,
    category: category || 'unknown',
    status,
    totalLines,
    componentCount: svelteFiles.length,
    errors,
    warnings
  };
}

async function main() {
  if (!jsonMode) {
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🛡️  ClassroomIO Generic Plugin Verifier & Architectural Guardrails');
    console.log('────────────────────────────────────────────────────────────────────────\n');
  }

  // Load translations & central barrel
  let enTranslations = {};
  if (existsSync(EN_TRANSLATIONS_PATH)) {
    try {
      enTranslations = JSON.parse(await readFile(EN_TRANSLATIONS_PATH, 'utf8'));
    } catch {
      // Ignored
    }
  }

  let barrelContent = '';
  if (existsSync(PLUGINS_BARREL_PATH)) {
    barrelContent = await readFile(PLUGINS_BARREL_PATH, 'utf8');
  }

  let journalEntries = [];
  if (existsSync(JOURNAL_PATH)) {
    try {
      const journalJson = JSON.parse(await readFile(JOURNAL_PATH, 'utf8'));
      journalEntries = journalJson.entries || [];
    } catch {
      // Ignored
    }
  }

  // Discover all plugins
  const discovered = await discoverPlugins(PLUGINS_DIR);

  if (discovered.length === 0) {
    console.error('❌ No plugins discovered in plugins/ directory.');
    process.exit(1);
  }

  // Filter if requested
  const targets = filterPlugin
    ? discovered.filter((p) => p.relDir.includes(filterPlugin) || p.relDir.endsWith(filterPlugin))
    : discovered;

  if (targets.length === 0) {
    console.error(`❌ No plugin found matching filter: "${filterPlugin}"`);
    console.log('Available plugins:\n' + discovered.map((p) => `  - ${p.relDir}`).join('\n'));
    process.exit(1);
  }

  const results = [];
  for (const target of targets) {
    const result = await auditPlugin(target, enTranslations, barrelContent, journalEntries);
    results.push(result);
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
    const hasFail = results.some((r) => r.status === 'FAIL');
    const hasWarn = results.some((r) => r.status === 'WARN');
    if (hasFail || (strictMode && hasWarn)) process.exit(1);
    process.exit(0);
  }

  // Formatted Output
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const r of results) {
    if (r.status === 'PASS') {
      passCount++;
      console.log(
        `✅ [PASS] ${r.name.padEnd(35)} │ Cat: ${r.category.padEnd(12)} │ ${r.componentCount} comp (${r.totalLines} lines)`
      );
    } else if (r.status === 'WARN') {
      warnCount++;
      console.log(
        `⚠️  [WARN] ${r.name.padEnd(35)} │ Cat: ${r.category.padEnd(12)} │ ${r.componentCount} comp (${r.totalLines} lines)`
      );
      for (const w of r.warnings) {
        console.log(`   └─ ⚠️  ${w}`);
      }
    } else {
      failCount++;
      console.log(
        `❌ [FAIL] ${r.name.padEnd(35)} │ Cat: ${r.category.padEnd(12)} │ ${r.componentCount} comp (${r.totalLines} lines)`
      );
      for (const e of r.errors) {
        console.log(`   └─ ❌ ${e}`);
      }
      for (const w of r.warnings) {
        console.log(`   └─ ⚠️  ${w}`);
      }
    }
  }

  console.log('\n────────────────────────────────────────────────────────────────────────');
  console.log(
    `📊 Summary: ${results.length} total | ${passCount} passed | ${warnCount} warnings | ${failCount} failed`
  );
  console.log('────────────────────────────────────────────────────────────────────────\n');

  if (failCount > 0 || (strictMode && warnCount > 0)) {
    console.error('❌ Audit failed. Please address the errors listed above before committing.');
    process.exit(1);
  } else {
    console.log('✨ All verified plugins satisfy ClassroomIO architectural guardrails.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unexpected audit error:', err);
  process.exit(1);
});
