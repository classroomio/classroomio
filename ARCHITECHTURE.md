# API Route Development Guide

## Overview

This guide outlines the standard practices for creating new API routes in ClassroomIO. **All routes should be designed with the assumption they may become public API endpoints**, requiring careful attention to consistency, security, validation, and documentation.

---

## Architecture Layers

Our API follows a four-layer architecture with shared validation:

```txt
┌─────────────────────────────────────┐
│   Frontend (Svelte/SvelteKit)      │
│   - UI Components                   │
│   - API Client (RPC with Hono)     │
│   - Client-side Validation          │
└──────────────┬──────────────────────┘
               │
               │  ┌────────────────────────────┐
               │  │  Shared Validation Layer   │
               ├──┤  (@cio/utils/validation)   │
               │  │  - Zod Schemas             │
               │  │  - Type Definitions        │
               │  └────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Route Layer (Hono)                │
│   - HTTP Request/Response           │
│   - Input Validation (Zod)          │
│   - Authentication Check            │
│   - Calls Services                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Service Layer                     │
│   - Business Logic                  │
│   - Transaction Orchestration       │
│   - Error Handling                  │
│   - Calls Queries                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Query Layer (Drizzle ORM)         │
│   - Database Operations             │
│   - Pure Functions                  │
│   - Type-Safe Queries               │
└─────────────────────────────────────┘
```

**Key Principles**:

- **Shared Validation**: Zod schemas in `@cio/utils/validation` used by both API and frontend
- **Routes**: Handle HTTP concerns only (validation, auth, serialization)
- **Services**: Contain all business logic and orchestrate queries
- **Queries**: Pure database operations with no business logic

---

## Type Generation

**Location**: `packages/db/src/types.ts` (auto-generated)

### How Types Are Generated

Types are automatically generated from your Drizzle schema using Drizzle's built-in type inference:

```typescript
// packages/db/src/types.ts (auto-generated - DO NOT EDIT)
import * as schema from './schema';

// For each table, two types are generated:
export type TUser = typeof schema.user.$inferSelect; // For reading
export type TNewUser = typeof schema.user.$inferInsert; // For creating

export type TOrganization = typeof schema.organization.$inferSelect;
export type TNewOrganization = typeof schema.organization.$inferInsert;
```

**To regenerate types after schema changes:**

```bash
cd packages/db
pnpm generate-types
```

This script:

1. Reads `src/schema.ts` to find all tables and enums
2. Generates type definitions using Drizzle's `$inferSelect` and `$inferInsert`
3. Outputs to `src/types.ts`
4. Formats the file with Prettier

**When to regenerate:**

- ✏️ After adding/removing tables in `schema.ts`
- ✏️ After adding/removing columns in existing tables
- ✏️ After changing column types or constraints
- ℹ️ **Not needed** for data changes (migrations) - only for schema definition changes

---

## Step 1: Create Reusable Queries

**Location**: `packages/db/src/queries/{domain}/{entity}.ts`

### Principles

1. **Pure Functions**: Queries should be pure database operations with no business logic
2. **Single Responsibility**: Each query does one thing well
3. **Type Safety**: Leverage Drizzle's type inference for automatic types
4. **Reusability**: Queries can be used across multiple routes and services

### Example: Organization Queries

```typescript
// packages/db/src/queries/organization/organization.ts
import * as schema from '@db/schema';
import { db } from '@db/drizzle';
import { eq } from 'drizzle-orm';
import type { TNewOrganization, TOrganization } from '@db/types';

/**
 * Creates a new organization
 * @param data Organization creation data
 * @returns Created organization record
 */
export const createOrganization = async (data: TNewOrganization) => {
  const [organization] = await db.insert(schema.organization).values(data).returning();

  return organization;
};

/**
 * Updates an organization
 * @param id Organization ID
 * @param data Partial organization data
 * @returns Updated organization record
 */
export const updateOrganization = async (id: string, data: TOrganization) => {
  const [organization] = await db
    .update(schema.organization)
    .set(data)
    .where(eq(schema.organization.id, id))
    .returning();

  return organization;
};
```

**Type System:**

- Types are auto-generated from Drizzle schema using built-in inference
- `TNewOrganization` = `typeof schema.organization.$inferInsert` (for creates)
- `TOrganization` = `typeof schema.organization.$inferSelect` (for reads/updates)
- Input validation happens at the API route layer (not in queries)
- Queries are pure database operations with compile-time type safety

### Query Best Practices

#### ✅ DO

- **Use exported types from `@cio/db/types`** (e.g., `TNewOrganization`, `TOrganization`)
- **Use `TNew{Table}` types** for create operations (e.g., `TNewOrganization`)
- **Use `T{Table}` types** for read operations (e.g., `TOrganization`)
- **Use `Partial<T{Table}>` types** for update operations (e.g., `Partial<TOrganization>`)
- Use descriptive names (`getOrganizationByProfileId`, not `getOrg`)
- Add JSDoc comments for all exported functions
- Return inferred types from Drizzle
- Use `.returning()` for insert/update operations to get the created/updated record
- Use `.limit(1)` for single-record queries
- Handle null/undefined cases explicitly
- Rely on Drizzle's compile-time type safety

#### ❌ DON'T

- Define ad-hoc types when `@cio/db/types` exports them
- Add runtime validation in queries (validation belongs in API routes)
- Include business logic in queries (authorization, side effects)
- Make HTTP calls or external API calls from queries
- Access environment variables directly
- Handle transactions within individual queries (do this at service layer)
- Throw custom `AppError` (let database errors bubble up)
- Mix concerns (e.g., sending emails from a query function)

### Export Queries

```typescript
// packages/db/src/queries/organization/index.ts
export * from './organization';
export * from './types';

// packages/db/src/queries/index.ts
export * from './organization';
export * from './auth';
export * from './course';
```

---

## Step 2: Create Services (Business Logic)

**Location**: `apps/api/src/services/{domain}.ts`

### Principles

1. **Business Logic Only**: Services contain business rules, validations, and orchestration
2. **Transaction Management**: Services handle database transactions
3. **Error Handling**: Services throw meaningful errors that routes can handle
4. **Testable**: Services should be easy to unit test
5. **No HTTP Concerns**: Services don't know about requests/responses

### Example: Organization Service

```typescript
// apps/api/src/services/onboarding.ts
import { db } from '@cio/db/drizzle';
import {
  createOrganization,
  createOrganizationMember,
  checkSiteNameExists,
  getOrganizationByProfileId
} from '@cio/db/queries/organization';
import { updateProfile } from '@cio/db/queries/auth';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TProfile } from '@cio/db/types';

/**
 * Creates a new organization with the user as owner
 */
export async function createOrganizationWithOwner(
  profileId: string,
  input: { orgName: string; siteName: string; fullname?: string }
) {
  // Business Logic: Check sitename availability
  const exists = await checkSiteNameExists(input.siteName);
  if (exists) {
    throw new AppError(`Site name '${input.siteName}' already exists`, ErrorCodes.SITENAME_EXISTS, 409);
  }

  // Business Logic: Create org and member in a transaction
  try {
    const result = await db.transaction(async (tx) => {
      const organization = await createOrganization({
        name: input.orgName,
        siteName: input.siteName
      });

      const member = await createOrganizationMember({
        organizationId: organization.id,
        profileId,
        roleId: 1, // Owner role
        verified: true
      });

      return { organization, member };
    });

    // Fetch updated organizations list
    const organizations = await getOrganizationByProfileId(profileId);

    return {
      organization: result.organization,
      member: result.member,
      organizations
    };
  } catch (error) {
    // Handle database constraint violations
    if (error.code === '23505') {
      throw new AppError(`Site name '${input.siteName}' already exists`, ErrorCodes.SITENAME_EXISTS, 409);
    }
    throw new AppError('Failed to create organization', ErrorCodes.ORG_CREATE_FAILED, 500);
  }
}
```

### Error Handling in Services

Use `AppError` for consistent error handling across services:

```typescript
// apps/api/src/utils/errors.ts
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: ContentfulStatusCode = 500,
    public field?: string // Optional: for field-specific validation errors
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  SITENAME_EXISTS: 'SITENAME_EXISTS',
  ORG_CREATE_FAILED: 'ORG_CREATE_FAILED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND'
  // ... add more as needed
} as const;
```

**Why?** One reusable class scales infinitely vs creating custom error classes for every scenario.

### Error Handling in Routes

Use the `handleError` utility for consistent error responses across all routes:

```typescript
// apps/api/src/utils/errors.ts
export const handleError = (
  c: Context,
  error: unknown,
  fallbackMessage: string = 'An unexpected error occurred',
  fallbackCode: string = ErrorCodes.INTERNAL_ERROR
) => {
  console.error('Error in route:', error);

  if (error instanceof AppError) {
    return c.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        field: error.field
      },
      error.statusCode
    );
  }

  return c.json(
    {
      success: false,
      error: fallbackMessage,
      code: fallbackCode
    },
    500
  );
};
```

**Usage in routes:**

```typescript
// Simple usage with default message
try {
  const data = await someService();
  return c.json({ success: true, data });
} catch (error) {
  return handleError(c, error);
}

// With custom fallback message
try {
  const data = await fetchAccount(userId);
  return c.json({ success: true, data });
} catch (error) {
  return handleError(c, error, 'Failed to fetch account data');
}

// With custom fallback message AND error code
try {
  await deliverEmail(data);
  return c.json({ success: true });
} catch (error) {
  return handleError(c, error, 'Failed to send email', 'EMAIL_SEND_FAILED');
}
```

**Benefits:**

- ✅ **Consistency**: All routes return the same error format
- ✅ **DRY**: No repetitive error handling code
- ✅ **Type-safe**: Proper TypeScript types for responses
- ✅ **Flexible**: Custom fallback messages per route
- ✅ **Field-aware**: Supports field-specific validation errors

### Service Best Practices

#### ✅ DO

- **Use descriptive function names** that explain the business operation
- **Throw `AppError`** with appropriate error codes and status codes
- **Handle transactions** within services
- **Validate business rules** (e.g., checking if sitename exists)
- **Return structured data** that routes can easily serialize
- **Add JSDoc comments** explaining the business logic
- **Keep services focused** on a specific domain

#### ❌ DON'T

- Return HTTP responses (status codes, headers)
- Access request/response objects directly
- Handle HTTP-specific concerns (CORS, cookies, etc.)
- Mix multiple domains in one service (keep focused)
- Catch errors just to log them (let them bubble up)
- Create custom error classes for every error type (use `AppError`)

### Export Services

```typescript
// apps/api/src/services/onboarding.ts
export * from './onboarding';

// apps/api/src/services/index.ts
export * from './onboarding';
export * from './account';
export * from './course';
```

---

## Step 3: Create API Route

**Location**: `apps/api/src/routes/{domain}/{entity}.ts`

### Public API Standards

Since routes may be exposed as public APIs, follow these standards rigorously:

#### 1. **Consistent Response Format**

All API responses should follow a consistent structure:

```typescript
// Success Response
{
  "success": true,
  "data": { ... },          // The actual response data
  "message": "Optional"     // Optional human-readable message
}

// Error Response
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",     // Optional: machine-readable error code
  "field": "fieldName"      // Optional: for validation errors, indicates which field failed
}

// List Response (with pagination)
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 2. **HTTP Status Codes**

Use semantically correct HTTP status codes:

| Code                        | Meaning      | Usage                                                    |
| --------------------------- | ------------ | -------------------------------------------------------- |
| `200 OK`                    | Success      | Successful GET, PUT, PATCH requests                      |
| `201 Created`               | Created      | Successful POST creating a new resource                  |
| `204 No Content`            | Success      | Successful DELETE or update with no response body        |
| `400 Bad Request`           | Client Error | Malformed request, validation errors                     |
| `401 Unauthorized`          | Auth Error   | Missing or invalid authentication token                  |
| `403 Forbidden`             | Auth Error   | Authenticated but not authorized for this action         |
| `404 Not Found`             | Client Error | Resource doesn't exist                                   |
| `409 Conflict`              | Client Error | Duplicate resource (e.g., email/sitename already exists) |
| `422 Unprocessable Entity`  | Client Error | Valid syntax but semantic validation failed              |
| `429 Too Many Requests`     | Client Error | Rate limit exceeded                                      |
| `500 Internal Server Error` | Server Error | Unexpected server error                                  |
| `503 Service Unavailable`   | Server Error | Temporary service outage                                 |

#### 3. **Input Validation with Zod**

**Always validate all input** using Zod schemas. Define ALL validation schemas in `packages/utils/src/validation/` organized by entity.

**Why in utils package?**

- ✅ Shared between API (server-side validation) and Dashboard (client-side validation)
- ✅ Single source of truth - no schema duplication
- ✅ Type-safe across the entire monorepo
- ✅ Convention-based translations (clean schemas without hardcoded messages)

**File Structure**:

```txt
packages/utils/src/validation/
  ├── course/
  │   ├── course.ts      ← All course validation schemas
  │   └── index.ts       ← Re-exports
  ├── mail/
  │   ├── mail.ts        ← Mail validation schemas
  │   └── index.ts       ← Re-exports
  ├── constants.ts       ← Shared constants
  ├── index.ts           ← Main exports
  └── README.md          ← Documentation
```

**Example: Course Validations.**

Schemas should be **clean** - only validation rules, no error messages:

```typescript
// packages/utils/src/validation/course/course.ts
import * as z from 'zod';
import { ALLOWED_CONTENT_TYPES } from '../constants';

export const ZCourseClone = z.object({
  id: z.string().min(1), // No hardcoded message
  title: z.string().min(1), // No hardcoded message
  description: z.string().optional(),
  slug: z.string().min(1),
  organizationId: z.string().min(1)
});
export type TCourseClone = z.infer<typeof ZCourseClone>;

// packages/utils/src/validation/course/index.ts
export * from './course';
```

**Using in API Routes**:

```typescript
// apps/api/src/routes/course/clone.ts
import { ZCourseClone } from '@cio/utils/validation/course';
import { zValidator } from '@hono/zod-validator';

export const cloneRouter = new Hono().post('/', authMiddleware, zValidator('json', ZCourseClone), async (c) => {
  const data = c.req.valid('json'); // Fully typed!
  // ... route handler
});
```

**Using in Frontend Forms**:

```typescript
// apps/dashboard/src/components/CourseForm.svelte
import { ZCourseClone } from '@cio/utils/validation/course';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

const result = ZCourseClone.safeParse(formData);

if (!result.success) {
  // Maps Zod errors to translated messages using convention
  // Pass 'course' as entity name for entity-specific translations
  errors = mapZodErrorsToTranslations(result.error, 'course');
  // errors.title = "Course title is required" (translated)
}
```

**Convention-Based Translations**:

Frontend maps validation errors to translations using a **smart fallback system**:

1. **Entity-specific**: `validations.{entityName}.{fieldName}.{errorCode}` (most specific)
2. **Generic field**: `validations.{fieldName}.{errorCode}` (fallback)
3. **Generic type**: `validations.generic.{errorType}` (last resort)

This allows different messages for shared field names (e.g., "Course title is required" vs "Lesson title is required"):

```json
// apps/dashboard/src/lib/utils/translations/en.json
{
  "validations": {
    // Entity-specific translations (preferred)
    "course": {
      "title": { "too_small": "Course title is required" },
      "slug": { "too_small": "Course slug is required" }
    },
    "lesson": {
      "title": { "too_small": "Lesson title is required" },
      "duration": { "too_small": "Lesson duration must be at least 1 minute" }
    },

    // Generic field translations (fallback for fields used across entities)
    "title": { "too_small": "Title is required" },
    "email": { "invalid_email": "Please enter a valid email address" },

    // Generic error type translations (last resort)
    "generic": {
      "required": "This field is required",
      "invalid_email": "Invalid email address",
      "too_small_string": "Must be at least {min} characters"
    }
  }
}
```

**Entity Name Usage**:

```typescript
// With entity name (entity-specific messages)
mapZodErrorsToTranslations(error, 'course'); // "Course title is required"
mapZodErrorsToTranslations(error, 'lesson'); // "Lesson title is required"

// Without entity name (generic messages)
mapZodErrorsToTranslations(error); // "Title is required"
```

**Key Principles**:

- **Keep schemas clean**: No hardcoded error messages (translations handled in frontend)
- **Single source of truth**: One schema used by both API and frontend
- **Entity-specific translations**: Use entity name parameter for context-specific error messages
- **Smart fallbacks**: Entity-specific → Generic field → Generic type → Hardcoded
- **Follow naming convention**: Schemas with `Z` prefix, types with `T` prefix
- **Organize by entity**: Each entity gets its own folder

---

#### 4. **Translation Strategy**

**Overview**: Our validation system uses a **convention-based translation approach** with smart fallbacks to provide flexible, maintainable error messages.

##### Translation Lookup Order

When a validation error occurs, the system tries translation keys in this order:

1. **Entity-specific** (most specific): `validations.course.title.too_small`
2. **Generic field** (fallback): `validations.title.too_small`
3. **Generic type** (last resort): `validations.generic.too_small_string`
4. **Hardcoded fallback**: "Must be at least 1 character"

##### When to Use Entity-Specific Translations

Use entity names when:

✅ **Shared field names** across entities

- Example: Both Course and Lesson have `title`, but need different context
- Solution: `mapZodErrorsToTranslations(error, 'course')` vs `mapZodErrorsToTranslations(error, 'lesson')`

✅ **Entity-specific context** matters

- Example: "Course description helps students understand..." vs "Lesson description explains..."
- Better UX with contextual messaging

✅ **Business domain clarity**

- Makes error messages more professional and domain-specific

Skip entity names when:

❌ **Universal fields** that mean the same everywhere

- Example: `email`, `password`, `firstName` - same validation message across all entities

❌ **Unique field names** that only exist in one entity

- Example: `certificateTemplate` only in Course entity

❌ **Generic utility forms** where entity context isn't relevant

##### Translation File Organization

```json
{
  "validations": {
    // 1. Entity-specific (for shared field names)
    "course": {
      "title": {
        "too_small": "Course title is required",
        "too_big": "Course title must be less than 100 characters"
      },
      "description": {
        "too_small": "Please add a course description to help students"
      }
    },
    "lesson": {
      "title": {
        "too_small": "Lesson title is required",
        "too_big": "Lesson title must be less than 100 characters"
      },
      "duration": {
        "too_small": "Lesson must be at least 1 minute long"
      }
    },

    // 2. Generic field-level (fallback for common fields)
    "title": {
      "too_small": "Title is required"
    },
    "email": {
      "invalid_email": "Please enter a valid email address"
    },
    "password": {
      "too_small": "Password must be at least 8 characters"
    },

    // 3. Generic error types (last resort fallback)
    "generic": {
      "required": "This field is required",
      "invalid_email": "Invalid email address",
      "invalid_url": "Invalid URL format",
      "too_small_string": "Must be at least {min} characters",
      "too_big_string": "Must be at most {max} characters",
      "invalid_type": "Invalid value type",
      "invalid_enum": "Invalid selection"
    }
  }
}
```

##### Implementation Examples

**Example 1: Entity-specific (Course form).**

```typescript
import { ZCourseCreate } from '@cio/utils/validation/course';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

const result = ZCourseCreate.safeParse(formData);
if (!result.success) {
  errors = mapZodErrorsToTranslations(result.error, 'course');
  // Result: "Course title is required" (entity-specific)
}
```

**Example 2: Generic (User profile form).**

```typescript
import { ZUserProfile } from '@cio/utils/validation/user';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

const result = ZUserProfile.safeParse(formData);
if (!result.success) {
  errors = mapZodErrorsToTranslations(result.error);
  // Result: "Please enter a valid email address" (generic)
}
```

**Example 3: Mixed fields.**

```typescript
// Course has both shared fields (title) and unique fields (certificateTemplate)
const result = ZCourseUpdate.safeParse(formData);
if (!result.success) {
  errors = mapZodErrorsToTranslations(result.error, 'course');
  // errors.title = "Course title is required" (entity-specific)
  // errors.email = "Please enter a valid email address" (generic fallback)
}
```

##### Benefits of This Approach

✅ **Flexible**: Use entity-specific messages only where needed  
✅ **Scalable**: Add new entities without updating all translations  
✅ **Maintainable**: Clear fallback hierarchy reduces duplication  
✅ **Developer-friendly**: Works with or without entity name parameter  
✅ **Multi-language**: Same system works across all locales  
✅ **Professional UX**: Context-specific messages improve user experience

---

#### 5. **Authentication & Authorization**

```typescript
import { authMiddleware } from '@api/middlewares/auth';

// Protected route - requires authentication
.post('/create', authMiddleware, async (c) => {
  const user = c.get('user'); // Always available after authMiddleware
  const session = c.get('session');
  // ...
});

// Public endpoint - no authentication required
.get('/public-courses', async (c) => {
  // Publicly accessible data
});

// Optional authentication - checks if user is logged in but doesn't require it
.get('/courses', async (c) => {
  const user = c.get('user'); // May be null
  if (user) {
    // Show personalized content
  } else {
    // Show public content
  }
});
```

### Complete Route Example

Routes should be thin - they handle HTTP concerns and delegate to services:

```typescript
// apps/api/src/routes/organization/organization.ts
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { zValidator } from '@hono/zod-validator';
import { createOrganizationWithOwner } from '@api/services/organization';
import { handleError } from '@api/utils/errors';
import { ZCreateOrg } from '@cio/utils/validation/organization';

export const organizationRouter = new Hono().post(
  '/create',
  authMiddleware,
  zValidator('json', ZCreateOrg),
  async (c) => {
    try {
      const user = c.get('user');
      const body = c.req.valid('json');

      const result = await createOrganizationWithOwner(user.id, body);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create organization');
    }
  }
);
```

**Key Points:**

- Route is ~20 lines - clean and focused
- Single line error handling using `handleError` utility
- Automatically handles `AppError` instances with correct status codes
- No error code → status code mapping needed
- Easy to test service independently
- Route only handles HTTP concerns (validation, auth, response formatting)

### Route Best Practices

#### ✅ DO

- **Validate all inputs** with Zod schemas
- **Call services** for all business logic
- **Use `handleError` utility** in all catch blocks for consistent error responses
- **Provide custom fallback messages** to `handleError` for better error context
- **Include field names** in validation errors (via `AppError` field parameter)
- **Use consistent response format** across all routes
- **Document routes** with JSDoc comments
- **Keep routes thin** - only HTTP concerns (validation, auth, response formatting)

#### ❌ DON'T

- Put business logic in routes (use services)
- Return raw database errors to clients
- Write repetitive error handling code (use `handleError` utility)
- Use `200 OK` for all responses regardless of outcome
- Leave sensitive information in error messages
- Perform heavy computation in route handlers (use background jobs or services)
- Skip input validation "because the frontend validates"
- Use generic error messages like "Something went wrong" (provide context)
- Expose internal implementation details in responses
- Call queries directly from routes (use services)

---

## Creating a New Route: Complete Walkthrough

This section provides a complete end-to-end example of creating a new API route, based on the user profile update implementation.

### Example: User Profile Update Route

We'll create a `PUT /account/user` route that updates a user's profile information.

---

### Step 1: Create Validation Schema

**Location**: `packages/utils/src/validation/{domain}/{entity}.ts`

```typescript
import * as z from 'zod';

export const ZUpdateProfile = z.object({
  fullname: z.string().min(5).optional(),
  username: z.string().min(1).optional(),
  locale: z.enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da']).optional()
});

export type TUpdateProfile = z.infer<typeof ZUpdateProfile>;
```

**Export**: Add to `packages/utils/src/validation/{domain}/index.ts` and `packages/utils/src/validation/index.ts`

---

### Step 2: Create Service Function

**Location**: `apps/api/src/services/{domain}.ts`

```typescript
import { AppError, ErrorCodes } from '@api/utils/errors';
import { updateProfile } from '@cio/db/queries/auth';

export async function updateUser(userId: string, data: Partial<TProfile>) {
  try {
    const updatedProfile = await updateProfile(userId, data);
    if (!updatedProfile) {
      throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }
    return updatedProfile;
  } catch (error) {
    if (error instanceof AppError) throw error;

    // Handle constraint violations
    if (error instanceof Error && error.message.includes('profile_username_key')) {
      throw new AppError('Username already exists', ErrorCodes.VALIDATION_ERROR, 400, 'username');
    }

    throw new AppError('Failed to update profile', ErrorCodes.PROFILE_UPDATE_FAILED, 500);
  }
}
```

---

### Step 3: Create Route

**Location**: `apps/api/src/routes/{domain}/{entity}.ts`

```typescript
import { updateUser } from '@api/services/account';
import { Hono } from '@api/utils/hono';
import { ZUpdateProfile } from '@cio/utils/validation/account';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const accountRouter = new Hono().put('/user', authMiddleware, zValidator('json', ZUpdateProfile), async (c) => {
  try {
    const user = c.get('user');
    const validatedData = c.req.valid('json');
    const updatedProfile = await updateUser(user.id, validatedData);

    return c.json({ success: true, profile: updatedProfile }, 200);
  } catch (error) {
    return handleError(c, error, 'Failed to update profile');
  }
});
```

---

### Step 4: Export and Register Route

```typescript
// apps/api/src/routes/account/index.ts
export * from './account';

// apps/api/src/app.ts
import { accountRouter } from '@api/routes/account';

export const app = new Hono().route('/account', accountRouter); // Route available at PUT /account/user
```

---

### Step 5: Run the api build command (at the root directory)

```
 sudo pnpm --filter @cio/api build
```

---

### Step 6: Use in Frontend

**Location**: `apps/dashboard/src/lib/features/{domain}/api/{entity}.svelte.ts`

```typescript
import { ZProfileUpdateForm } from '@cio/utils/validation/account';
import { classroomio } from '$lib/utils/services/api';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';

export class ProfileApi {
  isLoading = $state(false);
  errors = $state<Record<string, string>>({});

  async submit(fields: TProfileUpdateForm) {
    // Client-side validation
    const result = ZProfileUpdateForm.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }

    try {
      this.isLoading = true;

      // Call API using RPC client (matches route path)
      const response = await classroomio.account.user.$put({
        json: result.data
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Update local state, show success message, etc.
    } catch (error) {
      this.errors.general = error.message;
    } finally {
      this.isLoading = false;
    }
  }
}
```

---

### Route Path Convention

When adding routes to an existing router:

- **GET `/`** - Fetch/list resources (e.g., `GET /account` - get account data)
- **GET `/{id}`** - Fetch single resource (e.g., `GET /course/{id}`)
- **POST `/`** - Create resource (e.g., `POST /course` - create course)
- **PUT `/{resource}`** - Update resource (e.g., `PUT /account/user` - update user)
- **DELETE `/{id}`** - Delete resource (e.g., `DELETE /course/{id}`)

**Example router with multiple routes**:

```typescript
export const accountRouter = new Hono()
  .get('/', authMiddleware, async (c) => {
    // GET /account - get account data
  })
  .put('/user', authMiddleware, zValidator('json', ZUpdateProfile), async (c) => {
    // PUT /account/user - update user profile
  })
  .put('/password', authMiddleware, zValidator('json', ZChangePassword), async (c) => {
    // PUT /account/password - change password
  });
```

---

### Quick Reference Checklist

When creating a new route, follow this checklist:

1. **Validation Schema** (`packages/utils/src/validation/`)
   - [ ] Create Zod schema with validation rules
   - [ ] Export schema and types
   - [ ] Add to validation index

2. **Service** (`apps/api/src/services/`)
   - [ ] Create service function with business logic
   - [ ] Use `AppError` for structured errors
   - [ ] Handle database constraint violations
   - [ ] Add JSDoc comments

3. **Route** (`apps/api/src/routes/`)
   - [ ] Create route handler
   - [ ] Use `zValidator` for input validation
   - [ ] Apply `authMiddleware` if needed
   - [ ] Use `handleError` for error handling
   - [ ] Return consistent response format

4. **Registration**
   - [ ] Export router in index file
   - [ ] Register route in `app.ts`

5. **Frontend** (`apps/dashboard/src/lib/features/`)
   - [ ] Create API abstraction class (`.svelte.ts`)
   - [ ] Use shared validation schema
   - [ ] Use RPC client for API calls
   - [ ] Map errors to translations
   - [ ] Update local state after success

---

## Step 4: Export and Register Route

### Export Router

```typescript
// apps/api/src/routes/onboarding/index.ts
export * from './onboarding';
```

### Register in Main App

```typescript
// apps/api/src/app.ts
import { onboardingRouter } from '@api/routes/onboarding';

export const app = new Hono()
  // ... middleware ...

  // Routes
  .route('/account', accountRouter)
  .route('/onboarding', onboardingRouter) // Add new route
  .route('/course', courseRouter)
  .route('/mail', mailRouter);

// ... error handling ...
```

---

### Step 5: Run the api build command (at the root directory)

```
 sudo pnpm --filter @cio/api build
```

---

## Step 6: Update Frontend

**Location**: `apps/dashboard/src/lib/utils/services/api.ts` (or similar)

### Setup Hono RPC Client

The frontend uses Hono's RPC client for type-safe API calls:

```typescript
// apps/dashboard/src/lib/utils/services/api.ts
import { hc } from 'hono/client';
import type { app } from '@api/app';

export const classroomio = hc<typeof app>(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
  credentials: 'include', // Important: sends cookies for authentication
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Using API in Components

Replace Supabase direct database calls with API calls:

```typescript
// Before: Direct Supabase call
const { data, error } = await supabase
  .from('organization')
  .insert({
    name: fields.orgName,
    siteName: fields.siteName
  })
  .select();

// After: Type-safe API call
try {
  const response = await classroomio.onboarding.step1.$post({
    json: {
      fullname: fields.fullname,
      orgName: fields.orgName,
      siteName: fields.siteName
    }
  });

  const data = await response.json();

  if (!data.success) {
    // Handle error
    errors.siteName = data.error;
    return;
  }

  // Success - use data.data.organization, data.data.member, etc.
  const { organization, member, organizations } = data.data;
} catch (error) {
  console.error('API call failed:', error);
  // Handle network error
}
```

### Complete Frontend Example

Example with **client-side validation** before API call:

```typescript
// apps/dashboard/src/routes/course/+page.svelte
<script lang="ts">
  import { classroomio } from '$lib/utils/services/api';
  import { ZCourseCreate } from '@cio/utils/validation/course';
  import { mapZodErrorsToTranslations } from '$lib/utils/validation';
  import { goto } from '$app/navigation';

  let fields = $state({ title: '', slug: '', description: '' });
  let errors = $state<Record<string, string>>({});
  let loading = $state(false);

  const handleSubmit = async () => {
    loading = true;
    errors = {};

    // Client-side validation with entity-specific translations
    const result = ZCourseCreate.safeParse(fields);

    if (!result.success) {
      // Map validation errors to translated messages
      errors = mapZodErrorsToTranslations(result.error, 'course');
      // errors.title = "Course title is required"
      // errors.slug = "Course slug is required"
      loading = false;
      return;
    }

    try {
      const response = await classroomio.course.create.$post({
        json: result.data  // Send validated data
      });

      const data = await response.json();

      if (!data.success) {
        // Handle API error (e.g., duplicate slug)
        if (data.field) {
          errors[data.field] = data.error;
        } else {
          errors.general = data.error;
        }
        loading = false;
        return;
      }

      // Success - redirect to course
      const { course } = data.data;
      await goto(`/courses/${course.slug}`);

    } catch (error) {
      console.error('Error creating course:', error);
      errors.general = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  };
</script>

<form onsubmit={handleSubmit}>
  <div>
    <label for="title">Course Title</label>
    <input
      id="title"
      bind:value={fields.title}
      class:error={errors.title}
    />
    {#if errors.title}
      <span class="error-message">{errors.title}</span>
    {/if}
  </div>

  <div>
    <label for="slug">Course Slug</label>
    <input
      id="slug"
      bind:value={fields.slug}
      class:error={errors.slug}
    />
    {#if errors.slug}
      <span class="error-message">{errors.slug}</span>
    {/if}
  </div>

  <button type="submit" disabled={loading}>
    {loading ? 'Creating...' : 'Create Course'}
  </button>
</form>
```

### Frontend Best Practices

#### ✅ DO

- **Use type-safe RPC client** for API calls (Hono RPC)
- **Validate client-side** before API calls using shared schemas from `@cio/utils/validation`
- **Use entity-specific translations** when multiple entities share field names

  ```typescript
  mapZodErrorsToTranslations(error, 'course'); // "Course title is required"
  ```

- **Provide generic translations** as fallbacks for shared fields (email, password)
- **Handle both API errors and network errors** separately
- **Show specific field errors** when validation or API returns them
- **Keep UI responsive** during API calls (loading states)
- **Optimistically update UI** when appropriate
- **Handle different HTTP status codes** appropriately
- **Show user-friendly, translated error messages**

#### ❌ DON'T

- Skip error handling assuming API calls always succeed
- Display raw API error messages without formatting
- Skip client-side validation (validate before API call for instant feedback)
- Hardcode error messages in schemas (use translation system)
- Use the same generic message for all entities (use entity-specific when needed)
- Make multiple simultaneous calls that should be atomic
- Store sensitive data in frontend state longer than necessary
- Retry failed requests automatically without user action (for mutations)
- Trust client-side validation alone (API always validates too)

---

## Public API Considerations

Since routes may become public APIs, consider these additional aspects:

### 1. **API Versioning**

Prepare for versioning from the start:

```typescript
// Current approach (v1 implied)
.route('/account', accountRouter)

// When versioning becomes necessary
.route('/v1/account', accountRouterV1)
.route('/v2/account', accountRouterV2)
```

### 2. **Rate Limiting**

Already implemented globally, but consider per-route limits:

```typescript
import rateLimiter from '@api/middlewares/rate-limiter';

// Higher rate limit for read operations
.get('/courses', rateLimiter({ limit: 100, window: 60000 }), async (c) => {})

// Lower rate limit for write operations
.post('/create', rateLimiter({ limit: 10, window: 60000 }), async (c) => {})
```

### 3. **API Documentation**

Add JSDoc comments to document your routes:

```typescript
/**
 * POST /api/onboarding/create-org
 * Creates organization during onboarding
 *
 * @requires Authentication
 * @returns {201} Created - Organization created successfully
 * @returns {409} Conflict - Sitename already exists
 */
.post('/create-org', authMiddleware, zValidator('json', createOrgSchema), async (c) => {
  // ... implementation
});
```

### 4. **Pagination Standards**

For list endpoints, use consistent pagination:

```typescript
const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  sort: z.enum(['asc', 'desc']).default('desc'),
  sortBy: z.string().default('createdAt')
});

.get('/list', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, sort, sortBy } = c.req.valid('query');

  const offset = (page - 1) * limit;
  const items = await getItems({ offset, limit, sort, sortBy });
  const total = await getItemsCount();

  return c.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
});
```

### 5. **Filtering and Search**

Standard query parameter naming:

```typescript
const searchSchema = z.object({
  q: z.string().optional(), // General search query
  filter: z.string().optional(), // Specific field filter (JSON or comma-separated)
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});
```

### 6. **Security**

Ensure the following (already configured globally in `app.ts`):

- CORS properly configured for trusted origins
- Security headers set
- Rate limiting appropriate for endpoint
- Authentication enforced where needed

---

## Testing Routes

### Unit Testing Queries

```typescript
// packages/db/src/queries/__tests__/organization.test.ts
import { describe, it, expect } from 'vitest';
import { createOrganization, checkSiteNameExists } from '../organization';

describe('Organization Queries', () => {
  it('should create an organization', async () => {
    const org = await createOrganization({
      name: 'Test Org',
      siteName: 'test-org'
    });

    expect(org).toHaveProperty('id');
    expect(org.name).toBe('Test Org');
  });

  it('should check if sitename exists', async () => {
    await createOrganization({ name: 'Test Org', siteName: 'test-org' });

    expect(await checkSiteNameExists('test-org')).toBe(true);
    expect(await checkSiteNameExists('other-org')).toBe(false);
  });
});
```

### Integration Testing Routes

```typescript
// apps/api/src/routes/__tests__/onboarding.test.ts
import { describe, it, expect } from 'vitest';
import { app } from '@api/app';

describe('Onboarding Routes', () => {
  it('should create organization with valid data', async () => {
    const res = await app.request('/onboarding/create-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: 'John Doe',
        orgName: 'Test School',
        siteName: 'test-school'
      })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('should return 409 for duplicate sitename', async () => {
    // Create first, then attempt duplicate
    const res = await app.request('/onboarding/create-org', {
      method: 'POST',
      body: JSON.stringify({
        /* duplicate data */
      })
    });

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('SITENAME_EXISTS');
  });
});
```

---

## Checklist for New Routes

Before marking a route as complete, ensure:

- [ ] **Queries Layer**
  - [ ] Queries are in appropriate `packages/db/src/queries/{domain}` folder
  - [ ] All queries are pure functions (no side effects)
  - [ ] Queries use Drizzle ORM with type inference
  - [ ] **Use exported types from `@cio/db/types`** (`TNew{Table}`, `T{Table}`)
  - [ ] Use `TNew{Table}` for creates, `Partial<T{Table}>` for updates
  - [ ] No runtime validation in queries (validation happens at API route layer)
  - [ ] JSDoc comments added to all exported functions
  - [ ] Queries are exported in index files

- [ ] **Service Layer**
  - [ ] Service file created in `apps/api/src/services/{domain}.ts`
  - [ ] Business logic moved from routes to services
  - [ ] `AppError` used with appropriate error codes and status codes
  - [ ] Transactions handled in services
  - [ ] Business rules validated (e.g., uniqueness checks)
  - [ ] Services return structured data (not HTTP responses)
  - [ ] JSDoc comments explaining business logic
  - [ ] Services exported in index files

- [ ] **Route Layer**
  - [ ] Route file created in `apps/api/src/routes/{domain}`
  - [ ] All inputs validated with Zod schemas
  - [ ] **Validation schemas defined in `packages/utils/src/validation/{entity}/`**
  - [ ] Schemas imported from `@cio/utils/validation/{entity}` in route handlers
  - [ ] Schemas are clean (no hardcoded error messages)
  - [ ] Translation keys documented in schema comments
  - [ ] Authentication middleware applied where needed
  - [ ] Routes call services (not queries directly)
  - [ ] **`handleError` utility used in all catch blocks**
  - [ ] Custom fallback messages provided to `handleError` for context
  - [ ] Consistent response format used (`{ success: true/false, data/error, code? }`)
  - [ ] Route documented with JSDoc comments

- [ ] **Registration**
  - [ ] Router exported in route's `index.ts`
  - [ ] Route registered in main `app.ts`

- [ ] **Frontend**
  - [ ] RPC client calls replace direct database calls
  - [ ] Shared validation schemas imported from `@cio/utils/validation`
  - [ ] Client-side validation before API calls
  - [ ] Entity-specific translations used when needed (e.g., `mapZodErrorsToTranslations(error, 'course')`)
  - [ ] Generic translations provided as fallbacks
  - [ ] Translation keys follow convention: `validations.{entity}.{field}.{errorCode}`
  - [ ] Error handling for both validation, API, and network errors
  - [ ] Loading states implemented
  - [ ] Field-specific errors displayed
  - [ ] User-friendly, translated error messages shown

- [ ] **Public API Ready**
  - [ ] Route can work independently of frontend
  - [ ] No sensitive information exposed in responses
  - [ ] Rate limiting appropriate for endpoint
  - [ ] Documentation complete and accurate
  - [ ] Versioning strategy considered

- [ ] **Testing** (Optional but recommended)
  - [ ] Query unit tests written
  - [ ] Route integration tests written
  - [ ] Error cases tested
  - [ ] Authentication/authorization tested

---

## Common Patterns

### Transactional Operations

```typescript
const result = await db.transaction(async (tx) => {
  const org = await createOrganization({ name, siteName });
  const member = await createOrganizationMember({ orgId: org.id, userId });
  return { org, member };
});
```

### Authorization Checks

```typescript
.patch('/update/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const hasAccess = await checkUserAccessToOrg(user.id, id);
  if (!hasAccess) {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }

  const updated = await updateOrganization(id, updates);
  return c.json({ success: true, data: updated }, 200);
});
```

### Bulk Operations

```typescript
.post('/bulk', authMiddleware, zValidator('json', z.object({
  items: z.array(itemSchema).min(1).max(100)
})), async (c) => {
  const { items } = c.req.valid('json');

  const results = await db.transaction(async (tx) => {
    return await Promise.all(items.map(item => createItem(item)));
  });

  return c.json({ success: true, data: results }, 201);
});
```

---

## Summary

This four-layer architecture ensures:

### **Layer Separation**

1. **Shared Validation Layer**: Zod schemas shared between API and frontend
2. **Routes (HTTP Layer)**: Handle requests/responses, validation, authentication
3. **Services (Business Logic)**: Orchestrate queries, manage transactions, business rules
4. **Queries (Data Layer)**: Pure database operations, type-safe
5. **Frontend (UI Layer)**: Type-safe API consumption via RPC with client-side validation

### **Benefits**

1. **Maintainability**: Clear separation of concerns across all layers
2. **Testability**: Each layer can be tested independently
3. **Reusability**: Queries and services can be used across multiple routes
4. **Type Safety**: End-to-end type safety from database to frontend
5. **Public API Ready**: Routes designed to be exposed as public APIs
6. **Consistency**: Standardized response formats and error handling
7. **Security**: Authentication, validation, and proper error handling
8. **Scalability**: Easy to add new features following established patterns
9. **Developer Experience**: Type-safe RPC client, clear error messages

### **Example Flow**

```txt
Frontend Form (validates with @cio/utils/validation)
    ↓
Frontend Request (with validated data)
    ↓
Route (validates input again with @cio/utils/validation, checks auth)
    ↓
Service (business logic, transactions)
    ↓
Queries (database operations)
    ↓
Database
    ↓
Queries (return type-safe data)
    ↓
Service (return structured results)
    ↓
Route (format HTTP response)
    ↓
Frontend Response (maps errors to translations if validation failed)
```

By following these patterns, our API remains **consistent**, **secure**, **testable**, and **ready for public consumption**.
