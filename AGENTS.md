# Agent Guidance

This document collects implementation rules and workflow conventions for code changes.

## Naming Convention

- Use kebab-case for files (e.g. `user-profile.svelte`, `org.svelte.ts`).

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

### Request Types
Define request types in a separate `types.ts` file for reusability and cleaner code:

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

Pattern:
1. Define request type: `typeof classroomio.{route}.$method`
2. Infer response type: `InferResponseType<RequestType>`
3. Extract success response: `Extract<ResponseType, { success: true }>`
4. Extract data type: `SuccessType['data']`

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

### Server-Side API Calls

Use `.server.ts` files for server-side code to isolate API keys.

### UI Components

- Add new UI components under `packages/ui/src` following existing folder patterns.
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

### ❌ DON'T
- Put business logic in routes or queries
- Include validation in queries (belongs in routes)
- Handle HTTP concerns in services
- Skip client-side validation
- Let components handle validation, navigation, or snackbar
- Include API key logic in `.svelte.ts` files
- Call RPC client directly in server files (use `.server.ts` classes)
- Add unnecessary null checks for `user` when `authMiddleware` is present
- Write plain English strings in components

## Checklist for New Routes

- [ ] **Validation**: Schema in `packages/utils/src/validation/{entity}/`
- [ ] **Query**: Pure functions in `packages/db/src/queries/{domain}/`
- [ ] **Service**: Business logic in `apps/api/src/services/`
- [ ] **Route**: Handler in `apps/api/src/routes/{domain}/`
- [ ] **Registration**: Export and register in `app.ts`
- [ ] **Build**: Run `pnpm --filter @cio/api build`
- [ ] **Frontend Types**: Request types in `apps/dashboard/src/lib/features/{domain}/utils/types.ts`
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
