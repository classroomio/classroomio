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

> **📖 Route Naming Conventions**: For comprehensive guidelines on route naming, URL structure, HTTP methods, nested resources, and action endpoints, see [`apps/api/ROUTE_NAMING_BEST_PRACTICES.md`](apps/api/ROUTE_NAMING_BEST_PRACTICES.md).

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

**File Naming Convention**:

All file names should use **lowercase with hyphens** (kebab-case):

- ✅ `setup-progress.svelte` (component files)
- ✅ `org.svelte.ts` (API service files)
- ✅ `course.ts` (validation/query files)
- ✅ `user-profile.svelte` (multi-word component files)

- ❌ `SetupProgress.svelte` (PascalCase - reserved for component names in imports)
- ❌ `Org.svelte.ts` (PascalCase)
- ❌ `userProfile.svelte` (camelCase)
- ❌ `user_profile.svelte` (snake_case)

**Note**: Component names in imports can still use PascalCase (e.g., `import SetupProgress from './setup-progress.svelte'`), but the actual file names must be lowercase with hyphens.

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
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';

// Protected route - requires user authentication (session cookies)
.post('/create', authMiddleware, async (c) => {
  const user = c.get('user'); // Always available after authMiddleware
  const session = c.get('session');
  // ...
});

// Protected route - requires API key (server-to-server)
.post('/webhook', apiKeyMiddleware, async (c) => {
  // API key validated, proceed
  // ...
});

// Protected route - accepts either user session OR API key
.post('/plan', authOrApiKeyMiddleware, async (c) => {
  // Can be called by:
  // 1. Authenticated users (via session cookies)
  // 2. Server-to-server (via API key: Authorization: Bearer <key>)
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

**API Key Authentication:**
- Add `API_KEY` to `apps/api/src/config/env.ts` environment schema
- Use `Authorization: Bearer <api-key>` header format (standard across popular APIs)
- Use `apiKeyMiddleware` for API-key-only endpoints
- Use `authOrApiKeyMiddleware` for endpoints that accept both user sessions and API keys

#### 6. **Role-Based Authorization Middleware**

**Middleware Location Decision:**

Use **generic middleware** (`apps/api/src/middlewares/`) when:
- ✅ The middleware is reusable across multiple routes/domains
- ✅ The pattern is generic (e.g., "is user member of org?")
- ✅ The check doesn't depend on specific resource types

Use **route-specific middleware** (`apps/api/src/routes/{domain}/middlewares/`) when:
- ✅ The middleware is specific to one route file
- ✅ The check involves resource-specific data (e.g., "is user author of THIS question?")
- ✅ The pattern won't be reused elsewhere

**Important:** Never put authorization logic inline in route handlers. Always create middleware functions, even if they're only used once.

**Available Generic Middleware:**

1. **`orgMemberMiddleware`** - User must be a member of the organization (any role)
   - Location: `apps/api/src/middlewares/org-member.ts`
   - Use for: Organization-scoped operations
   - Requires: `cio-org-id` header

2. **`orgTeamMemberMiddleware`** - User must be ADMIN or TUTOR in organization
   - Location: `apps/api/src/middlewares/org-team-member.ts`
   - Use for: Admin-only operations across organization
   - Requires: `cio-org-id` header

3. **`orgAdminMiddleware`** - User must be ADMIN in organization
   - Location: `apps/api/src/middlewares/org-admin.ts` (already exists)
   - Use for: Admin-only operations
   - Requires: `cio-org-id` header

4. **`courseMemberMiddleware`** - User must be a member of the course's group
   - Location: `apps/api/src/middlewares/course-member.ts`
   - Use for: Course-scoped operations
   - Requires: `courseId` in request params or query

**Route-Specific Middleware Pattern:**

For endpoint-specific authorization, create middleware in the route's middleware folder:

```
apps/api/src/routes/community/
  ├── community.ts
  └── middlewares/
      ├── question-author-or-team.ts
      ├── comment-author-or-team.ts
      └── question-course-member.ts
```

**Example Route-Specific Middleware:**

```typescript
// apps/api/src/routes/community/middlewares/question-author-or-team.ts
import { Context, Next } from 'hono';
import { ErrorCodes } from '@api/utils/errors';
import { getQuestionAuthorAndCourse } from '@cio/db/queries/community';
import { isUserCourseTeamMember } from '@cio/db/queries/group';

export const questionAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user');
  const questionId = c.req.param('id');
  
  const question = await getQuestionAuthorAndCourse(questionId);
  if (!question) {
    return c.json({ success: false, error: 'Question not found' }, 404);
  }
  
  const isAuthor = question.authorId === user.id;
  const isTeamMember = await isUserCourseTeamMember(question.courseId, user.id);
  
  if (!isAuthor && !isTeamMember) {
    return c.json({ success: false, error: 'Unauthorized' }, 403);
  }
  
  await next();
};
```

**Using Route-Specific Middleware:**

```typescript
// apps/api/src/routes/community/community.ts
import { questionAuthorOrTeamMiddleware } from './middlewares/question-author-or-team';

export const communityRouter = new Hono()
  .put('/:id', authMiddleware, questionAuthorOrTeamMiddleware, zValidator('param', ZGetCommunity), async (c) => {
    // Handler logic
  });
```

**Best Practices:**
- Always use `authMiddleware` first
- Extract IDs from validated params/body
- Return 404 if resource doesn't exist
- Return 403 if user lacks permission
- Use existing `ErrorCodes` enum
- Keep middleware focused and single-purpose
- Never inline authorization checks - always create middleware functions

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

### Example: Creating an Organization (POST Route)

We'll create a `POST /organization` route that creates a new organization with the current user as owner.

---

### Step 1: Create Validation Schema

**Location**: `packages/utils/src/validation/organization/organization.ts`

```typescript
import * as z from 'zod';

export const ZCreateOrganization = z.object({
  name: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Organization name cannot start or end with a hyphen'
    }),
  siteName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Site name cannot start or end with a hyphen'
    })
});

export type TCreateOrganization = z.infer<typeof ZCreateOrganization>;
```

**Export**: Add to `packages/utils/src/validation/organization/index.ts` and `packages/utils/src/validation/index.ts`

---

### Step 2: Create or Reuse Service Function

**Location**: `apps/api/src/services/organization.ts`

**Option A: Reuse Existing Service** (if function exists in another service)

```typescript
import { createOrganizationWithOwner } from '@api/services/onboarding';

export async function createOrg(profileId: string, data: { name: string; siteName: string }) {
  // Reuse existing function from onboarding service
  return await createOrganizationWithOwner(profileId, {
    orgName: data.name,
    siteName: data.siteName
  });
}
```

**Option B: Create New Service** (if you need different logic)

```typescript
import { AppError, ErrorCodes } from '@api/utils/errors';
import { db } from '@cio/db/drizzle';
import {
  checkSiteNameExists,
  createOrganization,
  createOrganizationMember,
  getOrganizationByProfileId
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';

export async function createOrg(profileId: string, data: { name: string; siteName: string }) {
  // Business Logic: Check sitename availability
  const exists = await checkSiteNameExists(data.siteName);
  if (exists) {
    throw new AppError(
      `Site name '${data.siteName}' already exists`,
      ErrorCodes.SITENAME_EXISTS,
      409,
      'siteName'
    );
  }

  // Business Logic: Create org and member in a transaction
  try {
    const result = await db.transaction(async (tx) => {
      const organization = await createOrganization({
        name: data.name,
        siteName: data.siteName
      });

      const member = await createOrganizationMember({
        organizationId: organization.id,
        profileId,
        roleId: ROLE.ADMIN,
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
      throw new AppError(
        `Site name '${data.siteName}' already exists`,
        ErrorCodes.SITENAME_EXISTS,
        409,
        'siteName'
      );
    }
    throw new AppError('Failed to create organization', ErrorCodes.ORG_CREATE_FAILED, 500);
  }
}
```

---

### Step 3: Create Route

**Location**: `apps/api/src/routes/organization/organization.ts`

```typescript
import { createOrg } from '@api/services/organization';
import { Hono } from '@api/utils/hono';
import { ZCreateOrganization } from '@cio/utils/validation/organization';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const organizationRouter = new Hono()
  .post('/', authMiddleware, zValidator('json', ZCreateOrganization), async (c) => {
    try {
      const user = c.get('user');
      const data = c.req.valid('json');

      const result = await createOrg(user.id, data);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create organization');
    }
  });
```

**Note**: Use `201 Created` status code for successful POST requests that create resources.

---

### Step 4: Export and Register Route

```typescript
// apps/api/src/routes/organization/index.ts
export * from './organization';

// apps/api/src/app.ts
import { organizationRouter } from '@api/routes/organization';

export const app = new Hono()
  .route('/organization', organizationRouter);  // Route available at POST /organization
```

---

### Step 5: Use in Frontend

**Location**: `apps/dashboard/src/lib/features/org/api/org.svelte.ts`

```typescript
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZCreateOrganization } from '@cio/utils/validation/organization';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { orgs, currentOrg } from '$lib/utils/store/org';
import { snackbar } from '$lib/components/Snackbar/store';

class OrgApi extends BaseApiWithErrors {
  async create(fields: { name: string; siteName: string }) {
    // Client-side validation
    const result = ZCreateOrganization.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'organization');
      return;
    }

    await this.execute<typeof classroomio.organization.$post>({
      requestFn: () =>
        classroomio.organization.$post({
          json: result.data
        }),
      logContext: 'creating organization',
      onSuccess: (response) => {
        if (!response.data) return;

        const { organization, organizations } = response.data;

        // Update stores
        orgs.set(organizations);
        currentOrg.set(organization);

        snackbar.success('Organization created successfully');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }
        if ('error' in result && 'field' in result) {
          // Field-specific error automatically mapped to this.errors[field]
          this.errors[result.field as string] = result.error;
        }
      }
    });
  }
}

export const orgApi = new OrgApi();
```

**Key Points:**
- Use `this.execute()` from `BaseApiWithErrors` for automatic loading/error state
- Field-specific errors are automatically mapped to `this.errors[field]`
- Update stores in `onSuccess` callback
- Handle both validation and API errors

---

### Reusing Existing Service Functions

Sometimes a service function exists in a different context (e.g., `createOrganizationWithOwner` in onboarding service).

**When to Reuse:**
- ✅ The function does exactly what you need
- ✅ It's in the same domain (organization operations)
- ✅ You can call it from your new route without modification

**When to Create New:**
- ❌ The existing function has domain-specific logic you don't want (e.g., onboarding-specific)
- ❌ You need different parameters or return values
- ❌ The function is in a different domain and mixing concerns would be inappropriate

**Example: Reusing a Service**

```typescript
// apps/api/src/services/organization.ts
import { createOrganizationWithOwner } from '@api/services/onboarding';

export async function createOrg(profileId: string, data: { name: string; siteName: string }) {
  // Reuse existing function, just adapt the parameters
  return await createOrganizationWithOwner(profileId, {
    orgName: data.name,
    siteName: data.siteName
  });
}
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

## Migrating Existing Supabase Calls to API Routes

When you have existing components using direct Supabase calls, follow this migration pattern to move them to the API architecture.

### Migration Workflow

#### Step 1: Identify the Operation

Analyze the existing Supabase call:
- **What database operation?** (CREATE, UPDATE, DELETE, SELECT)
- **What tables are involved?**
- **Are there related operations?** (e.g., create org + create member should be atomic)
- **What validation is currently done?** (client-side only or also server-side?)

**Example Analysis:**
```typescript
// Current code
const { data: org, error } = await supabase
  .from('organization')
  .insert({ name: orgName, siteName: siteName })
  .select();

const { data, error } = await supabase
  .from('organizationmember')
  .insert({ organization_id: org[0].id, profile_id: $profile.id, role_id: 1 });

// Analysis:
// - Operation: CREATE (organization + member)
// - Tables: organization, organizationmember
// - Related: Yes, should be atomic (transaction)
// - Validation: Client-side only (needs server-side too)
```

#### Step 2: Check for Existing Services

Search for existing service functions that might handle this:
- Check `apps/api/src/services/` for similar operations
- Look in related domains (e.g., onboarding might have org creation)
- Check if the operation exists but in a different context

**Decision:**
- **Reuse existing service** if it does what you need
- **Create new service** if you need different logic or parameters

#### Step 3: Create/Update API Route

If the route doesn't exist:
- Follow the "Creating a New Route" workflow above
- Use appropriate HTTP method: `POST` (create), `PUT` (update), `DELETE` (delete)

If the route exists:
- Add new endpoint to existing router
- Follow route naming conventions (see [`apps/api/ROUTE_NAMING_BEST_PRACTICES.md`](apps/api/ROUTE_NAMING_BEST_PRACTICES.md))

#### Step 4: Create Frontend API Method

Add method to existing API class (e.g., `orgApi.create()`):

```typescript
// apps/dashboard/src/lib/features/org/api/org.svelte.ts
class OrgApi extends BaseApiWithErrors {
  async create(fields: { name: string; siteName: string }) {
    // Client-side validation
    const result = ZCreateOrganization.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'organization');
      return;
    }

    await this.execute<typeof classroomio.organization.$post>({
      requestFn: () =>
        classroomio.organization.$post({
          json: result.data
        }),
      logContext: 'creating organization',
      onSuccess: (response) => {
        // Update stores, navigate, show success
        if (response.data) {
          orgs.set(response.data.organizations);
          currentOrg.set(response.data.organization);
        }
        snackbar.success('Organization created');
        this.success = true;
      },
      onError: (result) => {
        // Error handling (automatic for validation errors)
        if (typeof result === 'string') {
          snackbar.error(result);
        }
      }
    });
  }
}
```

**Key Points:**
- Always use `this.execute()` from `BaseApiWithErrors`
- Client-side validation before API call
- Update stores in `onSuccess` callback
- Errors automatically handled by `BaseApiWithErrors`

#### Step 5: Update Component

Replace Supabase calls with API class method:

**Before (Direct Supabase):**
```typescript
<script lang="ts">
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';

  async function createNewOrg() {
    // Create organization
    const { data: org, error } = await supabase
      .from('organization')
      .insert({ name: orgName, siteName })
      .select();

    if (error) {
      errors.siteName = error.message;
      return;
    }

    // Create member (separate call - not atomic!)
    const { data, error: memberError } = await supabase
      .from('organizationmember')
      .insert({
        organization_id: org[0].id,
        profile_id: $profile.id,
        role_id: 1
      })
      .select();

    if (memberError) {
      // Manual cleanup required
      await supabase.from('organization').delete().match({ siteName });
      errors.siteName = 'Failed to create member';
      return;
    }

    // Manual store updates
    await getOrganizations($profile.id);
    goto(`/org/${siteName}`);
  }
</script>
```

**After (API Route):**
```typescript
<script lang="ts">
  import { orgApi } from '$features/org/api/org.svelte';
  import { goto } from '$app/navigation';

  async function createNewOrg() {
    // Client-side validation (optional, for instant feedback)
    errors = createOrgValidation({ orgName, siteName }) as Error;
    if (Object.values(errors).length) {
      return;
    }

    // Call API
    await orgApi.create({ name: orgName, siteName });

    if (orgApi.success) {
      // Success - stores already updated by orgApi
      goto(`/org/${siteName}`);
      $newOrgModal.open = false;
      resetForm();
    } else {
      // Errors automatically mapped to orgApi.errors
      if (orgApi.errors.siteName) {
        errors.siteName = orgApi.errors.siteName;
      } else if (orgApi.errors.general) {
        errors.general = orgApi.errors.general;
      }
    }
  }
</script>
```

**Key Differences:**
- ✅ **No manual transaction cleanup** - Handled by service layer
- ✅ **No separate member creation** - Handled atomically by service
- ✅ **Automatic store updates** - Handled by API class `onSuccess`
- ✅ **Consistent error structure** - Field-specific errors automatically mapped
- ✅ **Type-safe** - Full TypeScript support end-to-end
- ✅ **Server-side validation** - Always validated even if client validation passes

### Mapping API Errors to Form Fields

The `BaseApiWithErrors` class automatically maps field-specific errors from the API response:

**API Response Structure:**
```typescript
// Field-specific error
{
  success: false,
  error: "Sitename already exists",
  code: "SITENAME_EXISTS",
  field: "siteName"  // ← This maps to this.errors.siteName
}

// General error
{
  success: false,
  error: "Failed to create organization",
  code: "ORG_CREATE_FAILED"
  // No field property → maps to this.errors.general
}
```

**In Component:**
```typescript
await orgApi.create({ name: orgName, siteName });

if (!orgApi.success) {
  // Field-specific error automatically in orgApi.errors.siteName
  if (orgApi.errors.siteName) {
    errors.siteName = orgApi.errors.siteName;
  }
  
  // General error automatically in orgApi.errors.general
  if (orgApi.errors.general) {
    errors.general = orgApi.errors.general;
  }
}
```

**How It Works:**
1. API returns error with `field` property
2. `BaseApiWithErrors.execute()` automatically sets `this.errors[field] = error`
3. Component can access `orgApi.errors.fieldName` directly
4. No manual error mapping needed

### Migration Checklist

When migrating a component from Supabase to API:

- [ ] **Identify operations**: List all Supabase calls in component
- [ ] **Check existing routes**: Search `apps/api/src/routes/` for existing API routes
- [ ] **Check existing services**: Search `apps/api/src/services/` for reusable functions
- [ ] **Create missing pieces**: Follow "Creating a New Route" if route doesn't exist
- [ ] **Create API method**: Add method to appropriate API class using `execute()` pattern
- [ ] **Update component**: Replace Supabase calls with API method
- [ ] **Remove cleanup code**: Delete manual rollback/cleanup (handled by service transactions)
- [ ] **Remove separate calls**: Combine related operations (handled atomically by service)
- [ ] **Update error handling**: Use `orgApi.errors.fieldName` instead of Supabase error structure
- [ ] **Update store sync**: Remove manual store updates (handled by API class `onSuccess`)
- [ ] **Remove Supabase imports**: Delete unused `supabase` imports
- [ ] **Test**: Verify success and error cases work correctly
- [ ] **Test transactions**: Verify atomic operations (e.g., org + member creation)

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

**✅ CORRECT Pattern - API Class Handles Everything:**

```typescript
// apps/dashboard/src/lib/features/course/api/course.svelte.ts
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZCourseCreate } from '@cio/utils/validation/course';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';
import { goto } from '$app/navigation';

class CourseApi extends BaseApiWithErrors {
  async createCourse(fields: { title: string; slug: string; description?: string }) {
    // 1. CLIENT-SIDE VALIDATION
    const result = ZCourseCreate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'course');
      return;
    }

    // 2. API CALL WITH COMPLETE SUCCESS/ERROR HANDLING
    await this.execute<typeof classroomio.course.create.$post>({
      requestFn: () => classroomio.course.create.$post({
        json: result.data
      }),
      logContext: 'creating course',
      onSuccess: (response) => {
        if (response.data?.course) {
          // Show success message
          snackbar.success('Course created successfully');
          
          // Navigate to the course
          goto(`/courses/${response.data.course.slug}`);
          
          // Mark as successful
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create course');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          // Field-specific error (e.g., duplicate slug)
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          // General error
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }
}

export const courseApi = new CourseApi();
```

```typescript
// apps/dashboard/src/routes/course/+page.svelte
<script lang="ts">
  import { courseApi } from '$features/course/api/course.svelte';

  let fields = $state({ title: '', slug: '', description: '' });
</script>

<form onsubmit={() => courseApi.createCourse(fields)}>
  <div>
    <label for="title">Course Title</label>
    <input
      id="title"
      bind:value={fields.title}
      class:error={courseApi.errors.title}
    />
    {#if courseApi.errors.title}
      <span class="error-message">{courseApi.errors.title}</span>
    {/if}
  </div>

  <div>
    <label for="slug">Course Slug</label>
    <input
      id="slug"
      bind:value={fields.slug}
      class:error={courseApi.errors.slug}
    />
    {#if courseApi.errors.slug}
      <span class="error-message">{courseApi.errors.slug}</span>
    {/if}
  </div>

  <button type="submit" disabled={courseApi.isLoading}>
    {courseApi.isLoading ? 'Creating...' : 'Create Course'}
  </button>
</form>
```

**Key Differences:**
- ✅ **API class handles validation** - Component just calls the method
- ✅ **API class handles loading state** - Component binds to `api.isLoading`
- ✅ **API class handles errors** - Component binds to `api.errors.fieldName`
- ✅ **API class handles success** - Navigation and snackbar in `onSuccess`
- ✅ **Component is thin** - Only renders UI and binds to API state
- ✅ **No handleSubmit function** - Direct call to API method

**❌ WRONG Pattern - Logic in Component:**

```typescript
// DON'T DO THIS
<script lang="ts">
  import { classroomio } from '$lib/utils/services/api';
  import { ZCourseCreate } from '@cio/utils/validation/course';
  import { mapZodErrorsToTranslations } from '$lib/utils/validation';
  import { goto } from '$app/navigation';

  let fields = $state({ title: '', slug: '', description: '' });
  let errors = $state<Record<string, string>>({});
  let loading = $state(false);

  const handleSubmit = async () => {
    // ❌ Validation in component
    loading = true;
    errors = {};

    const result = ZCourseCreate.safeParse(fields);
    if (!result.success) {
      errors = mapZodErrorsToTranslations(result.error, 'course');
      loading = false;
      return;
    }

    try {
      // ❌ Manual API call
      const response = await classroomio.course.create.$post({
        json: result.data
      });

      const data = await response.json();

      // ❌ Manual error handling
      if (!data.success) {
        if (data.field) {
          errors[data.field] = data.error;
        } else {
          errors.general = data.error;
        }
        loading = false;
        return;
      }

      // ❌ Navigation in component
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
```

### API Abstraction Pattern (API Classes)

When creating API abstractions in `apps/dashboard/src/lib/features/{domain}/api/{entity}.svelte.ts`, **the API class should be a complete abstraction** that handles everything. Components should have NO business logic related to API calls.

**Important**: 
- **`.svelte.ts` files** are for **client-side use only** (Svelte components). They use Svelte reactivity (`$state`, `$derived`) and manage component state. **Never** include API key logic in these files.
- **`.server.ts` files** are for **server-side use only** (`+layout.server.ts`, `+page.server.ts`, `+server.ts`). They contain static methods with API key authentication and are automatically excluded from client bundles by SvelteKit.

#### Critical Principle: API Classes Handle Everything

**❌ WRONG - Logic in Component:**
```typescript
// Component file - TOO MUCH LOGIC
async function handleSave() {
  // ❌ Validation in component
  errors = customValidation(fields);
  if (Object.keys(errors).length) return;

  // ❌ Business logic in component (slug generation, defaults)
  const data = await api.create({
    ...fields,
    slug: generateSlug(fields.title),
    votes: 0,
    authorId: $profile.id
  });

  // ❌ Manual error/success handling
  if (api.error) {
    snackbar.error('Error occurred');
  } else {
    snackbar.success('Success!');
    goto(`/path/${data.slug}`);
  }
}
```

**✅ CORRECT - All Logic in API Class:**
```typescript
// Component file - THIN AND CLEAN
<script lang="ts">
  import { api } from '$features/domain/api/entity.svelte';

  let fields = $state({ title: '', body: '' });

  // That's it! Just call the API method
  async function handleSave() {
    await api.createQuestion(fields);
  }
</script>

<form onsubmit={handleSave}>
  <input bind:value={fields.title} />
  {#if api.errors.title}
    <span class="error">{api.errors.title}</span>
  {/if}
  
  <button disabled={api.isLoading}>
    {api.isLoading ? 'Saving...' : 'Save'}
  </button>
</form>
```

```typescript
// API class - COMPLETE ABSTRACTION
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZQuestionCreate } from '@cio/utils/validation/community';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';
import { goto } from '$app/navigation';
import { profile } from '$lib/utils/store/user';
import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
import { get } from 'svelte/store';

class CommunityApi extends BaseApiWithErrors {
  questionSlug = $state('');

  async createQuestion(fields: { title: string; body: string; courseId?: string }) {
    // 1. CLIENT-SIDE VALIDATION
    const result = ZQuestionCreate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'community');
      return;
    }

    // 2. API CALL WITH SUCCESS/ERROR HANDLING
    await this.execute<typeof classroomio.community.questions.$post>({
      requestFn: () => classroomio.community.questions.$post({
        json: result.data
      }),
      logContext: 'creating community question',
      onSuccess: (response) => {
        if (response.data) {
          // Store the slug for navigation
          this.questionSlug = response.data.slug;
          
          // Show success message
          snackbar.success('snackbar.community.success.question_submitted');
          
          // Navigate to the question
          goto(`${get(currentOrgPath)}/community/${response.data.slug}`);
          
          // Mark as successful
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.community.error.try_again');
          return;
        }
        if ('error' in result) {
          this.handleValidationError(result);
        }
      }
    });
  }
}

export const communityApi = new CommunityApi();
```

#### What API Classes Should Handle

**✅ API Class Responsibilities:**
1. **Client-side validation** using shared Zod schemas
2. **Loading state** (`this.isLoading` - automatic via `execute`)
3. **Error state** (`this.errors` for field errors, `this.error` for general errors)
4. **Success handling** (update stores, show snackbar, navigate)
5. **Error handling** (show snackbar, map validation errors)
6. **Business logic** (format data, generate IDs/slugs if needed client-side)
7. **Navigation** (redirect after success)
8. **State management** (update local stores with response data)

**❌ Component Responsibilities:**
1. ~~Validation~~ → API class handles this
2. ~~Error handling~~ → API class handles this
3. ~~Success callbacks~~ → API class handles this
4. ~~Navigation~~ → API class handles this
5. ~~Business logic~~ → API class or service layer handles this

**✅ Component Responsibilities:**
1. **Render UI** (forms, inputs, buttons)
2. **Bind to form fields** (`bind:value={fields.title}`)
3. **Call API method** (`await api.createQuestion(fields)`)
4. **Display loading state** (`{api.isLoading ? 'Loading...' : 'Submit'}`)
5. **Display field errors** (`{#if api.errors.title}<span>{api.errors.title}</span>{/if}`)

#### Using the `execute` Method

**Pattern:**
```typescript
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZItemUpdate } from '@cio/utils/validation/items';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';
import { goto } from '$app/navigation';

class ItemApi extends BaseApiWithErrors {
  async updateItem(id: string, fields: Partial<Item>) {
    // 1. CLIENT-SIDE VALIDATION
    const result = ZItemUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'item');
      return;
    }

    // 2. API CALL
    await this.execute<typeof classroomio.items[':id']['$put']>({
      requestFn: () => classroomio.items[':id'].$put({
        param: { id },
        json: result.data
      }),
      logContext: 'updating item',
      onSuccess: (response) => {
        // Update local stores
        itemsStore.update((items) => {
          const index = items.findIndex((i) => i.id === id);
          if (index !== -1 && response.data) {
            items[index] = { ...items[index], ...response.data };
          }
          return items;
        });
        
        // Show success message
        snackbar.success('Item updated successfully');
        
        // Navigate if needed
        goto(`/items/${id}`);
        
        // Mark as successful
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update item');
          return;
        }
        if ('error' in result) {
          this.handleValidationError(result);
        }
      }
    });
  }
}

export const itemApi = new ItemApi();
```

**Key Points:**
- **Always use `this.execute`** - Never call the RPC client directly
- **Always validate first** - Use Zod's `safeParse()` before API call
- **Type the execute call** with `typeof classroomio.{route}.{method}` for type safety
- **Use `requestFn`** - Wrap the RPC call in a function
- **Use `logContext`** - Provide descriptive context for error logging
- **Use `onSuccess`** - Handle ALL success logic (stores, snackbar, navigation, state updates)
- **Use `onError`** - Handle ALL error logic (snackbar, validation errors)
- **Return early on validation failure** - Don't make API call if validation fails

**Benefits:**
- ✅ Automatic loading state management (`this.isLoading`)
- ✅ Automatic error state management (`this.error` or `this.errors`)
- ✅ Consistent error handling across all API calls
- ✅ Type-safe responses
- ✅ Centralized logging
- ✅ Easy to test and mock
- ✅ **Components stay thin and focused on UI**
- ✅ **All business logic in one place**
- ✅ **Single source of truth for validation**

### Server-Side API Calls

**For server-side files** (`+layout.server.ts`, `+page.server.ts`, `+server.ts`), use **`.server.ts` API classes** instead of calling the RPC client directly. This prevents API keys from being accidentally bundled into client-side code.

#### Pattern for Server-Side Files

Create a `.server.ts` file alongside your `.svelte.ts` API class with static methods that use API key authentication:

```typescript
// apps/dashboard/src/lib/features/org/api/org.server.ts
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

/**
 * Server-side API methods for organization operations
 * These methods use API key authentication and should only be used in server-side files
 * (+server.ts, +layout.server.ts) to prevent API keys from being exposed to the client.
 */
export class OrgApiServer {
  /**
   * Gets organization by siteName (server-side)
   * @param siteName Organization site name
   * @returns Organization or null
   */
  static async getOrgBySiteName(siteName: string) {
    try {
      const response = await classroomio.organization.$get(
        {
          query: { siteName }
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success && data.data && data.data.length > 0 ? data.data[0] : null;
    } catch (error) {
      console.error('Error fetching organization by siteName (server):', error);
      return null;
    }
  }
}
```

**Usage in server-side files:**

```typescript
// apps/dashboard/src/routes/invite/t/[hash]/+layout.server.ts
import { OrgApiServer } from '$features/org/api/org.server';

export const load = async ({ params }) => {
  // Use static method from .server.ts class
  const org = await OrgApiServer.getOrgBySiteName(orgSiteName);

  return { org };
};
```

#### API Key Authentication for Webhooks/External Calls

For server-to-server communication (webhooks, external integrations), create `.server.ts` files with static methods:

```typescript
// apps/dashboard/src/lib/features/org/api/org-plan.server.ts
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import type { TCreateOrgPlan } from '@cio/utils/validation/organization';

/**
 * Server-side API methods for organization plan operations
 * These methods use API key authentication and should only be used in server-side files
 * (+server.ts, +layout.server.ts) to prevent API keys from being exposed to the client.
 */
export class OrgPlanApiServer {
  /**
   * Creates a new organization plan (server-side)
   * @param params Organization plan creation parameters
   * @returns Response data or null on error
   */
  static async createOrgPlan(params: TCreateOrgPlan) {
    try {
      const response = await classroomio.organization.plan.$post(
        {
          json: params
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating org plan (server):', error);
      return null;
    }
  }
}
```

**Usage in webhook handlers:**

```typescript
// apps/dashboard/src/routes/api/polar/webhook/+server.ts
import { OrgPlanApiServer } from '$features/org/api/org-plan.server';

// Use static method from .server.ts class
const result = await OrgPlanApiServer.createOrgPlan(planData);
```

#### File Naming Convention

- **`.svelte.ts`**: Client-side API classes (for Svelte components)
  - Example: `org.svelte.ts`, `org-plan.svelte.ts`
  - Uses Svelte reactivity (`$state`, `$derived`)
  - Manages component state and loading/error states
  - **Never** contains API key logic

- **`.server.ts`**: Server-side API classes (for server-side files)
  - Example: `org.server.ts`, `org-plan.server.ts`
  - Contains static methods with API key authentication
  - **Only** used in `+layout.server.ts`, `+page.server.ts`, `+server.ts` files
  - Automatically excluded from client bundles by SvelteKit

#### API Key Setup

1. Add `API_KEY` to `apps/api/src/config/env.ts` environment schema
2. Set `API_KEY` environment variable in your deployment
3. Use `authOrApiKeyMiddleware` in API routes that accept both user sessions and API keys
4. Create `.server.ts` files with static methods that use `getApiKeyHeaders()` helper

**Helper Function**: Use `getApiKeyHeaders()` from `$lib/utils/services/api/server` to get API key headers. This helper:
- Returns the correct headers format for RPC client
- Validates that `API_KEY` is configured
- Provides consistent API key authentication across all server-side files

#### Why This Pattern?

- ✅ **Security**: API keys are isolated in `.server.ts` files that cannot be imported on the client
- ✅ **Clear separation**: Client-side (`.svelte.ts`) vs server-side (`.server.ts`) is explicit
- ✅ **Type-safe**: Full TypeScript support end-to-end
- ✅ **Consistent**: Same API routes, same validation, same error handling
- ✅ **Maintainable**: Centralized server-side API methods in dedicated files
- ✅ **SvelteKit convention**: `.server.ts` files are automatically excluded from client bundles

### Frontend Best Practices

#### ✅ DO

**API Class Design:**
- **Handle ALL logic in API classes** - validation, loading, errors, success/failure, navigation
- **Always use `execute` method** in API abstraction classes (never call RPC client directly)
- **Always validate first** - Use `ZodSchema.safeParse()` before making API calls
- **Handle success in `onSuccess`** - Update stores, show snackbar, navigate, reset errors
- **Handle errors in `onError`** - Show snackbar, map validation errors to `this.errors`
- **Extend `BaseApiWithErrors`** for forms (provides `this.errors` for field-level validation)
- **Extend `BaseApi`** for simple API calls (provides `this.error` for general errors)
- **Use entity-specific translations** when multiple entities share field names

  ```typescript
  this.errors = mapZodErrorsToTranslations(error, 'course'); // "Course title is required"
  ```

**Component Design:**
- **Keep components thin** - Only render UI and call API methods
- **Bind to API state** - Use `api.isLoading`, `api.errors.fieldName`, `api.success`
- **Call API methods directly** - No `handleSave()` or `handleSubmit()` functions with logic
- **Display field errors** - Show `api.errors.fieldName` next to form fields
- **Display loading states** - Disable buttons with `api.isLoading`

**Server-Side:**
- **Use `.server.ts` API classes** in server-side files (`+layout.server.ts`, `+page.server.ts`, `+server.ts`)
- **Create `.server.ts` files** with static methods for server-side API calls with API key authentication
- **Use API key** for server-to-server communication (webhooks, external calls)

**General:**
- **Use type-safe RPC client** for API calls (Hono RPC)
- **Validate client-side** before API calls using shared schemas from `@cio/utils/validation`
- **Provide generic translations** as fallbacks for shared fields (email, password)
- **Show user-friendly, translated error messages**

#### ❌ DON'T

**API Class Anti-Patterns:**
- **DON'T call RPC client directly** in API classes (always use `execute` method)
- **DON'T return data from API methods** - Handle success in `onSuccess` callback
- **DON'T let components handle validation** - Validate in API class before API call
- **DON'T let components handle navigation** - Navigate in `onSuccess` callback
- **DON'T let components handle snackbar messages** - Show snackbar in `onSuccess`/`onError`
- **DON'T skip client-side validation** - Always validate before making API call
- **DON'T make API call if validation fails** - Return early on validation errors

**Component Anti-Patterns:**
- **DON'T write `handleSave()` functions with business logic** - Call API method directly
- **DON'T manually check `if (api.error)`** - API class handles errors in `onError`
- **DON'T manually call `goto()`** - API class handles navigation in `onSuccess`
- **DON'T manually call `snackbar`** - API class handles snackbar in callbacks
- **DON'T pass business logic data** (like `authorId`, `votes`, `slug`) - API class or service handles this
- **DON'T perform validation in components** - API class validates before API call

**Server-Side:**
- **DON'T call RPC client directly in server-side files** - use `.server.ts` API classes instead
- **DON'T use `.svelte.ts` API classes in server-side files** - they're for client-side Svelte components only
- **DON'T include API key logic in `.svelte.ts` files** - API keys must only be in `.server.ts` files

**General:**
- Skip error handling assuming API calls always succeed
- Display raw API error messages without formatting
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

---

## Refactoring Components to Features/UI

When moving components from `apps/dashboard/src/lib/components/` to `apps/dashboard/src/lib/features/ui/`, follow this workflow:

### Step 1: Determine Component Structure

**Single-file components**: Move directly to `features/ui/` with kebab-case naming:
- `components/CodeSnippet/index.svelte` → `features/ui/code-snippet.svelte`

**Components with related files** (stores, utils, etc.): Create a folder matching the component name:
- `components/Confetti/index.svelte` + `store.ts` → `features/ui/confetti/confetti.svelte` + `confetti-store.ts`
- `components/UploadWidget/index.svelte` + `utils.ts` → `features/ui/upload-widget/upload-widget.svelte` + `utils.ts`

**Naming Convention**:
- ✅ File name matches folder name: `confetti/confetti.svelte`, `upload-widget/upload-widget.svelte`
- ❌ Don't use `index.svelte` as the root file - always name it the same as the folder

### Step 2: Move Files

1. Create the new file(s) in `features/ui/` (or subfolder if needed)
2. Update internal imports (e.g., `./store` → `./confetti-store` within the folder)
3. Copy component code to new location

### Step 3: Update Exports

Add export to `apps/dashboard/src/lib/features/ui/index.ts`:
```typescript
export { default as ComponentName } from './component-name.svelte';
// or for folder-based components:
export { default as ComponentName } from './component-name/component-name.svelte';
```

Keep exports alphabetically sorted.

### Step 4: Update All Imports

Find all usages:
```bash
grep -r "components/OldComponent" apps/dashboard/src
```

Replace imports:
- **From**: `import Component from '$lib/components/OldComponent/index.svelte';`
- **To**: `import { Component } from '$features/ui';`

For store/utils imports:
- **From**: `import { store } from '$lib/components/OldComponent/store';`
- **To**: `import { store } from '$features/ui/component-name/store';`

### Step 5: Merge Duplicate Imports

After updating imports, check for duplicate imports from the same source and merge them:
```typescript
// Before
import { Confetti } from '$features/ui';
import { ComingSoon } from '$features/ui';

// After
import { Confetti, ComingSoon } from '$features/ui';
```

### Step 6: Clean Up

1. Delete old component files
2. Remove empty folders: `rmdir apps/dashboard/src/lib/components/OldComponent`
3. Verify no remaining references: `grep -r "components/OldComponent" apps/dashboard/src`
4. Run linter to check for errors

### Step 7: Verify

- ✅ No linter errors
- ✅ No remaining references to old path
- ✅ All imports use the new path
- ✅ Component exports correctly from `features/ui/index.ts`
- ✅ Related files (stores/utils) are properly organized

### Example: Complete Refactoring

**Before**:
```
apps/dashboard/src/lib/components/
  └── Confetti/
      ├── index.svelte
      └── store.ts
```

**After**:
```
apps/dashboard/src/lib/features/ui/
  ├── confetti/
  │   ├── confetti.svelte
  │   └── store.ts
  └── index.ts (exports Confetti)
```

**Import changes**:
- Component: `import { Confetti } from '$features/ui';`
- Store: `import { toggleConfetti } from '$features/ui/confetti/store';`

This refactoring centralizes UI components in a single location, making them easier to discover, maintain, and reuse across the application.
