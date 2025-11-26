#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';

import { join } from 'path';

// Output to packages/db/src/types.ts
const outputPath = join(process.cwd(), 'src/types.ts');

// Get all table exports from the schema file
async function getTableExports() {
  try {
    const tables: string[] = [];

    // Read the main schema file in the same package
    const schemaPath = join(process.cwd(), 'src/schema.ts');
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    // Look for table exports using regex
    const tableExportRegex = /export\s+const\s+(\w+)\s*=\s*pgTable/g;
    let match;

    while ((match = tableExportRegex.exec(schemaContent)) !== null) {
      tables.push(match[1]);
    }

    console.log(`🔍 Detected ${tables.length} tables from schema files`);
    return tables;
  } catch (error) {
    console.error('❌ Could not read schema files:', error);
    process.exit(1);
  }
}

// Get all enum exports from the schema file
async function getEnumExports() {
  try {
    // Read the schema file directly and parse exports
    const schemaPath = join(process.cwd(), 'src/schema.ts');
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    // Look for enum exports using regex
    const enumExportRegex = /export\s+const\s+(\w+)\s*=\s*pgEnum/g;
    const enums: string[] = [];
    let match;

    while ((match = enumExportRegex.exec(schemaContent)) !== null) {
      enums.push(match[1]);
    }

    console.log(`🏷️  Detected ${enums.length} enums from schema file`);
    return enums;
  } catch (error) {
    console.error('❌ Could not read schema file:', error);
    process.exit(1);
  }
}

// Convert camelCase to SCREAMING_SNAKE_CASE
function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toUpperCase()
    .replace(/^_/, '');
}

// Generate the types file content
function generateTypesContent(tableNames: string[], enumNames: string[]) {
  const imports = `// Database types generated from schema using Drizzle's built-in type inference
// This file contains all TypeScript types for the database
// Naming convention: T prefix for types

import * as schema from './schema';

`;

  const typeDefinitions = tableNames
    .map((tableName) => {
      const pascalCaseName = tableName.charAt(0).toUpperCase() + tableName.slice(1);

      return `export type T${pascalCaseName} = typeof schema.${tableName}.$inferSelect;
export type TNew${pascalCaseName} = typeof schema.${tableName}.$inferInsert;`;
    })
    .join('\n\n');

  const enumDefinitions =
    enumNames.length > 0
      ? enumNames
          .map((enumName) => {
            const pascalCaseName = enumName.charAt(0).toUpperCase() + enumName.slice(1);
            return `export type T${pascalCaseName} = (typeof schema.${enumName}.enumValues)[number];`;
          })
          .join('\n\n')
      : '';

  const enumSection = enumNames.length > 0 ? `\n\n${enumDefinitions}` : '';

  return imports + typeDefinitions + enumSection;
}

// Main function
async function main() {
  try {
    console.log('🔍 Analyzing database schema...');

    const tableNames = await getTableExports();
    const enumNames = await getEnumExports();

    console.log(`📊 Found ${tableNames.length} tables:`, tableNames.slice(0, 10).join(', '), '...');
    console.log(`🏷️  Found ${enumNames.length} enums:`, enumNames.join(', '));

    console.log('🏗️  Generating types...');
    const content = generateTypesContent(tableNames, enumNames);

    writeFileSync(outputPath, content, 'utf-8');

    console.log('✅ Types generated successfully!');
    console.log(`📝 Updated: ${outputPath}`);
    console.log('');
    console.log('💡 Types are now available from @cio/db/types');
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

main();
