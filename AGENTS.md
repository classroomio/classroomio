# Agent Guidance

This document collects implementation rules and workflow conventions for code changes.

## Research Requirements

When a task requires factual information (API specifications, context window sizes, library versions, pricing, rate limits, etc.), **look it up** using web search. Do not rely on educated guesses or assumptions from training data. If you're unsure whether something is a guess, look it up anyway.

## Naming Convention

- Use kebab-case for files (e.g. `user-profile.svelte`, `org.svelte.ts`).
- **Variables must read clearly at the call site.** Avoid opaque single-letter or ultra-short names (`d`, `x`, `tmp`) unless they match a universal convention (e.g. `i` in a trivial index loop). Prefer names that state intent (`deadlineDate`, `parsedUrl`, `nextSection`).
- **After an early `return` (or other guard exit), leave a blank line** before the next statement so the “happy path” block is visually separated from guards.

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
