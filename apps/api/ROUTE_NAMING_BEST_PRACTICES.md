# API Route Naming and Structure Best Practices

This guide outlines best practices for naming and structuring API routes, inspired by Stripe's API design principles. These conventions ensure consistency, predictability, and maintainability across all API endpoints.

---

## Core Principles

### 1. **RESTful Resource Naming**

Use **plural nouns** for resource names, following REST conventions:

```typescript
// ✅ GOOD - Plural nouns
GET    /courses
POST   /courses
GET    /courses/:id
PUT    /courses/:id
DELETE /courses/:id

GET    /organizations
POST   /organizations
GET    /organizations/:id

// ❌ BAD - Singular nouns
GET    /course
POST   /course
GET    /organization
```

**Why?** Resources represent collections. Even when fetching a single item, you're accessing it from a collection.

---

### 2. **URL Structure Hierarchy**

Organize routes hierarchically to reflect resource relationships:

```typescript
// ✅ GOOD - Clear hierarchy
GET    /organizations/:orgId/courses
POST   /organizations/:orgId/courses
GET    /organizations/:orgId/courses/:courseId
PUT    /organizations/:orgId/courses/:courseId

GET    /courses/:courseId/lessons
POST   /courses/:courseId/lessons
GET    /courses/:courseId/lessons/:lessonId

// ❌ BAD - Flat structure loses context
GET    /courses (which org?)
GET    /lessons (which course?)
```

**Exception:** Top-level resources that don't belong to a parent:

```typescript
// ✅ OK - Top-level resources
GET    /account
PUT    /account/user
GET    /account/subscription
```

---

### 3. **HTTP Method Semantics**

Use HTTP methods correctly for their intended purpose:

| Method | Purpose | Idempotent | Response Body |
|--------|---------|------------|---------------|
| `GET` | Retrieve resource(s) | ✅ Yes | Always |
| `POST` | Create new resource | ❌ No | Created resource |
| `PUT` | Replace entire resource | ✅ Yes | Updated resource |
| `PATCH` | Partial update | ✅ Yes | Updated resource |
| `DELETE` | Remove resource | ✅ Yes | Usually empty (204) |

```typescript
// ✅ GOOD - Correct method usage
GET    /courses/:id              // Retrieve course
POST   /courses                  // Create course
PUT    /courses/:id              // Replace entire course
PATCH  /courses/:id              // Partial update
DELETE /courses/:id              // Delete course

// ❌ BAD - Wrong method
POST   /courses/:id/update       // Should be PUT or PATCH
GET    /courses/:id/delete       // Should be DELETE
POST   /courses/:id              // Should be PUT/PATCH for updates
```

---

### 4. **Nested Resources**

Nest resources when there's a clear parent-child relationship:

```typescript
// ✅ GOOD - Nested resources
GET    /courses/:courseId/lessons
POST   /courses/:courseId/lessons
GET    /courses/:courseId/lessons/:lessonId
PUT    /courses/:courseId/lessons/:lessonId

GET    /organizations/:orgId/members
POST   /organizations/:orgId/members
DELETE /organizations/:orgId/members/:memberId

// ❌ BAD - Flat structure with IDs
GET    /lessons?courseId=123     // Less clear hierarchy
POST   /lessons?courseId=123     // Relationship not obvious
```

**When to nest:**
- ✅ Child resource only exists within parent context
- ✅ Child resource ID is unique within parent (e.g., `lessonId` within `courseId`)
- ✅ Operations typically scoped to parent

**When NOT to nest:**
- ❌ Resource can exist independently
- ❌ Resource ID is globally unique
- ❌ Operations span multiple parents

```typescript
// ✅ OK - Independent resource
GET    /users/:userId            // User exists independently
GET    /courses/:courseId        // Course exists independently

// ✅ BAD - Unnecessary nesting
GET    /organizations/:orgId/users/:userId  // User is global, not org-specific
```

---

### 5. **Action Endpoints (Non-Resource Operations)**

For operations that don't map to CRUD, use action verbs as sub-resources:

```typescript
// ✅ GOOD - Action endpoints
POST   /courses/:id/clone
POST   /courses/:id/publish
POST   /courses/:id/unpublish
POST   /organizations/:id/invite
POST   /subscriptions/:id/cancel
POST   /subscriptions/:id/reactivate

// ❌ BAD - Verbs in main path
POST   /clone-course/:id
POST   /publish-course/:id
GET    /get-courses              // Redundant verb
```

**Pattern:** `POST /resource/:id/action`

**When to use:**
- ✅ State transitions (publish, unpublish, activate, cancel)
- ✅ Side effects (clone, duplicate, export)
- ✅ Complex operations that don't fit CRUD

---

### 6. **Query Parameters**

Use query parameters for filtering, sorting, pagination, and optional data:

```typescript
// ✅ GOOD - Query parameters
GET    /courses?status=published
GET    /courses?orgId=123&status=published
GET    /courses?page=1&limit=20
GET    /courses?sort=created_at&order=desc
GET    /courses?search=javascript
GET    /organizations?siteName=acme

// ❌ BAD - Path parameters for filters
GET    /courses/status/published
GET    /courses/page/1
GET    /courses/search/javascript
```

**Common query parameter patterns:**

| Purpose | Parameter | Example |
|---------|-----------|---------|
| Filtering | `status`, `type`, `role` | `?status=active&type=course` |
| Search | `q`, `search` | `?q=javascript` |
| Pagination | `page`, `limit`, `offset` | `?page=1&limit=20` |
| Sorting | `sort`, `order` | `?sort=created_at&order=desc` |
| Date range | `startDate`, `endDate` | `?startDate=2024-01-01` |
| Boolean flags | `include`, `expand` | `?include=lessons&expand=metadata` |

---

### 7. **URL Parameter Naming**

Use **camelCase** for URL parameters to match JavaScript conventions:

```typescript
// ✅ GOOD - camelCase
GET    /courses/:courseId
GET    /organizations/:orgId
GET    /users/:userId
GET    /lessons/:lessonId

// ❌ BAD - snake_case or kebab-case
GET    /courses/:course_id
GET    /courses/:course-id
```

**Exception:** When matching database column names exactly:

```typescript
// ✅ OK - Matching database convention
GET    /courses/:id              // Generic ID
GET    /courses?siteName=acme    // Matches DB column
```

---

### 8. **Consistent Response Structure**

Maintain consistent response formats across all endpoints:

```typescript
// ✅ GOOD - Consistent structure
// Single resource
{
  "success": true,
  "data": { ... }
}

// Collection
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "field": "fieldName"  // Optional, for validation errors
}
```

---

### 9. **Versioning Strategy**

Plan for API versioning from the start:

```typescript
// Current (v1 implied)
.route('/courses', courseRouter)

// Future versioning
.route('/v1/courses', courseRouterV1)
.route('/v2/courses', courseRouterV2)

// Or use headers (Stripe style)
// X-API-Version: 2024-01-01
```

**Recommendation:** Start without versioning, add `/v1/` prefix when breaking changes are needed.

---

### 10. **Route Organization in Code**

Organize routes by domain/resource:

```typescript
// ✅ GOOD - Organized by resource
apps/api/src/routes/
  ├── course/
  │   ├── course.ts          // Main course routes
  │   ├── lesson.ts          // Lesson routes
  │   ├── clone.ts           // Clone action
  │   └── index.ts           // Re-exports
  ├── organization/
  │   ├── organization.ts    // Main org routes
  │   ├── team.ts            // Team member routes
  │   └── index.ts
  └── account/
      ├── account.ts         // Account routes
      └── index.ts
```

**Route registration:**

```typescript
// apps/api/src/app.ts
import { courseRouter } from '@api/routes/course';
import { organizationRouter } from '@api/routes/organization';
import { accountRouter } from '@api/routes/account';

export const app = new Hono()
  .route('/course', courseRouter)           // /course/*
  .route('/organization', organizationRouter) // /organization/*
  .route('/account', accountRouter);        // /account/*
```

---

## Complete Examples

### Example 1: Course Management

```typescript
// apps/api/src/routes/course/course.ts
export const courseRouter = new Hono()
  // List courses (with filters)
  .get('/', authMiddleware, zValidator('query', ZListCourses), async (c) => {
    // GET /course?orgId=123&status=published&page=1&limit=20
  })
  
  // Get single course
  .get('/:courseId', authMiddleware, zValidator('param', ZGetCourse), async (c) => {
    // GET /course/:courseId
  })
  
  // Create course
  .post('/', authMiddleware, zValidator('json', ZCreateCourse), async (c) => {
    // POST /course
  })
  
  // Update course (full)
  .put('/:courseId', authMiddleware, zValidator('json', ZUpdateCourse), async (c) => {
    // PUT /course/:courseId
  })
  
  // Update course (partial)
  .patch('/:courseId', authMiddleware, zValidator('json', ZPatchCourse), async (c) => {
    // PATCH /course/:courseId
  })
  
  // Delete course
  .delete('/:courseId', authMiddleware, zValidator('param', ZDeleteCourse), async (c) => {
    // DELETE /course/:courseId
  })
  
  // Actions
  .post('/:courseId/clone', authMiddleware, zValidator('json', ZCloneCourse), async (c) => {
    // POST /course/:courseId/clone
  })
  
  .post('/:courseId/publish', authMiddleware, zValidator('param', ZPublishCourse), async (c) => {
    // POST /course/:courseId/publish
  });
```

### Example 2: Nested Resources

```typescript
// apps/api/src/routes/course/lesson.ts
export const lessonRouter = new Hono()
  // List lessons for a course
  .get('/', authMiddleware, zValidator('query', ZListLessons), async (c) => {
    // GET /course/:courseId/lesson?page=1&limit=20
  })
  
  // Get single lesson
  .get('/:lessonId', authMiddleware, zValidator('param', ZGetLesson), async (c) => {
    // GET /course/:courseId/lesson/:lessonId
  })
  
  // Create lesson
  .post('/', authMiddleware, zValidator('json', ZCreateLesson), async (c) => {
    // POST /course/:courseId/lesson
  })
  
  // Update lesson
  .put('/:lessonId', authMiddleware, zValidator('json', ZUpdateLesson), async (c) => {
    // PUT /course/:courseId/lesson/:lessonId
  })
  
  // Delete lesson
  .delete('/:lessonId', authMiddleware, zValidator('param', ZDeleteLesson), async (c) => {
    // DELETE /course/:courseId/lesson/:lessonId
  });

// Register nested route
// apps/api/src/routes/course/course.ts
export const courseRouter = new Hono()
  // ... course routes ...
  .route('/:courseId/lesson', lessonRouter);  // Nested under course
```

### Example 3: Organization with Team

```typescript
// apps/api/src/routes/organization/organization.ts
export const organizationRouter = new Hono()
  // List organizations
  .get('/', authMiddleware, zValidator('query', ZListOrgs), async (c) => {
    // GET /organization?siteName=acme
  })
  
  // Get organization
  .get('/:orgId', authMiddleware, zValidator('param', ZGetOrg), async (c) => {
    // GET /organization/:orgId
  })
  
  // Create organization
  .post('/', authMiddleware, zValidator('json', ZCreateOrg), async (c) => {
    // POST /organization
  })
  
  // Update organization
  .put('/:orgId', authMiddleware, zValidator('json', ZUpdateOrg), async (c) => {
    // PUT /organization/:orgId
  })
  
  // Team management (nested)
  .get('/:orgId/team', authMiddleware, zValidator('param', ZGetTeam), async (c) => {
    // GET /organization/:orgId/team
  })
  
  .post('/:orgId/team/invite', authMiddleware, zValidator('json', ZInviteTeam), async (c) => {
    // POST /organization/:orgId/team/invite
  })
  
  .delete('/:orgId/team/:memberId', authMiddleware, zValidator('param', ZRemoveMember), async (c) => {
    // DELETE /organization/:orgId/team/:memberId
  });
```

---

## Anti-Patterns to Avoid

### ❌ Don't: Use verbs in resource names

```typescript
// ❌ BAD
GET    /get-courses
POST   /create-course
POST   /update-course/:id
GET    /delete-course/:id

// ✅ GOOD
GET    /courses
POST   /courses
PUT    /courses/:id
DELETE /courses/:id
```

### ❌ Don't: Mix singular and plural

```typescript
// ❌ BAD
GET    /course
POST   /courses
GET    /organization
POST   /organizations

// ✅ GOOD
GET    /courses
POST   /courses
GET    /organizations
POST   /organizations
```

### ❌ Don't: Use query parameters for required identifiers

```typescript
// ❌ BAD
GET    /courses?id=123
GET    /courses?courseId=123

// ✅ GOOD
GET    /courses/:courseId
GET    /courses/123
```

### ❌ Don't: Create deep nesting (>3 levels)

```typescript
// ❌ BAD - Too deep
GET    /organizations/:orgId/courses/:courseId/lessons/:lessonId/exercises/:exerciseId

// ✅ GOOD - Flatten when appropriate
GET    /exercises/:exerciseId?courseId=123&lessonId=456
// Or use a different resource structure
GET    /lessons/:lessonId/exercises/:exerciseId
```

### ❌ Don't: Use inconsistent naming

```typescript
// ❌ BAD - Mixed conventions
GET    /courses/:course_id
GET    /organizations/:orgId
GET    /users/:userId

// ✅ GOOD - Consistent camelCase
GET    /courses/:courseId
GET    /organizations/:orgId
GET    /users/:userId
```

---

## Checklist for New Routes

When creating a new route, ensure:

- [ ] Resource name is **plural** (e.g., `/courses`, not `/course`)
- [ ] URL parameters use **camelCase** (e.g., `:courseId`, not `:course_id`)
- [ ] HTTP method matches operation (GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove)
- [ ] Nested resources reflect parent-child relationships
- [ ] Action endpoints use `POST /resource/:id/action` pattern
- [ ] Query parameters used for filtering, pagination, sorting
- [ ] Route is registered in main `app.ts`
- [ ] Validation schema exists in `packages/utils/src/validation/`
- [ ] Route follows existing patterns in codebase
- [ ] Response format is consistent with other routes

---

## Summary

**Key Takeaways:**

1. **Plural nouns** for resources (`/courses`, `/organizations`)
2. **camelCase** for parameters (`:courseId`, `:orgId`)
3. **Hierarchical nesting** for related resources
4. **HTTP methods** used semantically (GET, POST, PUT, PATCH, DELETE)
5. **Action verbs** as sub-resources for non-CRUD operations
6. **Query parameters** for filtering, pagination, sorting
7. **Consistent structure** across all endpoints
8. **Organized by domain** in code structure

Following these conventions ensures your API is **predictable**, **maintainable**, and **developer-friendly**.

