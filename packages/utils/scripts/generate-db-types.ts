#!/usr/bin/env tsx

import { writeFileSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

// Use a simpler path resolution that doesn't require import.meta
const outputPath = join(process.cwd(), 'src/types/db/index.ts');

// Get all table exports from the schema file and auth-schema file
async function getTableExports() {
  try {
    const tables: string[] = [];

    // Read the main schema file
    const schemaPath = join(process.cwd(), '../db/src/schema.ts');
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    // Look for table exports using regex
    const tableExportRegex = /export\s+const\s+(\w+)\s*=\s*pgTable/g;
    let match;

    while ((match = tableExportRegex.exec(schemaContent)) !== null) {
      tables.push(match[1]);
    }

    // Read the auth-schema file
    const authSchemaPath = join(process.cwd(), '../db/src/auth-schema.ts');
    const authSchemaContent = readFileSync(authSchemaPath, 'utf-8');

    // Look for re-exported tables from auth-schema in the main schema
    // Instead of directly reading auth-schema, check what's re-exported in main schema
    const reExportRegex = /export\s*\{\s*([^}]+)\s*\}/g;
    let reExportMatch;

    while ((reExportMatch = reExportRegex.exec(schemaContent)) !== null) {
      // Parse the exports inside the braces
      const exportedItems = reExportMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      tables.push(...exportedItems);
    }

    console.log(`🔍 Detected ${tables.length} tables from schema files (including re-exported auth tables)`);
    return tables;
  } catch (error) {
    console.warn('⚠️  Could not read schema files, using known tables as fallback');
    // Fallback to known table names if file reading fails
    const knownTables = [
      // Auth tables (only those re-exported in main schema)
      'user',
      'session',
      'account',
      // Main tables
      'profile',
      'course',
      'lesson',
      'lessonSection',
      'exercise',
      'quiz',
      'quizPlay',
      'option',
      'submission',
      'submissionstatus',
      'group',
      'groupAttendance',
      'lessonComment',
      'appsPoll',
      'appsPollOption',
      'appsPollSubmission',
      'organization',
      'organizationmember',
      'organizationContacts',
      'organizationEmaillist',
      'videoTranscripts',
      'currency',
      'analyticsLoginEvents'
    ];
    return knownTables;
  }
}

// Get all enum exports from the schema file
async function getEnumExports() {
  try {
    // Read the schema file directly and parse exports
    const schemaPath = join(process.cwd(), '../db/src/schema.ts');
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
    console.warn('⚠️  Could not read schema file, using known enums as fallback');
    // Fallback to known enums if file reading fails
    return ['courseType', 'courseVersion', 'locale', 'plan'];
  }
}

// Generate the types file content
function generateTypesContent(tableNames: string[], enumNames: string[]) {
  const allImports = [...tableNames, ...enumNames];

  const imports = `// Database types generated from @cio/db/schema using drizzle-zod
// This file is auto-generated. Do not edit manually.

import {
${allImports.map((name) => `  ${name},`).join('\n')}
} from '@cio/db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

`;

  const typeDefinitions = tableNames
    .map((tableName) => {
      const pascalCaseName = tableName.charAt(0).toUpperCase() + tableName.slice(1);

      return `// ${pascalCaseName} schemas
export const insert${pascalCaseName}Schema = createInsertSchema(${tableName});
export const select${pascalCaseName}Schema = createSelectSchema(${tableName});

// ${pascalCaseName} types
export type ${pascalCaseName} = z.infer<typeof select${pascalCaseName}Schema>;
export type New${pascalCaseName} = z.infer<typeof insert${pascalCaseName}Schema>;`;
    })
    .join('\n\n');

  const enumDefinitions =
    enumNames.length > 0
      ? enumNames
          .map((enumName) => {
            const pascalCaseName = enumName.charAt(0).toUpperCase() + enumName.slice(1);
            return `export type ${pascalCaseName}Enum = (typeof ${enumName}.enumValues)[number];`;
          })
          .join('\n')
      : '';

  const enumSection = enumNames.length > 0 ? `\n// Enum types\n${enumDefinitions}\n` : '';

  return imports + typeDefinitions + enumSection;
}

// Main function
async function main() {
  try {
    console.log('🔍 Analyzing database schema...');

    const tableNames = await getTableExports();
    const enumNames = await getEnumExports();

    console.log(`📊 Found ${tableNames.length} tables:`, tableNames.join(', '));
    console.log(`🏷️  Found ${enumNames.length} enums:`, enumNames.join(', '));

    console.log('🏗️  Generating types...');
    const content = generateTypesContent(tableNames, enumNames);

    writeFileSync(outputPath, content, 'utf-8');

    console.log('✅ Types generated successfully!');
    console.log(`📝 Updated: ${outputPath}`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. Run: pnpm build');
    console.log('  2. Import types from @cio/utils/types/db');
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

main();
