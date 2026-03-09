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
- **Services Utils**: Pure helper logic lives in `apps/api/src/services/{domain}/utils.ts`
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

**Important**: When using `authMiddleware`, the `user` is guaranteed to be non-null. Use the non-null assertion operator (`!`) to tell TypeScript this.

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
  const isTeamMember = await isCourseTeamMemberOrOrgAdmin(question.courseId, user.id);
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
