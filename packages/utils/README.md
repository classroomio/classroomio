# @cio/utils

This package provides shared utilities, types, and helper functions used across the ClassroomIO platform.

## Stack

1. TypeScript - For type safety and better developer experience
2. Drizzle-Zod - For generating database types with runtime validation
3. Zod - For schema validation and type inference

## Exports

The package exports utilities through several entry points:

- **Main utilities** (`@cio/utils`) - Core utility functions and helpers
- **Plans** (`@cio/utils/plans`) - Subscription plan related utilities
- **Senja** (`@cio/utils/senja`) - Senja integration utilities  
- **Types** (`@cio/utils/types`) - Shared TypeScript types
- **Database Types** (`@cio/utils/types/db`) - Auto-generated database types with Zod schemas

## Database Types Workflow

The database types are automatically generated from the Drizzle schema using drizzle-zod for better type inference and runtime validation.

### 1. Generate Database Types

When the database schema changes, regenerate the types:

```bash
pnpm generate-types
```

This command:

- Reads the database schema from `@cio/db/schema`
- Detects all tables (including auth tables) and enums
- Generates Zod schemas using `drizzle-zod`
- Creates TypeScript types for insert/select operations
- Outputs to `src/types/db/index.ts`

### 2. Build the Package

After generating types, build the package:

```bash
pnpm build
```

### 3. Usage

Import the generated types in your application:

```typescript
import { 
  User, 
  NewUser, 
  insertUserSchema, 
  selectUserSchema 
} from '@cio/utils/types/db';

// Runtime validation
const validatedUser = insertUserSchema.parse(userData);

// Type inference
const user: User = await getUserById(id);
```

## Development

- **Watch mode**: `pnpm dev` - Automatically rebuilds on file changes
- **Type generation**: `pnpm generate-types` - Regenerate database types
- **Build**: `pnpm build` - Build for production

The type generation script automatically detects tables and enums from the schema files, ensuring your types stay in sync with the database structure.
