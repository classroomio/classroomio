#!/usr/bin/env node

/**
 * Script to add 'ui:' prefix to Tailwind classes in packages/ui
 * Usage: node add-ui-prefix.cjs [--dry-run]
 *
 * This script will:
 * - Find all .svelte, .ts, .tsx, .js, .jsx files in packages/ui/src
 * - Add 'ui:' prefix to Tailwind utility classes
 * - Skip classes that already have the prefix
 * - Preserve existing code structure
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const UI_PREFIX = 'ui:';

// Check if a class looks like a Tailwind utility class
function isTailwindClass(className) {
  // Skip if already has ui: prefix
  if (className.startsWith(UI_PREFIX)) {
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
    /^(rounded|border|outline|shadow|ring|overflow|z-|order-|col-|row-|justify-|items-|content-|self-|place-|object-|cursor-|select-|resize-|appearance-|pointer-events-|visibility-|whitespace-|break-|overflow-|overscroll-|scroll-|will-change-|transform|transition|top|right|bottom|left)/
  ];

  return patterns.some((pattern) => pattern.test(className));
}

// Process a single class string
function processClassString(classString) {
  // Split by whitespace and process each class
  const classes = classString.split(/\s+/).filter((c) => c.trim());
  const processed = classes.map((cls) => {
    if (isTailwindClass(cls)) {
      return `${UI_PREFIX}${cls}`;
    }
    return cls;
  });

  return processed.join(' ');
}

// Process file content
function processFileContent(content) {
  let modified = content;
  let changes = 0;

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
    const processed = processClassString(classes);
    return processed !== classes ? `${attr}="${processed}"` : match;
  });

  // Pattern 1b: class='...' or className='...'
  processAndReplace(/(class|className)='([^']*)'/g, (match, attr, classes) => {
    const processed = processClassString(classes);
    return processed !== classes ? `${attr}='${processed}'` : match;
  });

  // Pattern 2: class={`...`} or className={`...`}
  processAndReplace(/(class|className)=\{`([^`]+)`\}/g, (match, attr, classes) => {
    const processed = processClassString(classes);
    return processed !== classes ? `${attr}={\`${processed}\`}` : match;
  });

  // Pattern 3: class={'...'} or className={'...'}
  processAndReplace(/(class|className)=\{['"]([^'"]+)['"]\}/g, (match, attr, classes) => {
    const processed = processClassString(classes);
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
      const processed = processClassString(classes);
      return processed !== classes ? `${fn}("${processed}"${separator}` : match;
    }
  );

  // Pattern 7: Template literals in function calls: cn(`...`)
  processAndReplace(/(cn|tv)\s*\(`([^`]+)`/g, (match, fn, classes) => {
    const processed = processClassString(classes);
    return processed !== classes ? `${fn}(\`${processed}\`` : match;
  });

  // Pattern 9: tv() function calls with object properties containing Tailwind classes
  // This specifically targets tv() calls and their variant/base properties
  processAndReplace(/tv\s*\(\s*\{([\s\S]*?)\}\s*\)/g, (match, objContent) => {
    // Process all string literals in the tv() object, regardless of nesting level
    let processedObj = objContent;

    // Process double-quoted strings
    processedObj = processedObj.replace(/"([^"]*)"/g, (match, value) => {
      const processed = processClassString(value);
      return processed !== value ? `"${processed}"` : match;
    });

    // Process single-quoted strings
    processedObj = processedObj.replace(/'([^']*)'/g, (match, value) => {
      const processed = processClassString(value);
      return processed !== value ? `'${processed}'` : match;
    });

    // Process template literals
    processedObj = processedObj.replace(/`([^`]*)`/g, (match, value) => {
      const processed = processClassString(value);
      return processed !== value ? `\`${processed}\`` : match;
    });

    return `tv({${processedObj}})`;
  });

  // Pattern 8: class: cn(...) patterns (like in derived props)
  // Matches: class: cn('string1', 'string2', ...)
  processAndReplace(/class:\s*cn\s*\(([^)]+)\)/g, (match, args) => {
    // Use a more sophisticated approach to handle multi-line strings and comments
    let processedArgs = args;

    // Process single-quoted strings: 'content'
    processedArgs = processedArgs.replace(/'([^']*)'/g, (match, content) => {
      const processed = processClassString(content);
      return processed !== content ? `'${processed}'` : match;
    });

    // Process double-quoted strings: "content"
    processedArgs = processedArgs.replace(/"([^"]*)"/g, (match, content) => {
      const processed = processClassString(content);
      return processed !== content ? `"${processed}"` : match;
    });

    return `class: cn(${processedArgs})`;
  });

  return { content: modified, changes };
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: modified, changes } = processFileContent(content);

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

// Main execution
function main() {
  const uiDir = path.join(__dirname);
  const srcDir = path.join(uiDir, 'src');

  if (!fs.existsSync(srcDir)) {
    console.error(`Error: ${srcDir} does not exist`);
    process.exit(1);
  }

  console.log(`Searching for files in ${srcDir}...`);
  const files = findFiles(srcDir);
  console.log(`Found ${files.length} files to process\n`);

  if (DRY_RUN) {
    console.log('DRY RUN MODE - No files will be modified\n');
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
}

main();
