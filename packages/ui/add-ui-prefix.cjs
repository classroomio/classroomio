#!/usr/bin/env node

/**
 * Script to add 'ui:' prefix to Tailwind classes in packages/ui
 * Usage:
 *   node add-ui-prefix.cjs              # fix all files
 *   node add-ui-prefix.cjs --dry-run    # list fixes without writing (exit 0)
 *   node add-ui-prefix.cjs --check      # fail if fixes are needed (exit 1)
 *   node add-ui-prefix.cjs --check --staged   # check staged packages/ui files only
 *   node add-ui-prefix.cjs --check --changed  # check changed packages/ui files vs base ref
 *   node add-ui-prefix.cjs --audit            # fail on known prefix corruption patterns
 *
 * Env:
 *   UI_PREFIX_GIT_BASE - optional git ref for --changed (default: origin/main)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CHECK_MODE = process.argv.includes('--check');
const AUDIT_MODE = process.argv.includes('--audit');
const DRY_RUN = process.argv.includes('--dry-run') || CHECK_MODE;
const STAGED_ONLY = process.argv.includes('--staged');
const CHANGED_ONLY = process.argv.includes('--changed');
const UI_PREFIX = 'ui:';
const REPO_ROOT = path.join(__dirname, '../..');
const UI_SRC_DIR = path.join(__dirname, 'src');
const UI_SOURCE_EXTENSIONS = new Set(['.svelte', '.ts', '.tsx', '.js', '.jsx']);

// Collapse duplicate ui: markers (e.g. ui:hover:ui:bg-accent → ui:hover:bg-accent)
function normalizeUiClass(className) {
  if (!className.includes(UI_PREFIX)) {
    return className;
  }

  const stripped = className.split(UI_PREFIX).filter(Boolean).join('');
  return `${UI_PREFIX}${stripped}`;
}

// Check if a class looks like a Tailwind utility class
function isTailwindClass(className) {
  // Skip if already prefixed (including malformed mid-chain ui: after a variant)
  if (className.startsWith(UI_PREFIX) || className.includes(':ui:')) {
    return false;
  }

  // Skip if it's clearly not a Tailwind class (contains special chars that aren't Tailwind)
  // Allow brackets for arbitrary values like w-[100px] and colons for variant prefixes like after:
  if (/[=;{}]/.test(className) && !className.includes('[') && !className.includes(']')) {
    return false;
  }

  // Common Tailwind patterns
  const patterns = [
    // Variant prefixes (must come first to catch all variant combinations)
    // This catches any class that starts with a variant prefix followed by a colon
    /^[a-z-]+(\[.*?\])?(\/.*?)?:/,
    // Layout & Display (including compound classes like inline-flex)
    /^(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|contents|list-item|table|table-row|table-cell|inline-flex|inline-grid|inline-block|inline-table)$/,
    // Flexbox utilities
    /^(shrink|grow|flex-|basis-)/,
    // Spacing (m-, p-, gap-, space-, inset-)
    /^(m|p|mx|my|mt|mr|mb|ml|px|py|pt|pr|pb|pl|gap|space-[xy]|inset)-/,
    // Negative spacing (e.g., -inset-2, -top-1)
    /^-\w+/,
    // Sizing (w-, h-, size-, min-, max-)
    /^(w|h|min-w|min-h|max-w|max-h|size)-/,
    // Typography
    /^(text|font|leading|tracking|text-|font-)/,
    // Colors
    /^(bg|text|border|ring|outline|divide|from|via|to|fill|stroke)-/,
    // Effects
    /^(opacity|shadow|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|backdrop-)/,
    // Transforms
    /^(scale|rotate|translate|skew|transform|origin)-/,
    // Transitions
    /^(transition|duration|ease|delay|animate)-/,
    // Interactivity (specific variants)
    /^(hover|focus|active|disabled|group|peer|aria-|data-):/,
    // Responsive
    /^(sm|md|lg|xl|2xl):/,
    // Dark mode
    /^dark:/,
    // Arbitrary values (must come before general patterns)
    /^[a-z]+-\[/,
    // Arbitrary variants (like [&_svg]:pointer-events-none, after:absolute, etc.)
    /^\[.*\]:|^(after|before|first|last|only|nth|marker|placeholder|selection|backdrop):/,
    // Common utilities
    /^(rounded|border|outline|shadow|ring|overflow|z-|order-|col-|row-|justify-|items-|content-|self-|place-|object-|cursor-|select-|resize-|appearance-|pointer-events-|visibility-|whitespace-|break-|overflow-|overscroll-|scroll-|will-change-|transform|transition|top-|right-|bottom-|left-)/
  ];

  return patterns.some((pattern) => pattern.test(className));
}

function extractScopedClassNames(content) {
  const scoped = new Set();
  const styleBlocks = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi);

  if (!styleBlocks) {
    return scoped;
  }

  for (const block of styleBlocks) {
    const css = block.replace(/<\/?style[^>]*>/gi, '');

    for (const match of css.matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
      scoped.add(match[1]);
    }
  }

  return scoped;
}

function isQuotedJsLiteral(token) {
  return (
    (token.startsWith("'") && token.endsWith("'") && token.length > 1) ||
    (token.startsWith('"') && token.endsWith('"') && token.length > 1)
  );
}

function resolveClassToken(cls, scopedClasses = new Set()) {
  if (isQuotedJsLiteral(cls)) {
    const quote = cls[0];
    const inner = cls.slice(1, -1);
    const processed = processClassTokens(inner, scopedClasses);

    return `${quote}${processed}${quote}`;
  }

  const bareName = cls.startsWith(UI_PREFIX) ? cls.slice(UI_PREFIX.length) : cls;

  // Component-scoped hook classes (defined in <style>) are never Tailwind utilities.
  if (scopedClasses.has(bareName)) {
    return bareName;
  }

  if (cls.includes(UI_PREFIX)) {
    return normalizeUiClass(cls);
  }

  if (isTailwindClass(cls)) {
    return `${UI_PREFIX}${cls}`;
  }

  return cls;
}

function processClassTokens(classString, scopedClasses = new Set()) {
  const classes = classString.split(/\s+/).filter((c) => c.trim());
  return classes.map((cls) => resolveClassToken(cls, scopedClasses)).join(' ');
}

// Process a single class string
function processClassString(classString, scopedClasses = new Set()) {
  return processClassTokens(classString, scopedClasses);
}

function repairCorruptedQuotedPrefixes(content) {
  return content.replace(/ui:'([^']*)'/g, "'ui:$1'").replace(/ui:"([^"]*)"/g, '"ui:$1"');
}

function processInterpolatedSegments(value, scopedClasses, expressionPattern) {
  const parts = value.split(expressionPattern);

  return parts.reduce((result, part, index) => {
    const isExpression = index % 2 === 1;
    const processed = isExpression
      ? processQuotedClassStrings(part, scopedClasses)
      : processClassString(part, scopedClasses);

    if (result.length === 0) {
      return processed;
    }

    const needsSpace = processed.length > 0 && result.length > 0 && !result.endsWith(' ') && !processed.startsWith(' ');

    return `${result}${needsSpace ? ' ' : ''}${processed}`;
  }, '');
}

function processClassAttributeValue(value, scopedClasses = new Set()) {
  return processInterpolatedSegments(value, scopedClasses, /(\{[^}]*\})/g);
}

function processTemplateClassAttributeValue(value, scopedClasses = new Set()) {
  return processInterpolatedSegments(value, scopedClasses, /(\$\{[^}]*\})/g);
}

function processQuotedClassStrings(content, scopedClasses = new Set()) {
  let processed = content;

  processed = processed.replace(/'([^']*)'/g, (match, quoted) => {
    const result = processClassString(quoted, scopedClasses);
    return result !== quoted ? `'${result}'` : match;
  });

  processed = processed.replace(/"([^"]*)"/g, (match, quoted) => {
    const result = processClassString(quoted, scopedClasses);
    return result !== quoted ? `"${result}"` : match;
  });

  return processed;
}

// Process file content
function processFileContent(content, scopedClasses = new Set()) {
  let modified = repairCorruptedQuotedPrefixes(content);
  let changes = modified !== content ? 1 : 0;

  // Helper to process and count changes
  function processAndReplace(pattern, replacer) {
    modified = modified.replace(pattern, (match, ...args) => {
      const result = replacer(match, ...args);
      if (result !== match) {
        changes++;
      }
      return result;
    });
  }

  // Pattern 1: class="..." or className="..."
  processAndReplace(/(class|className)="([^"]*)"/g, (match, attr, classes) => {
    const processed = processClassAttributeValue(classes, scopedClasses);
    return processed !== classes ? `${attr}="${processed}"` : match;
  });

  // Pattern 1b: class='...' or className='...'
  processAndReplace(/(class|className)='([^']*)'/g, (match, attr, classes) => {
    const processed = processClassAttributeValue(classes, scopedClasses);
    return processed !== classes ? `${attr}='${processed}'` : match;
  });

  // Pattern 2: class={`...`} or className={`...`}
  processAndReplace(/(class|className)=\{`([^`]+)`\}/g, (match, attr, classes) => {
    const processed = processTemplateClassAttributeValue(classes, scopedClasses);
    return processed !== classes ? `${attr}={\`${processed}\`}` : match;
  });

  // Pattern 3: class={'...'} or className={'...'}
  processAndReplace(/(class|className)=\{['"]([^'"]+)['"]\}/g, (match, attr, classes) => {
    const processed = processClassString(classes, scopedClasses);
    return processed !== classes ? `${attr}={\`${processed}\`}` : match;
  });

  // Pattern 4: DISABLED - Too broad, was catching JavaScript object properties
  // Pattern 4: String literals in object properties: base: "...", default: '...', etc.
  // This handles tv() calls and similar object literals
  // Match any property followed by a string that looks like it contains Tailwind classes
  // DISABLED: This was catching JavaScript object properties incorrectly
  // processAndReplace(/(\w+)\s*:\s*["']([^"']+)["']/g, (match, key, value) => {
  //   // Check if value contains Tailwind classes
  //   // Skip if it's clearly not a class string (contains =, :, ; that aren't part of Tailwind syntax)
  //   if (/[=:;]/.test(value) && !value.includes('[') && !value.includes(']')) {
  //     return match;
  //   }

  //   const classes = value.split(/\s+/).filter((c) => c.trim());
  //   const hasTailwind = classes.some((c) => isTailwindClass(c));

  //   if (hasTailwind) {
  //     const processed = processClassString(value);
  //     // Preserve original quote style
  //     const quote = match.includes("'") ? "'" : '"';
  //     return processed !== value ? `${key}: ${quote}${processed}${quote}` : match;
  //   }
  //   return match;
  // });

  // Pattern 5: DISABLED - Too broad, was catching JavaScript object properties
  // Pattern 5: Template literals in object properties: base: `...`
  // DISABLED: This was catching JavaScript object properties incorrectly
  // processAndReplace(/(\w+)\s*:\s*`([^`]+)`/g, (match, key, value) => {
  //   // Similar check as above
  //   if (/[=:;]/.test(value) && !value.includes('[') && !value.includes(']')) {
  //     return match;
  //   }

  //   const classes = value.split(/\s+/).filter((c) => c.trim());
  //   const hasTailwind = classes.some((c) => isTailwindClass(c));

  //   if (hasTailwind) {
  //     const processed = processClassString(value);
  //     return processed !== value ? `${key}: \`${processed}\`` : match;
  //   }
  //   return match;
  // });

  // Pattern 6: Simple string literals in function calls: cn("..."), tv({...})
  // Only process specific functions that are known to contain Tailwind classes
  // This pattern matches strings that are the first argument and have no complex expressions
  const tailwindFunctionNames = ['cn', 'tv', 'clsx', 'classNames'];
  processAndReplace(
    new RegExp(`(${tailwindFunctionNames.join('|')})\\s*\\(\\s*['"]([^'"]+)['"]\\s*([,)])`, 'g'),
    (match, fn, classes, separator) => {
      const processed = processClassString(classes, scopedClasses);
      return processed !== classes ? `${fn}("${processed}"${separator}` : match;
    }
  );

  // Pattern 7: Template literals in function calls: cn(`...`)
  processAndReplace(/(cn|tv)\s*\(`([^`]+)`/g, (match, fn, classes) => {
    const processed = processClassString(classes, scopedClasses);
    return processed !== classes ? `${fn}(\`${processed}\`` : match;
  });

  // Pattern 9: tv() function calls with object properties containing Tailwind classes
  // This specifically targets tv() calls and their variant/base properties
  processAndReplace(/tv\s*\(\s*\{([\s\S]*?)\}\s*\)/g, (match, objContent) => {
    // Process all string literals in the tv() object, regardless of nesting level
    let processedObj = objContent;

    // Process double-quoted strings
    processedObj = processedObj.replace(/"([^"]*)"/g, (match, value) => {
      const processed = processClassString(value, scopedClasses);
      return processed !== value ? `"${processed}"` : match;
    });

    // Process single-quoted strings
    processedObj = processedObj.replace(/'([^']*)'/g, (match, value) => {
      const processed = processClassString(value, scopedClasses);
      return processed !== value ? `'${processed}'` : match;
    });

    // Process template literals
    processedObj = processedObj.replace(/`([^`]*)`/g, (match, value) => {
      const processed = processClassString(value, scopedClasses);
      return processed !== value ? `\`${processed}\`` : match;
    });

    return `tv({${processedObj}})`;
  });

  // Pattern 8: class: cn(...) patterns (like in derived props)
  // Matches: class: cn('string1', 'string2', ...)
  processAndReplace(/class:\s*cn\s*\(([^)]+)\)/g, (match, args) => {
    const processedArgs = processQuotedClassStrings(args, scopedClasses);
    return processedArgs !== args ? `class: cn(${processedArgs})` : match;
  });

  // Pattern 8b: class={cn(...)} in Svelte markup (supports embedded quotes in class strings)
  processAndReplace(/class=\{cn\s*\(([\s\S]*?)\)\}/g, (match, args) => {
    const processedArgs = processQuotedClassStrings(args, scopedClasses);
    return processedArgs !== args ? `class={cn(${processedArgs})}` : match;
  });

  return { content: modified, changes };
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const scopedClasses = path.extname(filePath) === '.svelte' ? extractScopedClassNames(content) : new Set();
    const { content: modified, changes } = processFileContent(content, scopedClasses);

    if (changes > 0) {
      if (DRY_RUN) {
        console.log(`[DRY RUN] Would update ${filePath} (${changes} changes)`);
      } else {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`✓ Updated ${filePath} (${changes} changes)`);
      }
      return changes;
    }
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Recursively find all relevant files
function findFiles(dir, extensions = ['.svelte', '.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  // Files to exclude
  const excludedFiles = ['output.css'];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules and other ignored directories
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        files.push(...findFiles(fullPath, extensions));
      } else if (entry.isFile()) {
        // Skip excluded files
        if (excludedFiles.includes(entry.name)) {
          continue;
        }

        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

function runGitPaths(args) {
  const result = spawnSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const errorOutput = result.stderr || result.stdout || `git ${args.join(' ')} failed`;
    throw new Error(errorOutput.trim());
  }

  return result.stdout.split('\0').filter(Boolean);
}

function isUiSourceFile(relativePath) {
  if (!relativePath.startsWith('packages/ui/src/')) {
    return false;
  }

  return UI_SOURCE_EXTENSIONS.has(path.extname(relativePath));
}

function getScopedGitFiles(mode) {
  let paths = [];

  if (mode === 'staged') {
    paths = runGitPaths(['diff', '--name-only', '-z', '--cached', '--diff-filter=ACMR']);
  } else if (mode === 'changed') {
    const baseRef = process.env.UI_PREFIX_GIT_BASE || 'origin/main';
    paths = runGitPaths(['diff', '--name-only', '-z', '--diff-filter=ACMR', `${baseRef}...HEAD`]);
  }

  return paths.filter(isUiSourceFile).map((relativePath) => path.join(REPO_ROOT, relativePath));
}

function resolveFilesToProcess(srcDir) {
  if (STAGED_ONLY) {
    return getScopedGitFiles('staged');
  }

  if (CHANGED_ONLY) {
    return getScopedGitFiles('changed');
  }

  return findFiles(srcDir);
}

const AUDIT_PATTERNS = [
  {
    id: 'corrupted-quoted-prefix',
    label: 'ui:\'...\' / ui:"..." (prefix script broke Svelte/JS string literals)',
    regex: /ui:['"]/
  },
  {
    id: 'double-variant-prefix',
    label: 'ui:variant:ui:utility (duplicate ui: inside variant chains)',
    regex: /ui:[a-z0-9_-]+:ui:/
  },
  {
    id: 'inverted-variant-prefix',
    label: 'variant:ui:utility (ui: after variant instead of at start)',
    regex: /(?:^|[\s"'`{])(?:hover|focus|active|disabled|dark|sm|md|lg|xl|2xl|group-hover|peer-focus):ui:/
  }
];

function auditScopedHookMismatches(filePath, content) {
  const findings = [];

  if (!filePath.endsWith('.svelte')) {
    return findings;
  }

  const scoped = extractScopedClassNames(content);

  for (const cls of scoped) {
    const prefixed = `${UI_PREFIX}${cls}`;
    const pattern = new RegExp(`class=["'\`][^"'\`]*${prefixed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    if (pattern.test(content)) {
      findings.push({
        id: 'scoped-hook-prefixed',
        label: `<style> hook .${cls} prefixed as ${prefixed} in markup`,
        sample: prefixed
      });
    }
  }

  return findings;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const pattern of AUDIT_PATTERNS) {
    if (pattern.regex.test(content)) {
      findings.push({ id: pattern.id, label: pattern.label, sample: content.match(pattern.regex)?.[0] });
    }
  }

  return findings.concat(auditScopedHookMismatches(filePath, content));
}

function runAudit() {
  const files = resolveFilesToProcess(UI_SRC_DIR);
  let issueCount = 0;

  console.log(`Auditing ${files.length} file(s) in packages/ui/src for prefix corruption...\n`);

  for (const file of files) {
    const findings = auditFile(file);

    if (findings.length === 0) {
      continue;
    }

    issueCount += findings.length;
    console.log(file);

    for (const finding of findings) {
      console.log(`  - ${finding.label}${finding.sample ? ` (e.g. ${finding.sample})` : ''}`);
    }

    console.log('');
  }

  if (issueCount > 0) {
    console.error(`❌ Found ${issueCount} prefix corruption issue(s).`);
    process.exit(1);
  }

  console.log('✓ No known prefix corruption patterns found.');
}

// Main execution
function main() {
  if (AUDIT_MODE) {
    runAudit();
    return;
  }

  if (!fs.existsSync(UI_SRC_DIR)) {
    console.error(`Error: ${UI_SRC_DIR} does not exist`);
    process.exit(1);
  }

  const scopeLabel = STAGED_ONLY ? 'staged' : CHANGED_ONLY ? 'changed' : 'all';
  const files = resolveFilesToProcess(UI_SRC_DIR);

  if (files.length === 0) {
    console.log(`No ${scopeLabel} packages/ui source files to check.`);
    process.exit(0);
  }

  console.log(`Checking ${files.length} ${scopeLabel} file(s) in packages/ui/src...\n`);

  if (DRY_RUN) {
    console.log(`${CHECK_MODE ? 'CHECK MODE' : 'DRY RUN MODE'} - No files will be modified\n`);
  }

  let totalChanges = 0;
  let filesChanged = 0;

  for (const file of files) {
    const changes = processFile(file);
    if (changes > 0) {
      filesChanged++;
      totalChanges += changes;
    }
  }

  console.log(`\n${DRY_RUN ? 'Would process' : 'Processed'} ${filesChanged} files with ${totalChanges} total changes`);

  if (CHECK_MODE && filesChanged > 0) {
    console.error('\n❌ packages/ui Tailwind classes must use the ui: prefix.');
    console.error("Run 'pnpm --filter @cio/ui prefix' to fix, then commit again.");
    process.exit(1);
  }
}

main();
