# Agent Guidance

This document collects implementation rules and workflow conventions for code changes.

## Research Requirements

When a task requires factual information (API specifications, context window sizes, library versions, pricing, rate limits, etc.), **look it up** using web search. Do not rely on educated guesses or assumptions from training data. If you're unsure whether something is a guess, look it up anyway.

## Translation, Formatting, and Git Workflow

- If `apps/dashboard/src/lib/utils/translations/en.json` changes, update the other dashboard locale files before staging or committing.
- To translate dashboard locale changes, run `cd apps/dashboard && pnpm translate`.
- After running translation, review the generated locale changes and make sure placeholders wrapped in `{}` were preserved exactly. Fix any translated variable names before continuing.
- Format changed files with the repo's changed-file formatter before staging. Prefer `pnpm format:changed` from the repository root. Use broader format commands only if the changed-file formatter is not sufficient for the task.
- If you changed files under `packages/ui/src/**`, make sure the required `ui:` Tailwind prefix rules still pass. Run `pnpm --filter @cio/ui prefix` if needed before the final formatting pass.
- Stage files only after translation and formatting are complete. Prefer explicit staging such as `git add path/to/file` or `git add <changed-files>` over broad staging commands.
- Before creating a commit, manually run the current `lefthook` checks that would run on `pre-commit`:
  - `pnpm format:check`
  - `pnpm --filter @cio/ui prefix:check:staged` if staged changes include `packages/ui/src/**/*.{svelte,ts,tsx,js,jsx}`
- Commit messages must follow the Conventional Commits 1.0.0 spec: https://www.conventionalcommits.org/en/v1.0.0/
- Never include agent-provider attribution in commits or commit trailers. Do not add `Co-authored-by` lines for Cursor, Claude, Codex, or any other tool.

## Naming Convention

- Use kebab-case for files (e.g. `user-profile.svelte`, `org.svelte.ts`).
- **Variables must read clearly at the call site.** Avoid opaque single-letter or ultra-short names (`d`, `x`, `tmp`) unless they match a universal convention (e.g. `i` in a trivial index loop). Prefer names that state intent (`deadlineDate`, `parsedUrl`, `nextSection`).
- **After an early `return` (or other guard exit), leave a blank line** before the next statement so the “happy path” block is visually separated from guards.
- **Never put an `await` or a complex/multi-call expression inside an object literal** (construction or update). Assign each value to a well-named local first, then reference it in the object. This keeps the call site readable and debuggable.
  ```ts
  // ❌ don't
  org.limits = { students: toResourceUsage(await countActiveStudents(org.id), getPlanLimit('students', plan)) };
  // ✅ do
  const studentsUsed = await countActiveStudents(org.id);
  const studentsLimit = getPlanLimit('students', plan);
  org.limits = { students: toResourceUsage(studentsUsed, studentsLimit) };
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

### Step 2: Database query
Put all direct database access in pure query functions under `packages/db/src/queries/{domain}/`. Routes and services never call Drizzle/`db` (or equivalent) directly—they import and compose these helpers.

```typescript
// packages/db/src/queries/auth/profile.ts
export async function updateProfile(userId: string, data: Partial<TProfile>) {
  // …db update returning the row or null if missing
}
```

### Step 3: Service
Services orchestrate one or more query functions (often inside a transaction), apply business rules, and raise `AppError` when something is invalid or missing. **Do not put SQL or other direct DB access in services**—only call query-layer functions and handle in-memory shaping or validation there.

```typescript
// apps/api/src/services/account.ts
import { updateProfile } from '@cio/db/queries/auth';

export async function updateUser(userId: string, data: Partial<TProfile>) {
  const updated = await updateProfile(userId, data);
  if (!updated) throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);

  return updated;
}
```

### Step 4: Route
Routes must return a single type (or a response shape whose `data` is a single type). If multiple shapes are needed, use separate endpoints or a keyed structure (e.g. `data` indexed by a key) so clients get one type per endpoint or key. Do not return a union of shapes from one route based on query parameters.

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

### Step 5: Register
```typescript
// apps/api/src/routes/account/index.ts
export * from './account';

// apps/api/src/app.ts
import { accountRouter } from '@api/routes/account';
export const app = new Hono().route('/account', accountRouter);
```

**Route mounts in `app.ts` must use a single root segment.** Do not mount nested paths like `.route('/internal/compliance', ...)` directly in `app.ts`. If a domain has sub-routers, compose them inside the domain's `routes/{domain}/index.ts` and expose a single aggregate router that `app.ts` mounts at `/${domain}`.

```typescript
// apps/api/src/routes/internal/index.ts
import { Hono } from '@api/utils/hono';
import { internalAnalyticsRouter } from './analytics';
import { internalComplianceRouter } from './compliance';

export const internalRouter = new Hono()
  .route('/compliance', internalComplianceRouter)
  .route('/analytics', internalAnalyticsRouter);

// apps/api/src/app.ts
import { internalRouter } from '@api/routes/internal';
export const app = new Hono().route('/internal', internalRouter);
```

**Route mounts in `app.ts` must use a single root segment.** Do not mount nested paths like `.route('/internal/compliance', ...)` directly in `app.ts`. If a domain has sub-routers, compose them inside the domain's `routes/{domain}/index.ts` and expose a single aggregate router that `app.ts` mounts at `/${domain}`.

```typescript
// apps/api/src/routes/internal/index.ts
import { Hono } from '@api/utils/hono';
import { internalAnalyticsRouter } from './analytics';
import { internalComplianceRouter } from './compliance';

export const internalRouter = new Hono()
  .route('/compliance', internalComplianceRouter)
  .route('/analytics', internalAnalyticsRouter);

// apps/api/src/app.ts
import { internalRouter } from '@api/routes/internal';
export const app = new Hono().route('/internal', internalRouter);
```

### Step 6: Build
```bash
pnpm --filter @cio/api build
```

### Step 7: Frontend Types & API Class
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
      onSuccess: () => {
        snackbar.success('Profile updated');
        this.success = true;
      },
      onError: (result) => {
        if ('field' in result) this.errors[result.field] = result.error;
      }
    });
  }
}
```

## Frontend Conventions

### Request Types and Where Types Live
Define all request and response-related types in the feature’s `utils/types.ts` file. **Do not define types or interfaces in `.svelte.ts` files** (e.g. `api/*.svelte.ts` or `store/*.svelte.ts`). Infer types from the API: request type from the RPC call, then success/data from the response type.

```typescript
// apps/dashboard/src/lib/features/org/utils/types.ts
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetTeamRequest = typeof classroomio.organization.team.$get;
export type CreateOrgRequest = typeof classroomio.organization.$post;
export type UpdateOrgRequest = typeof classroomio.organization.$put;

export type DeleteTeamRequest = (typeof classroomio.organization)['team'][':memberId']['$delete'];

export type GetTeamSuccess = Extract<InferResponseType<GetTeamRequest>, { success: true }>;
export type OrganizationTeamMembers = GetTeamSuccess['data'];
```

### Type Inference Rules

**Never import types from `@cio/db/queries` into dashboard code.**

**Never define types in `.svelte.ts` files.** Put them in `{domain}/utils/types.ts` and infer from API return types.

Pattern:
1. Define request type: `typeof classroomio.{route}.$method`
2. Infer response type: `InferResponseType<RequestType>`
3. Extract success response: `Extract<ResponseType, { success: true }>`
4. Extract data type: `SuccessType['data']`

For response shapes that need a small normalization (e.g. API returns `JSONValue`, app needs `Record<string, number>`), derive a normalized type in `types.ts` from the success `data` type (e.g. `Omit<Data, 'roleMapping'> & { roleMapping: Record<string, number> }`).

**Do not export custom types from `apps/api/src/rpc-types.ts`.** Only re-export Hono client types (e.g. `InferRequestType`, `InferResponseType`) and the typed client (`Client`, `hcWithType`). All feature-specific types belong in the dashboard's feature `utils/types.ts`, inferred from the API.

### API Class Pattern
API classes handle all logic; components should be thin.

### Translations (UI copy)

- No hardcoded user-facing text in components.
- Strings live in `apps/dashboard/src/lib/utils/translations/en.json`.
- Use `$t('key.path')` in markup and `t('key.path')` in script.

Example:
```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
</script>

<h1>{$t('course.navItem.lessons.heading_v2')}</h1>
```

Snackbar:
- Use translation keys directly (e.g. `snackbar.success('snackbar.profile.updated')`).
- Only use `t(...)` when combining keys or building dynamic strings.

Outside Svelte components:
- Use `t.get('key.path')` inside plain functions or utilities.

### Utility Functions Pattern

- Extract reusable transformations to `apps/dashboard/src/lib/features/{domain}/utils/{feature}-utils.ts`.
- Keep functions pure and accept all required data as parameters.

### Svelte store binding

You can bind form controls directly to a writable store’s properties. Svelte compiles `bind:value={$store.someProp}` so that reads come from the store and writes go back through the store (via `set`/`update`). Prefer this over duplicating state in the component and syncing with `$effect` (which can cause infinite loops or redundant updates).

```svelte
<script lang="ts">
  import { inviteSettingsStore } from './store';
</script>

<InputField bind:value={$inviteSettingsStore.customExpiresAt} />
<Select.Root type="single" bind:value={$inviteSettingsStore.preset}>
```

### Form Structure

For large dashboard forms, group fields by section instead of rendering one long flat list of controls.

- Use a top-level `Field.Group` as the form container.
- Split each logical section into its own `Field.Set`.
- Use `Field.Legend` for the section title.
- Separate sibling sections with `Field.Separator`.
- Inside each section, wrap related controls in an inner `Field.Group`.
- Put every control inside `Field.Field`, and use `orientation="horizontal"` for toggle or checkbox rows.
- Use `Field.Description` for helper copy that applies to a whole section.

Pattern:

```svelte
<Field.Group>
  <Field.Set>
    <Field.Legend>{$t('settings.section.heading')}</Field.Legend>

    <Field.Field orientation="horizontal">
      <Switch bind:checked={$store.section.enabled} />
      <Field.Label>{$t('settings.section.toggle')}</Field.Label>
    </Field.Field>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.section.title')}</Field.Label>
        <Input bind:value={$store.section.title} />
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('settings.section.description')}</Field.Label>
        <Textarea bind:value={$store.section.description} />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.other.heading')}</Field.Legend>
    <!-- more grouped fields -->
  </Field.Set>
</Field.Group>
```

Use `@cio/ui/custom/*-field` wrappers for standard app forms. When building larger settings/editor screens that need legends, descriptions, separators, grouped rows, or mixed controls such as `Switch`, `Checkbox`, `RadioGroup`, image pickers, and action buttons, compose the form with `@cio/ui/base/field` primitives and the matching base inputs instead.

### Reactive built-in collections

In Svelte 5, the built-in `Set` and `Map` classes are **not** reactive. Use `SvelteSet` and `SvelteMap` from `svelte/reactivity` instead. They are already reactive on their own — do **not** wrap them in `$state()`.

```svelte
<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  let selectedIds = new SvelteSet<string>();

  // Mutations are reactive — no clone-and-reassign needed
  selectedIds.add('abc');
  selectedIds.delete('abc');
  selectedIds.clear();
</script>
```

### Avoiding Svelte 5 rerender and `$effect` loops

`$effect` re-runs when any reactive value it **reads** changes. Writing state inside an effect can retrigger it and cause infinite loops, redundant work, or flicker. Prefer explicit event handlers and bindings over effect-driven syncing.

**Do not reset UI state in an effect tied to a steady condition** (e.g. “whenever `open` is false”). While the condition stays true, the effect keeps running and rewriting state:

```svelte
// ❌ don't — resets on every run while closed; can loop with bound children
$effect(() => {
  if (open) return;

  step = STEPS.STEP_1;
  fields = { fullname: '', email: '' };
  errors = { fullname: '', email: '' };
});
```

**Reset on transitions** — when a dialog closes, a route changes, or the user submits — not on every render where a flag is false:

```svelte
// ✅ do — reset only when the dialog actually closes
function resetForm() {
  step = STEPS.STEP_1;
  fields.fullname = '';
  fields.email = '';
  errors.fullname = '';
  errors.email = '';
}

function handleOpenChange(isOpen: boolean) {
  open = isOpen;

  if (!isOpen) {
    resetForm();
  }
}
```

```svelte
<Dialog.Root {open} onOpenChange={handleOpenChange}>
```

**Prefer `bind:` over `$effect` for keeping two sources in sync.** If a control can bind directly to a store or `$state` field, use that instead of reading one value in an effect and writing another (see **Svelte store binding** above).

**When resetting bound form state, mutate properties in place** instead of replacing the whole object. Reassigning `fields = { ... }` breaks `bind:value={fields.fullname}` and can trigger extra updates downstream:

```svelte
// ❌ don't
fields = { fullname: '', email: '' };

// ✅ do
fields.fullname = '';
fields.email = '';
```

**Other common pitfalls:**

- **Effect writes what it reads** — e.g. `$effect(() => { count = count + 1 })` loops forever.
- **Effect mirrors props into local state** — use `$bindable`, `bind:`, or derive a value; only copy props when you need a draft the user can cancel.
- **Effect fetches or navigates on every dependency tick** — gate with a guard, run on submit/route enter, or track “already loaded” so work runs once per intent.

When cleanup or reset must follow a specific lifecycle moment, use the matching hook: `onOpenChange` for dialogs, submit/success handlers for forms, `onMount` / load functions for one-time setup.

### Server-Side API Calls

Use `.server.ts` files for server-side code to isolate API keys.

### UI Components

- Add new UI components under `packages/ui/src` following existing folder patterns.
- **All Tailwind utility classes in `packages/ui/src/**` must use the `ui:` prefix** (see `packages/ui/README.md`). Pre-commit and CI run `pnpm --filter @cio/ui prefix:check` on touched UI files; fix with `pnpm --filter @cio/ui prefix`.
- Document component usage and props in `packages/ui/README.md`.
- Add example usages and variants in Storybook stories under `packages/storybook/src`.
- See `packages/ui/README.md` and `packages/storybook/README.md` for full guidance.
- For dashboard forms, prefer `@cio/ui/custom/*-field` wrappers (for example `InputField`, `TextareaField`, `CheckboxField`) so label/error/spacing behavior stays consistent.
- Use base primitives (`@cio/ui/base/input`, `@cio/ui/base/textarea`, `@cio/ui/base/checkbox`, `@cio/ui/base/label`) only when creating/updating reusable UI components or when no custom field wrapper exists.
- In app-level form UIs, do not introduce native form controls (`<input>`, `<textarea>`, `<label>`) when equivalent `packages/ui` components exist.
- **Icon-only buttons** (a `Button` whose content is just an icon, e.g. `size="icon"`) must use `variant="secondary"`.
- **Theme color classes:** Classes that use colors from `packages/ui/src/index.css` (e.g. `text-muted-foreground`, `text-primary`) must be prefixed with `ui:` in dashboard code so they resolve against the UI theme (e.g. `ui:text-muted-foreground`, `ui:text-primary`). Only color-related utilities need the prefix; layout/sizing classes like `rounded`, `border`, `p-4` stay unprefixed (Tailwind defaults).

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
- Use non-null assertion (`!`) for `user` when `authMiddleware` is present
- Put all user-facing copy in translations and reference by key
- Use `SvelteSet`/`SvelteMap` from `svelte/reactivity` for reactive collections (not `new Set`/`new Map`)
- Reset modal/form state in close/submit handlers or `onOpenChange`, not in `$effect` tied to a steady “closed” condition
- Mutate bound `$state` object fields in place when clearing forms (don't reassign the whole object)

### ❌ DON'T
- Put business logic in routes or queries
- Include validation in queries (belongs in routes)
- Handle HTTP concerns in services
- Skip client-side validation
- Let components handle validation, navigation, or snackbar
- Include API key logic in `.svelte.ts` files
- **Define types or interfaces in `.svelte.ts` files** — use `{domain}/utils/types.ts` and infer from API types
- Call RPC client directly in server files (use `.server.ts` classes)
- Add unnecessary null checks for `user` when `authMiddleware` is present
- Write plain English strings in components
- Use `new Set()`/`new Map()` for mutable reactive state — use `SvelteSet`/`SvelteMap` instead
- Wrap `SvelteSet`/`SvelteMap` in `$state()` — they are already reactive
- **Use `$effect` to reset form/modal state whenever a boolean is false** — use `onOpenChange` or explicit handlers on close instead
- **Reassign whole bound state objects to clear forms** (e.g. `fields = {}`) — mutate properties in place
- **Use inline type imports** (e.g. `import('Package').Type` in type positions) — use top-level `import type` instead

## Checklist for New Routes

- [ ] **Validation**: Schema in `packages/utils/src/validation/{entity}/`
- [ ] **Query**: Pure functions in `packages/db/src/queries/{domain}/`
- [ ] **Service**: Business logic in `apps/api/src/services/`
- [ ] **Route**: Handler in `apps/api/src/routes/{domain}/` (each route returns a single type)
- [ ] **Registration**: Export and register in `app.ts`
- [ ] **Build**: Run `pnpm --filter @cio/api build`
- [ ] **Frontend Types**: Request types in `apps/dashboard/src/lib/features/{domain}/utils/types.ts` (infer from API; do not import from `rpc-types`)
- [ ] **Frontend API**: API class in `apps/dashboard/src/lib/features/{domain}/api/`

## Common Patterns

### Query error logging (`packages/db/src/queries`)
In every `catch` block, log the original error with the function name so logs are traceable:
```typescript
} catch (error) {
  console.error('functionName error:', error);
  throw new Error(`Failed to ...`);
}
```

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

## Refactoring Components to Features/UI

When moving from `apps/dashboard/src/lib/components/` to `apps/dashboard/src/lib/features/ui/`:

1. **Single-file**: `components/CodeSnippet/index.svelte` → `features/ui/code-snippet.svelte`
2. **Multi-file**: `components/Confetti/` → `features/ui/confetti/confetti.svelte`
3. **Update exports** in `features/ui/index.ts`
4. **Update imports**: `import { Component } from '$features/ui';`
5. **Delete old files** and verify no remaining references

## Cursor Cloud specific instructions

The full setup/run flow lives in `README.md` and `DEV_SETUP_NOTES.md`. The notes below cover only the non-obvious, cloud-VM-specific caveats. The update script already runs `pnpm install` on startup.

### Node version (important)
The sandbox injects `/exec-daemon/node` (Node 22) at the front of `PATH`, so a bare `node`/`pnpm` runs under Node 22 even though the repo requires Node `^20.19.3` (`.nvmrc`). Node 20.19.3 is installed via nvm and set as the nvm default. Before running any `pnpm`/dev command, prepend the repo Node to `PATH`:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
```

`pnpm install` itself succeeds under either version (there is no `engine-strict`), but run the dev servers and DB scripts on Node 20.

### Services & how to run them
Docker is installed and provides Postgres 16 + Redis 7 (the app does not run them natively). After a fresh VM boot the Docker daemon is usually not running — start it (it needs the snapshot's `/etc/docker/daemon.json`, which already sets `fuse-overlayfs` + disables the containerd snapshotter, plus `iptables-legacy`):

```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &
sudo chmod 666 /var/run/docker.sock   # or prefix docker commands with sudo
docker compose -f docker/docker-compose.yaml up -d postgres redis
```

The per-app `.env` files (`apps/api/.env`, `apps/dashboard/.env`, `apps/jobs/.env`, `packages/db/.env`) are gitignored but persist in the VM snapshot with a matching `PRIVATE_SERVER_KEY`. If any are missing, recreate them per `README.md` (generate secrets with `openssl rand -hex 32`; the two `PRIVATE_SERVER_KEY` values must match).

The Postgres docker volume persists in the snapshot already seeded with demo data (login `admin@test.com` / `123456`). Re-seed only if needed: `pnpm --filter @cio/db db:setup:seed`.

Run the app (two long-lived processes; use tmux):
- `pnpm api:dev` → API on `http://localhost:3002` + 5 BullMQ workers.
- `pnpm dashboard:dev` → dashboard on `http://localhost:5173` + the `@cio/ui` Tailwind CSS watcher.

Do not use `pnpm dev` (it trips turbo's concurrency cap). Build shared package `dist/` once with `pnpm build` if you see `Failed to resolve entry for package "@cio/*"`.

### Known caveats
- **Vite SSR circular dependency (layerchart):** authenticated/chart pages occasionally render "Something unexpected occurred" on a cold load. Reload the page (or restart `dashboard:dev`) and it renders — it is intermittent, not a setup failure.
- **MinIO is optional and not started by default.** Without it, image/media thumbnails show "Failed to load"; that is expected. Start it with `docker compose -f docker-compose.yaml --profile minio up -d minio minio-init` and add the `OBJECT_STORAGE_*` vars from `README.md` to `apps/api/.env`.
- **Pre-existing lint/test issues (not environment problems):** `pnpm --filter @cio/api lint` fails (missing ESLint v9 `eslint.config.*`); `pnpm --filter @cio/dashboard lint` runs but reports pre-existing errors; api `vitest run` passes 61 tests but 5 files fail to load `@cio/core/services/*/*` subpaths (Vite nested-wildcard exports quirk; Node resolves them fine); `pnpm --filter @cio/dashboard test` (jest) fails to parse `jest.config.ts`. The pre-commit gate `pnpm format:check` passes.
- The optional `@cio/storybook` build fails on an unresolved `@lucide/svelte/icons/bot` import; it does not affect api/dashboard.

### Deployment mode: self-hosted vs cloud (affects which features you can test)
A single flag, `PUBLIC_IS_SELFHOSTED`, switches the whole product between **self-hosted** and **cloud** behavior. It is read in two places: the dashboard via `$env/static/public` (e.g. `apps/dashboard/src/lib/features/app/layout-setup.ts`) and the API/db layer via `@cio/core/config/env` (e.g. `apps/api/src/services/license.ts`, `apps/api/src/middlewares/license.ts`, `apps/api/src/services/onboarding.ts`). `FEATURE_AUDIT.md` §5 is the source-of-truth feature-by-feature map.

**This VM's local env is configured for CLOUD mode** (`PUBLIC_IS_SELFHOSTED=false` in both `apps/dashboard/.env` and `apps/api/.env`) so multi-tenant and all license-gated features are testable. The README contributor default is self-hosted; to switch this VM back, set `PUBLIC_IS_SELFHOSTED=true` in both files (or remove it from `apps/api/.env`) and restart both dev servers.

- **Self-hosted (`PUBLIC_IS_SELFHOSTED=true`)** — the README contributor default:
  - Single organization, single domain: creating a 2nd org is blocked (`onboarding.ts`), the "add org" UI is hidden, and the org is auto-assigned a `selfhosted` `ENTERPRISE` plan.
  - Enterprise features `sso`, `token-auth`, `no-tracking` are gated behind `LICENSE_KEY`, verified against the external `https://enterprise-api.classroomio.dev`. Without a key, `requireLicense` returns 403.
  - Polar billing and PostHog/Umami analytics are off.
- **Cloud (`PUBLIC_IS_SELFHOSTED` unset or `false`)**:
  - Multi-tenant: multiple orgs per user, "add org" shown; org is resolved from the **subdomain** (`acme.<PRIVATE_APP_HOST>`) or a custom domain. Locally there are no subdomains, so an org public site is simulated with the `?org=<siteName>` query param (sets the `_orgSiteName` cookie — see `layout-setup.ts`).
  - The license gate is a **no-op**, so all enterprise features are unlocked **without** a `LICENSE_KEY` — i.e. cloud mode is the easiest way to exercise SSO/token-auth/multi-org in dev.
  - Polar billing and analytics activate but are themselves gated by their own keys (absent keys just no-op), so they don't block startup.

Non-obvious gotcha: the README local-dev setup only sets `PUBLIC_IS_SELFHOSTED=true` in `apps/dashboard/.env`; `apps/api/.env` leaves it unset, so the **API behaves as cloud** (license no-op, 2nd org allowed) while the **dashboard UI is self-hosted**. To exercise a coherent mode, set the flag the same way in both files. The flag is read at process start, so restart the dev servers after editing it.

### Seeded tenants (good for multi-tenant testing)
The seed (`packages/db/src/utils/seed/organizationmember.ts`) creates **three independent organizations**, each with its own admin + student. All accounts use password `123456`:

| Org (siteName) | Admin | Student | Example courses |
|---|---|---|---|
| Udemy Test (`udemy-test`) | `admin@test.com` | `student@test.com` | Modern Web Development with React; Getting started with MVC; Data Science with Python and Pandas |
| Coursera Test (`coursera-test`) | `enterprise@test.com` | `enterprise-student@test.com` | SOC 2 Security Basics; HIPAA Awareness 2026 |
| Skillshare Test (`skillshare-test`) | `early-adopter@test.com` | `early-adopter-student@test.com` | Product Management Fundamentals |

In cloud mode you can demonstrate tenant isolation on the single local instance by visiting each org's public catalog via the `?org=<siteName>` param, e.g. `http://localhost:5173/?org=coursera-test` vs `?org=udemy-test` vs `?org=skillshare-test` — each renders its own branded catalog and courses. (Note: a user enrolled in courses across orgs becomes a member of multiple tenants, so after login the dashboard may open whichever org that user most recently used.)
