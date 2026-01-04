# API Route Development Guide

## Overview

This guide outlines standard practices for creating API routes in ClassroomIO. **All routes should be designed as potential public API endpoints.**

---

## Architecture Layers

```txt
┌─────────────────────────────────────┐
│   Frontend (Svelte/SvelteKit)      │
│   - UI Components                   │
│   - API Client (RPC with Hono)     │
│   - Client-side Validation          │
└──────────────┬──────────────────────┘
               │  ┌────────────────────────────┐
               ├──┤  Shared Validation Layer   │
               │  │  (@cio/utils/validation)   │
               │  └────────────────────────────┘
               ▼
┌─────────────────────────────────────┐
│   Route Layer (Hono)                │
│   - HTTP Request/Response           │
│   - Input Validation (Zod)          │
│   - Authentication Check            │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│   Service Layer                     │
│   - Business Logic                  │
│   - Transaction Orchestration       │
│   - Error Handling                  │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│   Query Layer (Drizzle ORM)         │
│   - Database Operations             │
│   - Pure Functions                  │
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

```typescript
// packages/db/src/types.ts (auto-generated - DO NOT EDIT)
export type TUser = typeof schema.user.$inferSelect; // For reading
export type TNewUser = typeof schema.user.$inferInsert; // For creating
```

**Regenerate after schema changes:**
```bash
cd packages/db && pnpm generate-types
```

---

## Layer 1: Queries

**Location**: `packages/db/src/queries/{domain}/{entity}.ts`

```typescript
import * as schema from '@db/schema';
import { db } from '@db/drizzle';
import { eq } from 'drizzle-orm';
import type { TNewOrganization, TOrganization } from '@db/types';

export const createOrganization = async (data: TNewOrganization) => {
  const [organization] = await db.insert(schema.organization).values(data).returning();
  return organization;
};

export const updateOrganization = async (id: string, data: Partial<TOrganization>) => {
  const [organization] = await db
    .update(schema.organization)
    .set(data)
    .where(eq(schema.organization.id, id))
    .returning();
  return organization;
};
```

**Best Practices:**
- Use `TNew{Table}` for creates, `Partial<T{Table}>` for updates
- Use `.returning()` for insert/update operations
- Add JSDoc comments for exported functions
- Keep queries pure (no business logic, no HTTP calls, no transactions)

---

## Layer 2: Services

**Location**: `apps/api/src/services/{domain}.ts`

```typescript
import { db } from '@cio/db/drizzle';
import { createOrganization, createOrganizationMember, checkSiteNameExists } from '@cio/db/queries/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function createOrganizationWithOwner(profileId: string, input: { orgName: string; siteName: string }) {
  const exists = await checkSiteNameExists(input.siteName);
  if (exists) {
    throw new AppError(`Site name already exists`, ErrorCodes.SITENAME_EXISTS, 409, 'siteName');
  }

  const result = await db.transaction(async (tx) => {
    const organization = await createOrganization({ name: input.orgName, siteName: input.siteName });
    const member = await createOrganizationMember({ organizationId: organization.id, profileId, roleId: 1 });
    return { organization, member };
  });

  return result;
}
```

### Error Handling

```typescript
// apps/api/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: ContentfulStatusCode = 500,
    public field?: string
  ) {
    super(message);
  }
}

export const handleError = (c: Context, error: unknown, fallbackMessage = 'An unexpected error occurred') => {
  if (error instanceof AppError) {
    return c.json({ success: false, error: error.message, code: error.code, field: error.field }, error.statusCode);
  }
  return c.json({ success: false, error: fallbackMessage }, 500);
};
```

**Best Practices:**
- Throw `AppError` with error codes and status codes
- Handle transactions within services
- Return structured data (not HTTP responses)
- Keep services focused on a specific domain

---

## Layer 3: Routes

**Location**: `apps/api/src/routes/{domain}/{entity}.ts`

> See [`apps/api/ROUTE_NAMING_BEST_PRACTICES.md`](apps/api/ROUTE_NAMING_BEST_PRACTICES.md) for naming conventions.

```typescript
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { zValidator } from '@hono/zod-validator';
import { createOrganizationWithOwner } from '@api/services/organization';
import { handleError } from '@api/utils/errors';
import { ZCreateOrg } from '@cio/utils/validation/organization';

export const organizationRouter = new Hono().post(
  '/',
  authMiddleware,
  zValidator('json', ZCreateOrg),
  async (c) => {
    try {
      const user = c.get('user')!; // Non-null assertion: authMiddleware guarantees user exists
      const body = c.req.valid('json');
      const result = await createOrganizationWithOwner(user.id, body);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create organization');
    }
  }
);
```

### Response Format

```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Message", "code": "ERROR_CODE", "field": "fieldName" }

// Paginated
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | GET, PUT, PATCH success |
| `201` | POST creating resource |
| `204` | DELETE success |
| `400` | Validation errors |
| `401` | Missing authentication |
| `403` | Not authorized |
| `404` | Resource not found |
| `409` | Duplicate resource |
| `500` | Server error |

### Authentication Middleware

```typescript
import { authMiddleware } from '@api/middlewares/auth';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';

.post('/create', authMiddleware, ...)           // User session required
.post('/webhook', apiKeyMiddleware, ...)        // API key required
.post('/plan', authOrApiKeyMiddleware, ...)     // Either user session or API key
```

**Important**: When using `authMiddleware`, the `user` is guaranteed to be non-null. Use the non-null assertion operator (`!`) to tell TypeScript this:

```typescript
// ✅ CORRECT: Use ! after authMiddleware
const user = c.get('user')!; // TypeScript knows user is non-null
const userId = user.id; // Safe to access

// ❌ WRONG: Don't add unnecessary null checks
const user = c.get('user');
if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401); // Unnecessary
```

### Authorization Middleware

**Generic middleware** (`apps/api/src/middlewares/`): Reusable across routes
- `orgMemberMiddleware` - User must be org member
- `orgTeamMemberMiddleware` - User must be ADMIN or TUTOR
- `orgAdminMiddleware` - User must be ADMIN
- `courseMemberMiddleware` - User must be course member

**Route-specific middleware** (`apps/api/src/routes/{domain}/middlewares/`): For resource-specific checks

```typescript
// apps/api/src/routes/community/middlewares/question-author-or-team.ts
export const questionAuthorOrTeamMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user')!;
  const question = await getQuestionAuthorAndCourse(c.req.param('id'));
  if (!question) return c.json({ success: false, error: 'Not found' }, 404);
  
  const isAuthor = question.authorId === user.id;
  const isTeamMember = await isUserCourseTeamMember(question.courseId, user.id);
  if (!isAuthor && !isTeamMember) return c.json({ success: false, error: 'Unauthorized' }, 403);
  
  await next();
};
```

---

## Validation Schemas

**Location**: `packages/utils/src/validation/{domain}/{entity}.ts`

```typescript
import * as z from 'zod';

export const ZCreateOrganization = z.object({
  name: z.string().min(5),
  siteName: z.string().min(5)
});
export type TCreateOrganization = z.infer<typeof ZCreateOrganization>;
```

**File Structure:**
```
packages/utils/src/validation/
  ├── course/course.ts
  ├── organization/organization.ts
  └── index.ts
```

**Naming Convention**: All files use **kebab-case** (`user-profile.svelte`, `org.svelte.ts`)

### Translation Strategy

Frontend maps validation errors using fallback system:
1. `validations.{entity}.{field}.{errorCode}` - Entity-specific
2. `validations.{field}.{errorCode}` - Generic field
3. `validations.generic.{errorType}` - Last resort

```typescript
mapZodErrorsToTranslations(error, 'course'); // "Course title is required"
mapZodErrorsToTranslations(error);            // "Title is required"
```

---

## Layer 4: Frontend

**Location**: `apps/dashboard/src/lib/features/{domain}/api/{entity}.svelte.ts`

### Request Types

Define request types in a separate `types.ts` file for reusability and cleaner code:

```typescript
// apps/dashboard/src/lib/features/org/utils/types.ts
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

// Without URL params - use dot notation
export type GetTeamRequest = typeof classroomio.organization.team.$get;
export type CreateOrgRequest = typeof classroomio.organization.$post;
export type UpdateOrgRequest = typeof classroomio.organization.$put;

// With URL params (e.g., :memberId) - use square bracket notation
export type DeleteTeamRequest = (typeof classroomio.organization)['team'][':memberId']['$delete'];

// Response types - for when you need to type response data
export type GetTeamSuccess = Extract<InferResponseType<GetTeamRequest>, { success: true }>;
export type OrganizationTeamMembers = GetTeamSuccess['data'];
```

### Type Inference Rules

**⚠️ CRITICAL: Never import types from `@cio/db/queries` into dashboard code.**

All data types in the dashboard must be inferred from RPC response types. This ensures type safety and keeps the frontend decoupled from database implementation details.

**❌ WRONG:**
```typescript
// apps/dashboard/src/lib/features/course/api/mark.svelte.ts
import type { Mark } from '@cio/db/queries/mark'; // ❌ NEVER DO THIS

export class MarkApi extends BaseApiWithErrors {
  data = $state<Mark[] | null>(null);
}
```

**✅ CORRECT:**
```typescript
// apps/dashboard/src/lib/features/course/utils/types.ts
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetMarksRequest = (typeof classroomio.course)[':courseId']['mark']['$get'];
export type GetMarksResponse = InferResponseType<GetMarksRequest> | null;
export type GetMarksSuccess = Extract<InferResponseType<GetMarksRequest>, { success: true }>;
export type Marks = GetMarksSuccess['data'];

// apps/dashboard/src/lib/features/course/api/mark.svelte.ts
import type { GetMarksRequest, Marks } from '../utils/types';

export class MarkApi extends BaseApiWithErrors {
  data = $state<Marks | null>(null); // ✅ Use inferred type from RPC response
}
```

**Pattern:**
1. Define request type: `typeof classroomio.{route}.$method`
2. Infer response type: `InferResponseType<RequestType>`
3. Extract success response: `Extract<ResponseType, { success: true }>`
4. Extract data type: `SuccessType['data']`

### API Class Pattern

API classes handle ALL logic. Components should be thin.

```typescript
// apps/dashboard/src/lib/features/org/api/org.svelte.ts
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ZCreateOrganization } from '@cio/utils/validation/organization';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';
import { goto } from '$app/navigation';
import type { CreateOrgRequest, GetTeamRequest } from '../utils/types';

class OrgApi extends BaseApiWithErrors {
  teamMembers = $state<OrganizationTeamMembers>([]);

  // Using type from types.ts
  async getOrgTeam() {
    return this.execute<GetTeamRequest>({
      requestFn: () => classroomio.organization.team.$get(),
      logContext: 'fetching organization team',
      onSuccess: (response) => {
        this.teamMembers = response.data;
      }
    });
  }

  // Using type from types.ts
  async create(fields: { name: string; siteName: string }) {
    const result = ZCreateOrganization.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'organization');
      return;
    }

    await this.execute<CreateOrgRequest>({
      requestFn: () => classroomio.organization.$post({ json: result.data }),
      logContext: 'creating organization',
      onSuccess: (response) => {
        if (response.data) {
          orgs.set(response.data.organizations);
          snackbar.success('Organization created');
          goto(`/org/${response.data.organization.siteName}`);
          this.success = true;
        }
      },
      onError: (result) => {
        if (typeof result === 'string') snackbar.error(result);
        else if ('field' in result) this.errors[result.field as string] = result.error;
      }
    });
  }
}
export const orgApi = new OrgApi();
```

### Component Usage

```svelte
<script lang="ts">
  import { orgApi } from '$features/org/api/org.svelte';
  let fields = $state({ name: '', siteName: '' });
</script>

<form onsubmit={() => orgApi.create(fields)}>
  <input bind:value={fields.name} class:error={orgApi.errors.name} />
  {#if orgApi.errors.name}<span>{orgApi.errors.name}</span>{/if}
  <button disabled={orgApi.isLoading}>{orgApi.isLoading ? 'Creating...' : 'Create'}</button>
</form>
```

### Utility Functions Pattern

When you have reusable data transformation or calculation functions that are duplicated across components, extract them into a dedicated utility file.

**Location**: `apps/dashboard/src/lib/features/{domain}/utils/{feature}-utils.ts`

**When to create utility files:**
- Functions are duplicated in multiple components
- Data transformation logic is complex and reusable
- Pure functions that can be easily tested
- Export/formatting functions used in multiple places

**Pattern:**

```typescript
// apps/dashboard/src/lib/features/course/utils/marks-utils.ts

// Define explicit types for clear contracts and testability

// Define shared functions for this feature
```

**Guidelines:**
- Keep functions pure (no side effects, except export functions which handle downloads)
- Use explicit types instead of generic `Record<string, string>` for better testability
- Accept all required data as parameters (don't rely on stores or global state)
- Document function purpose with JSDoc comments
- Group related functions in the same file (e.g., `marks-utils.ts` for all marks-related utilities)

**Example reference**: See `apps/dashboard/src/lib/features/course/utils/marks-utils.ts`

### Server-Side API Calls

Use `.server.ts` files for server-side code to isolate API keys:

```typescript
// apps/dashboard/src/lib/features/org/api/org.server.ts
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';

export class OrgApiServer {
  static async getOrgBySiteName(siteName: string) {
    const response = await classroomio.organization.$get({ query: { siteName } }, getApiKeyHeaders());
    const data = await response.json();
    return data.success && data.data?.length > 0 ? data.data[0] : null;
  }
}
```

## Creating a New Route

### Step 1: Validation Schema
```typescript
// packages/utils/src/validation/account/account.ts
export const ZUpdateProfile = z.object({
  fullname: z.string().min(5).optional(),
  username: z.string().min(1).optional()
});
export type TUpdateProfile = z.infer<typeof ZUpdateProfile>;
```

### Step 2: Service
```typescript
// apps/api/src/services/account.ts
export async function updateUser(userId: string, data: Partial<TProfile>) {
  const updated = await updateProfile(userId, data);
  if (!updated) throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
  return updated;
}
```

### Step 3: Route
```typescript
// apps/api/src/routes/account/account.ts
export const accountRouter = new Hono().put(
  '/user',
  authMiddleware,
  zValidator('json', ZUpdateProfile),
  async (c) => {
    try {
      const user = c.get('user')!;
      const data = c.req.valid('json');
      const result = await updateUser(user.id, data);
      return c.json({ success: true, data: result });
    } catch (error) {
      return handleError(c, error, 'Failed to update profile');
    }
  }
);
```

### Step 4: Register
```typescript
// apps/api/src/routes/account/index.ts
export * from './account';

// apps/api/src/app.ts
import { accountRouter } from '@api/routes/account';
export const app = new Hono().route('/account', accountRouter);
```

### Step 5: Build
```bash
pnpm --filter @cio/api build
```

### Step 6: Frontend Types & API Class

```typescript
// apps/dashboard/src/lib/features/account/utils/types.ts
import { classroomio } from '$lib/utils/services/api';

export type UpdateProfileRequest = typeof classroomio.account.user.$put;
```

```typescript
// apps/dashboard/src/lib/features/account/api/account.svelte.ts
import type { UpdateProfileRequest } from '../utils/types';

class AccountApi extends BaseApiWithErrors {
  async updateProfile(fields: TUpdateProfile) {
    const result = ZUpdateProfile.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      return;
    }
    await this.execute<UpdateProfileRequest>({
      requestFn: () => classroomio.account.user.$put({ json: result.data }),
      logContext: 'updating profile',
      onSuccess: () => { snackbar.success('Profile updated'); this.success = true; },
      onError: (result) => { if ('field' in result) this.errors[result.field] = result.error; }
    });
  }
}
```

---

## Best Practices Summary

### ✅ DO
- Use `AppError` with error codes and status codes
- Handle transactions in services
- Use `handleError` utility in route catch blocks
- Validate with Zod on both client and server
- Define request types in `{domain}/utils/types.ts` for reusability
- Use `this.execute<RequestType>()` in API classes (never call RPC directly)
- Keep components thin - only render UI and call API methods
- Use `.server.ts` for server-side API calls with API keys
- Use non-null assertion (`!`) for `user` when `authMiddleware` is present: `const user = c.get('user')!;`

### ❌ DON'T
- Put business logic in routes or queries
- Include validation in queries (belongs in routes)
- Handle HTTP concerns in services
- Skip client-side validation
- Let components handle validation, navigation, or snackbar
- Include API key logic in `.svelte.ts` files
- Call RPC client directly in server files (use `.server.ts` classes)
- Add unnecessary null checks for `user` when `authMiddleware` is present (use `!` instead)

---

## Checklist for New Routes

- [ ] **Validation**: Schema in `packages/utils/src/validation/{entity}/`
- [ ] **Query**: Pure functions in `packages/db/src/queries/{domain}/`
- [ ] **Service**: Business logic in `apps/api/src/services/`
- [ ] **Route**: Handler in `apps/api/src/routes/{domain}/`
- [ ] **Registration**: Export and register in `app.ts`
- [ ] **Build**: Run `pnpm --filter @cio/api build`
- [ ] **Frontend Types**: Request types in `apps/dashboard/src/lib/features/{domain}/utils/types.ts`
- [ ] **Frontend API**: API class in `apps/dashboard/src/lib/features/{domain}/api/`

---

## Common Patterns

### Transactions
```typescript
const result = await db.transaction(async (tx) => {
  const org = await createOrganization({ name, siteName });
  const member = await createOrganizationMember({ orgId: org.id, userId });
  return { org, member };
});
```

### Pagination
```typescript
const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20')
});

return c.json({
  success: true,
  data: items,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
});
```

---

## Refactoring Components to Features/UI

When moving from `apps/dashboard/src/lib/components/` to `apps/dashboard/src/lib/features/ui/`:

1. **Single-file**: `components/CodeSnippet/index.svelte` → `features/ui/code-snippet.svelte`
2. **Multi-file**: `components/Confetti/` → `features/ui/confetti/confetti.svelte`
3. **Update exports** in `features/ui/index.ts`
4. **Update imports**: `import { Component } from '$features/ui';`
5. **Delete old files** and verify no remaining references
