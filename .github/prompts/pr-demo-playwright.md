You are generating a **single Playwright demo test** for a ClassroomIO pull request.

## Your task

1. Read the PR title, description (especially **Demo** and **How should this be tested?**), and the code diff.
2. Write **one** Playwright test file at exactly this path:

   `.github/demo-runs/pr-{{PR_NUMBER}}.spec.ts`

3. Do **not** commit, push, or open a PR. Do **not** modify any other files. Do **not** start servers.

## Imports (required)

```ts
import { test, expect } from '@playwright/test';
import { loginAsAdmin, openOrgCatalog, DEMO_ADMIN, DEFAULT_ORG_SITE_NAME } from '../../e2e/helpers/login';
```

## Rules

- Use `getByRole`, `getByLabel`, or `getByTestId` (see `e2e/README.md` for stable hooks like `auth-login-email`, `org-nav-courses`, `app-sidebar-trigger`).
- Prefer the PR author's test plan; cover the main happy path only (keep the test under ~40 lines).
- Start with `loginAsAdmin(page)` when testing authenticated dashboard flows.
- For org public-site flows, call `openOrgCatalog(page)` before navigating.
- Use relative paths for navigation (e.g. `await page.goto('/courses')`) — baseURL is `http://127.0.0.1:4173`.
- Do not import `fs`, `child_process`, or call external URLs.
- Export exactly one `test('...', async ({ page }) => { ... })`.

## Seeded credentials (cloud mode)

- Admin: `admin@test.com` / `123456`
- Default org siteName: `udemy-test`

If the PR does not describe test steps clearly, write a minimal demo that logs in as admin and navigates to the most relevant route inferred from the diff.
