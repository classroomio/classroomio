# `@cio/core` — shared business services

This package holds the business-logic layer that both `apps/api` (HTTP) and `apps/jobs` (BullMQ worker) need to call. Anything in here is transport-agnostic: no Hono `Context`, no `ContentfulStatusCode`, no `c.json`, no `zValidator` middleware. Just functions that compose database queries, apply business rules, and raise `AppError` on failure.

The name is intentional: this is the **core** of the platform. The HTTP routes in `apps/api` and the worker processors in `apps/jobs` are thin transports over this layer. Anything they share has to live here — otherwise one app ends up depending on the other (`apps/jobs → apps/api` was the original sin that motivated extracting this package).

## What lives here

| Folder                         | Contents                                                                    |
| ------------------------------ | --------------------------------------------------------------------------- |
| `src/services/agent`           | The durable agent runner, chat-mode tool implementations, planning helpers. |
| `src/services/course`          | Course / section / content / landing-page business logic.                   |
| `src/services/exercise`        | Exercise + question CRUD and orchestration.                                 |
| `src/services/lesson`          | Lesson read/write helpers.                                                  |
| `src/services/assets`          | Asset upload, attach, detach, presign — used by both API routes and worker. |
| `src/services/jobs`            | BullMQ enqueue helpers (e.g. `startMediaJob`) callable from any service.    |
| `src/services/lesson-language` | Localized lesson content helpers.                                           |
| `src/utils`                    | Storage, presigning, sanitization, tinybird, redis helpers.                 |
| `src/config`                   | Env schema (`env`), storage config, dashboard URL helpers.                  |

## Placement rule

```
            ┌─────────────────────────────────────────────────────┐
            │  Does the function need a Hono Context, or call     │
            │  `c.json`, or validate a request shape?             │
            │                                                     │
            │      YES  →  it's a route handler, stays in         │
            │              `apps/api/src/routes/{domain}/…`       │
            │                                                     │
            │      NO   →  it's a business service, goes in       │
            │              `packages/core/src/services/{domain}/…`│
            └─────────────────────────────────────────────────────┘
```

If the function only touches the database and has no business logic, it doesn't belong here either — it goes in `packages/db/src/queries/{domain}/`. The split is:

- **Query layer** (`@cio/db/queries`): pure SQL/Drizzle helpers, no business rules.
- **Service layer** (`@cio/core/services`): composes queries, applies rules, throws `AppError`.
- **Route layer** (`apps/api/src/routes`): HTTP transport — auth, validation, status codes, response shapes.
- **Worker layer** (`apps/jobs/src/workers`): BullMQ transport — pulls a job, calls services, persists outcome.

## What does NOT belong here

- HTTP-shaped code (Hono types, response helpers, content-type handling) — keep in `apps/api`.
- BullMQ worker bootstrapping (Redis connection, worker lifecycle) — keep in `apps/jobs`.
- Frontend / Svelte / UI primitives — those live in `apps/dashboard` or `packages/ui`.
- Raw Drizzle query functions with no business logic — those go in `packages/db/queries`.

## Why it isn't called `@cio/services`

`@cio/core` is shorter and reads cleaner at import sites (`from '@cio/core/services/course/content'`). The folder structure makes it obvious that it's a services layer; the package name doesn't need to repeat that.

## History

This package was originally extracted as `@cio/agent-runtime` to hold the durable agent runner and its transitive closure. That closure turned out to be ~80% generic business services that `apps/api` and the worker both need, so the package was renamed to `@cio/core` to match its contents. The agent runner (`services/agent/course-generation-runner.ts`) remains the top-level export for `apps/jobs`, but it's just one of many services living here now.
