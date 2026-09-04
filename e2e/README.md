# E2E test hooks

Playwright specs and helpers for PR demos and future end-to-end tests.

## Locator priority

1. `getByRole` / `getByLabel` when the control is accessible
2. Existing `#id` attributes (e.g. legacy login fields)
3. `getByTestId` for stable, locale-independent hooks

Do not select by CSS class, Tailwind utility, or translated copy in CI.

## Fixed test ids (infrastructure)

These ship in the app shell or shared UI and do not require call-site props.

| Test id | Surface |
|---|---|
| `auth-login-email` | Login email input |
| `auth-login-password` | Login password input |
| `auth-login-submit` | Login submit button |
| `org-nav-{path}` | Org sidebar links (derived from route path, e.g. `org-nav-courses`) |
| `org-switcher-trigger` | Org / workspace switcher |
| `app-sidebar-trigger` | Collapse sidebar |
| `app-notifications-trigger` | Header notifications |
| `app-user-menu-trigger` | Footer profile menu |
| `page-settings-actions` | Sticky settings save bar container |
| `page-settings-save` | Settings save button |
| `page-settings-discard` | Settings discard button |

Org nav ids are built by `orgNavTestId()` in `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`.

## Call-site test ids

Pass `testId` on `@cio/ui` field wrappers and buttons when a feature needs a stable hook:

```svelte
<InputField testId="course-settings-title" label={...} bind:value={...} />
<Button testId="course-create-submit">Create</Button>
```

Naming: kebab-case, feature-scoped — `{area}-{element}` or `{area}-{element}-{action}`.

## Helpers

- `e2e/helpers/login.ts` — `loginAsAdmin`, `openOrgCatalog`
- `e2e/helpers/nav.ts` — `clickOrgNav`, `goToOrgCourses`

## Running locally

Requires dashboard preview + API (see root `README.md`). Then:

```bash
pnpm exec playwright install chromium
DEMO_BASE_URL=http://localhost:4173 pnpm demo:playwright
```
