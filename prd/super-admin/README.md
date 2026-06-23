# Super Admin Panel PRD

## Purpose

Build a password-gated super admin panel that lets the ClassroomIO operator manage all users across the database without needing a user account. Use cases:

1. **User management** — view a paginated, searchable table of every user; open individual profile pages with stats
2. **AI chat inspection** — view all AI assistant conversations for any user and copy an entire chat transcript with one click
3. **Credit management** — top up AI credits for any org directly from the panel
4. **Org creation** — create a new organization and assign an existing user as its admin
5. **Impersonation** — "Login as" any user to act on their behalf on `app.classroomio.com`

The panel has no user account of its own. Access is controlled by a single `SUPER_ADMIN_PASSWORD` env var, mirroring the existing `/admin/queues` pattern. It ships as a **separate app** (`apps/admin/`) so it never bloats the user-facing dashboard bundle and can be deployed independently.

---

## Confirmed Decisions

1. **Separate app**: `apps/admin/` — own SvelteKit app, own `package.json`, own deployment. Zero code shared with `apps/dashboard/` at the bundle level.
2. **Auth pattern**: `X-Super-Admin-Key` request header checked against `SUPER_ADMIN_PASSWORD` env var via timing-safe comparison on the API side. Same approach as `QUEUE_DASHBOARD_PASSWORD` in `apps/api/src/routes/admin/queues.ts`.
3. **Password gate UX**: Custom login form in the admin app. Password stored in `sessionStorage` — survives page refresh, cleared on tab close.
4. **API proxy**: `apps/admin/src/hooks.server.ts` forwards `/api/*` → `PRIVATE_SERVER_URL`. Client code calls `/api/admin/users` etc. No tenant routing complexity needed — this is internal only.
5. **Impersonation**: Reuses `mintLoginLinkToken` from `packages/db/src/auth/login-link.ts`. Admin opens the resulting URL (`https://app.classroomio.com/api/auth/login-link?token=...&redirect=/home`) in a new tab. TTL: 60 minutes.
6. **AI credits**: `aiCreditBalance` is per-org. The UI shows a user's admin orgs with current credit balance; operator enters an amount to add. Calls existing `upsertCreditBalance` query.
7. **Org creation**: Reuses `createOrganization` + `createOrganizationMember` query pattern, accepting a target `userId` instead of the session user.

---

## Architecture

```mermaid
flowchart LR
    subgraph adminApp ["apps/admin/ (standalone SvelteKit)"]
        Gate[Password Gate\nsessionStorage]
        UsersPage[Users Table]
        ProfilePage[User Profile\n+ Chats + Credits]
        NewOrgPage[Create Org Form]
        Proxy["hooks.server.ts\n/api/* → PRIVATE_SERVER_URL"]
    end

    subgraph api ["apps/api/ /admin/*"]
        Middleware[superAdminMiddleware\nX-Super-Admin-Key]
        UsersRouter[/admin/users/**]
        OrgsRouter[/admin/orgs/**]
    end

    subgraph existing [Existing packages]
        LoginLink[mintLoginLinkToken]
        CreditBalance[upsertCreditBalance]
        OrgCreate[createOrganization]
    end

    Gate -->|header via Proxy| Middleware
    Middleware --> UsersRouter
    Middleware --> OrgsRouter
    UsersRouter -->|impersonate| LoginLink
    OrgsRouter -->|credits| CreditBalance
    OrgsRouter -->|create| OrgCreate
```

---

## Phase 1: API Layer

### 1a. Env Config

**`packages/core/src/config/env.ts`** — add alongside `QUEUE_DASHBOARD_PASSWORD`:

```typescript
SUPER_ADMIN_PASSWORD: z.string().optional(),
```

### 1b. Super Admin Middleware

**`apps/api/src/middlewares/super-admin.ts`** (new file)

```typescript
import type { Context, Next } from 'hono';
import { env } from '@cio/core/config/env';

export async function superAdminMiddleware(c: Context, next: Next): Promise<Response | void> {
  const expected = env.SUPER_ADMIN_PASSWORD;

  if (!expected) {
    if (env.NODE_ENV !== 'production') return next();
    return c.json({ success: false, error: 'Super admin not configured' }, 503);
  }

  const key = c.req.header('X-Super-Admin-Key');
  if (!key || !timingSafeEqual(key, expected)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return next();
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
```

### 1c. DB Queries

**`packages/db/src/queries/admin/users.ts`** (new file)

```typescript
listUsers({ page, limit, search }: { page: number; limit: number; search?: string })
  → Promise<{ users: AdminUserRow[]; total: number }>
```
- LEFT JOIN `user` + `profile` on `profile.id = user.id`
- Subquery count of `organizationmember` per user → `orgCount`
- Subquery count of `groupmember` per profile → `courseCount`
- WHERE `user.name ILIKE '%search%' OR user.email ILIKE '%search%'` when search provided
- ORDER BY `user.createdAt DESC`, LIMIT / OFFSET for pagination

```typescript
getUserWithStats(userId: string) → Promise<AdminUserWithStats | null>
```
- Same joins plus: admin org count (`roleId = 1`), total org count, total course enrollments
- Include each admin org's `aiCreditBalance` (for the credits section)

**`packages/db/src/queries/admin/chats.ts`** (new file)

```typescript
listUserChats(userId: string) → Promise<ChatSummary[]>
// SELECT id, title, course_id, updated_at, jsonb_array_length(messages) as message_count
// FROM ai_chat_conversation WHERE user_id = userId ORDER BY updated_at DESC

getUserChat(conversationId: string, userId: string) → Promise<ChatConversation | null>
// Full row including messages JSONB WHERE id = conversationId AND user_id = userId
```

**`packages/db/src/queries/admin/orgs.ts`** (new file)

```typescript
createOrgWithAdmin({ name, siteName, profileId })
  → Promise<{ org: Organization; member: OrganizationMember }>
// Transaction: createOrganization + createOrganizationMember(roleId = ROLE.ADMIN, verified = true)
// Same pattern as apps/api/src/services/organization.ts
```

### 1d. Validation

**`packages/utils/src/validation/admin/admin.ts`** (new file)

```typescript
export const ZListUsersQuery = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  search: z.string().optional()
});

export const ZAddCredits = z.object({ amount: z.number().int().positive() });

export const ZCreateAdminOrg = z.object({
  name: z.string().min(5),
  siteName: z.string().min(5),
  ownerUserId: z.string().uuid()
});
```

### 1e. Services

**`apps/api/src/services/admin/users.ts`** (new file)
- `listAdminUsers(params)` — calls `listUsers` query
- `getAdminUserStats(userId)` — calls `getUserWithStats`; throws `AppError` 404 if not found
- `listAdminUserChats(userId)` — calls `listUserChats`
- `getAdminUserChat(conversationId, userId)` — calls `getUserChat`; throws 404 if not found
- `impersonateUser(userId)` — fetches `user.email` from DB, calls `mintLoginLinkToken({ userId, email, ttlMinutes: 60 })`, returns `{ loginUrl }`

**`apps/api/src/services/admin/orgs.ts`** (new file)
- `addOrgCredits(orgId, amount)` — calls `upsertCreditBalance(orgId, amount)` from `packages/db/src/queries/agent/token-usage.ts`
- `createOrgForUser(data)` — resolves `ownerUserId` → `profileId`, checks siteName uniqueness (409 if taken), calls `createOrgWithAdmin`

### 1f. Routes

**`apps/api/src/routes/admin/users.ts`** (new file)
```
GET  /users                        listAdminUsers (ZListUsersQuery)
GET  /users/:userId                getAdminUserStats
POST /users/:userId/impersonate    impersonateUser → { loginUrl }
GET  /users/:userId/chats          listAdminUserChats
GET  /users/:userId/chats/:chatId  getAdminUserChat
```

**`apps/api/src/routes/admin/orgs.ts`** (new file)
```
POST /orgs                 createOrgForUser (ZCreateAdminOrg)
POST /orgs/:orgId/credits  addOrgCredits (ZAddCredits)
```

**`apps/api/src/routes/admin/index.ts`** (new file)
```typescript
import { Hono } from '@api/utils/hono';
import { superAdminMiddleware } from '@api/middlewares/super-admin';
import { adminUsersRouter } from './users';
import { adminOrgsRouter } from './orgs';

export const adminRouter = new Hono()
  .use('/*', superAdminMiddleware)
  .route('/', adminUsersRouter)
  .route('/', adminOrgsRouter);
```

### 1g. Register in app.ts

```typescript
import { adminRouter } from '@api/routes/admin';
// in the RPC chain:
.route('/admin', adminRouter)
```

`mountQueueDashboard(app)` stays untouched — its `/admin/queues/*` paths don't conflict.

### 1h. Build

```bash
pnpm --filter @cio/api build
```

---

## Phase 2: apps/admin — Standalone SvelteKit App

### 2a. App scaffold

**`apps/admin/`** — new workspace package

```
apps/admin/
  package.json
  svelte.config.js
  vite.config.ts
  tsconfig.json
  .env.example
  src/
    app.html
    hooks.server.ts          ← forwards /api/* to PRIVATE_SERVER_URL
    routes/
      +layout.svelte         ← password gate + nav
      +layout.ts             ← ssr: false
      +page.svelte           ← redirect to /users
      users/
        +page.svelte         ← paginated users table
        [userId]/
          +page.svelte       ← user profile
      orgs/
        new/
          +page.svelte       ← create org form
    lib/
      api.svelte.ts          ← AdminApi class
      types.ts               ← plain TS types (no RPC inference — standalone app)
```

**`package.json`**:
```json
{
  "name": "@cio/admin",
  "version": "0.0.1",
  "scripts": {
    "dev": "vite dev --port 5174",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node build/index.js"
  },
  "dependencies": {
    "@sveltejs/kit": "...",
    "@sveltejs/adapter-node": "...",
    "svelte": "..."
  }
}
```

**`svelte.config.js`**: adapter-node, no CSP complexity, alias `$lib` → `./src/lib`

**`.env.example`**:
```
PRIVATE_SERVER_URL=http://localhost:3002
PUBLIC_APP_URL=https://app.classroomio.com
```

### 2b. API proxy

**`src/hooks.server.ts`**

```typescript
import type { Handle } from '@sveltejs/kit';

const API_PREFIX = '/api';

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith(API_PREFIX)) {
    const upstream = process.env.PRIVATE_SERVER_URL;
    if (!upstream) return new Response('API not configured', { status: 502 });

    const upstreamUrl = new URL(
      event.url.pathname.slice(API_PREFIX.length) + event.url.search,
      upstream
    );

    const headers = new Headers(event.request.headers);
    headers.set('host', upstreamUrl.host);

    return fetch(upstreamUrl, {
      method: event.request.method,
      headers,
      body: event.request.method !== 'GET' ? event.request.body : undefined,
      // @ts-ignore
      duplex: 'half'
    });
  }

  return resolve(event);
};
```

### 2c. API class

**`src/lib/api.svelte.ts`**

`AdminApi` class — stores `password: string`, appends `'X-Super-Admin-Key': password` header to every fetch.

Methods:
- `listUsers(page, search?)` → `GET /api/admin/users`
- `getUser(userId)` → `GET /api/admin/users/:userId`
- `loginAsUser(userId)` → `POST /api/admin/users/:userId/impersonate` → `window.open(data.loginUrl, '_blank')`
- `listChats(userId)` → `GET /api/admin/users/:userId/chats`
- `getChat(userId, chatId)` → `GET /api/admin/users/:userId/chats/:chatId`
- `addCredits(orgId, amount)` → `POST /api/admin/orgs/:orgId/credits`
- `createOrg(data)` → `POST /api/admin/orgs`

Uses plain `fetch` (no Hono RPC client — standalone app has no `@cio/api` dep). Types defined locally in `src/lib/types.ts`.

### 2d. Password gate layout

**`src/routes/+layout.ts`**: `export const ssr = false;`

**`src/routes/+layout.svelte`**:
- On mount: read `sessionStorage.getItem('super-admin-pw')`
- If absent: render centered password form (input + submit button)
- On submit: `GET /api/admin/users?limit=1` with `X-Super-Admin-Key` header
  - 401 → show inline error
  - 200 → store in sessionStorage, show children
- Pass password to all child pages via Svelte context (`setContext`)
- Top nav: "ClassroomIO Admin" | Users | Create Org | Sign out (clears sessionStorage + reloads)

### 2e. Pages

**`/` (+page.svelte)**: redirect to `/users`

**`/users` (+page.svelte)** — Users table

DataTable columns: Avatar | Name | Email | Joined | Orgs | Courses | Verified | Banned | Actions

- Search input (debounced 300 ms), pagination controls
- Row actions: "View" → `/users/[id]`; "Login as" inline button

**`/users/[userId]` (+page.svelte)** — User profile

1. **Header**: avatar, full name, email, joined date, verified/banned badges + "Login as user" button
2. **Stats grid** (4 tiles): Orgs (member), Orgs (admin), Courses enrolled, Account status
3. **AI Chats**: conversation list → click to expand inline messages → "Copy chat" button formats as plain text and calls `navigator.clipboard.writeText`
4. **Orgs & Credits**: table of admin orgs with current credit balance + "Add credits" per row (inline number input → confirm)

**`/orgs/new` (+page.svelte)** — Create org

Fields: Org name, Site name, Owner user ID. On submit → success state with "Login as owner" shortcut.

---

## Files to Create

### API (apps/api)
| File | Purpose |
| --- | --- |
| `packages/core/src/config/env.ts` | +1 line: `SUPER_ADMIN_PASSWORD` |
| `packages/db/src/queries/admin/users.ts` | `listUsers`, `getUserWithStats` |
| `packages/db/src/queries/admin/chats.ts` | `listUserChats`, `getUserChat` |
| `packages/db/src/queries/admin/orgs.ts` | `createOrgWithAdmin` |
| `packages/utils/src/validation/admin/admin.ts` | `ZListUsersQuery`, `ZAddCredits`, `ZCreateAdminOrg` |
| `apps/api/src/middlewares/super-admin.ts` | `superAdminMiddleware` |
| `apps/api/src/services/admin/users.ts` | User + chat + impersonation services |
| `apps/api/src/services/admin/orgs.ts` | Credits + org creation services |
| `apps/api/src/routes/admin/users.ts` | User/chat/impersonate routes |
| `apps/api/src/routes/admin/orgs.ts` | Org/credits routes |
| `apps/api/src/routes/admin/index.ts` | Aggregate admin router |

### API (modified)
| File | Change |
| --- | --- |
| `apps/api/src/app.ts` | Add `import { adminRouter }` + `.route('/admin', adminRouter)` |

### apps/admin (all new)
| File | Purpose |
| --- | --- |
| `apps/admin/package.json` | Package config (`@cio/admin`) |
| `apps/admin/svelte.config.js` | adapter-node, `$lib` alias |
| `apps/admin/vite.config.ts` | Vite + SvelteKit |
| `apps/admin/tsconfig.json` | TypeScript config |
| `apps/admin/.env.example` | `PRIVATE_SERVER_URL`, `PUBLIC_APP_URL` |
| `apps/admin/src/app.html` | HTML shell |
| `apps/admin/src/hooks.server.ts` | `/api/*` → `PRIVATE_SERVER_URL` proxy |
| `apps/admin/src/lib/api.svelte.ts` | `AdminApi` class |
| `apps/admin/src/lib/types.ts` | Request/response types |
| `apps/admin/src/routes/+layout.ts` | `ssr = false` |
| `apps/admin/src/routes/+layout.svelte` | Password gate + nav |
| `apps/admin/src/routes/+page.svelte` | Redirect to /users |
| `apps/admin/src/routes/users/+page.svelte` | Users table |
| `apps/admin/src/routes/users/[userId]/+page.svelte` | User profile |
| `apps/admin/src/routes/orgs/new/+page.svelte` | Create org |

---

## Verification

1. `cd apps/admin && pnpm dev` — app starts on port 5174
2. Navigate to `localhost:5174` — password gate form appears
3. Wrong password → inline error; correct password → land on `/users`
4. User table loads with search and pagination
5. Open a user profile → stats, chats, and orgs sections load
6. Expand an AI chat → messages render; "Copy chat" copies plain-text transcript
7. Add credits to an org → balance refreshes
8. Create an org via `/orgs/new` → verify row in DB
9. "Login as user" → new tab opens at `app.classroomio.com` as that user
10. `pnpm build` in `apps/admin/` — builds independently with no dashboard code in the bundle
