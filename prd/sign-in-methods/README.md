# Sign-in Methods PRD

## Status

- Draft

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Interactive HTML prototypes for every surface live in [`prototypes/sign-in-methods/`](../../prototypes/sign-in-methods/) and are the approved design reference for layout, badge shape, states (single method / multiple methods / unknown / never signed in), copy, and navigation flow. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/sign-in-methods/index.html
```

| Surface | Files |
| --- | --- |
| Audience member profile (primary) | `audience-profile.html` |
| Audience list column | `audience-list.html` |
| Settings → Team list | `settings-team.html` |
| Own account settings | `account-settings.html` |
| Shared tokens | `app-theme.css` |

## Purpose

An org admin looking at a member today cannot tell how that person gets into the product. Password, Google, and enterprise SSO all render identically — an email address and nothing else. This feature surfaces each member's connected sign-in methods, and the method they last used, on the four places admins already look. The reference experiences are the member detail panels in Okta, WorkOS Admin Portal, and Google Workspace Admin, which separate "identities this account can use" from "how they last authenticated" rather than collapsing the two.

## Problem Statement

- An admin who has rolled out SSO has no way to see who is actually using it and who is still signing in with a password. That is the single most common question after an SSO rollout, and today it is unanswerable inside the product.
- Support cannot answer "why can't this user log in" without database access, because nothing in the UI says whether the user even has a password.
- Compliance-driven customers (the audience for `compliance-training-platform`) are asked to evidence that privileged accounts authenticate through the IdP. There is no screen to screenshot.
- `account.provider_id` has held this data since the Better Auth migration. The only code that reads it is `hasVerifiedEmailProvider()`. It is a fully populated column with no product on top of it.
- Users cannot see their own connected identities anywhere, which is table stakes in every comparable product.

## Confirmed Decisions

1. **Surfaces in v1**: all four — audience member profile, audience list column, Settings → Team list, and the user's own account settings page.
2. **Last-used tracking ships in v1**: the product records which method was used at each real sign-in, and the member profile shows "Last signed in with `<method>` · `<relative time>`".
3. **Cross-tenant SSO is labelled generically**: when a member's SSO identity belongs to a different organization, the badge reads `SSO` with no name. A connection's `display_name` is only rendered to admins of the org that owns that connection.
4. **Method kinds are a closed set**: `password`, `google`, `sso`, `token_auth`. Magic link is not a method — see Non-Goals.
5. **Precedence for single-badge surfaces**: `sso` > `token_auth` > `google` > `password`. Lists show only the highest-precedence method; the member profile shows every method.
6. **Badge bugs on the profile page are fixed in this PRD**: `user-analytics.svelte` passes `type=` to `Badge` where the prop is `variant=`, so the course filter badges never change state; and the course status badge uses raw color classes instead of the `success` / `warning` variants.
7. **Own account settings is read-only in v1**: the user sees their connected identities and when each was connected. Linking and unlinking are deferred — see Non-Goals and Risks.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Identity storage | `account` table (`packages/db/src/schema.ts:130`) with `provider_id`, `password`, `created_at` | Values in use: `'credential'`, `'google'`, per-org SSO provider ids |
| SSO connection metadata | `organization_sso_config` (`packages/db/src/schema.ts:2580`) with `better_auth_provider_id`, `display_name`, `organization_id` (unique, one per org) | This is the join key from `account.provider_id` to a human label |
| SSO provider id format | `` `org-${orgId.slice(0, 8)}-${provider.toLowerCase()}` `` — `generateProviderId()`, `apps/api/src/services/organization/sso.ts:33` | An implementation detail; must not be pattern-matched |
| Any read of `provider_id` | `hasVerifiedEmailProvider()`, `packages/db/src/queries/auth/profile.ts:10` | Only consumer in the codebase |
| Login recording | `trackLoginHook`, `packages/db/src/auth/hooks/track-login.ts:13` → `analytics_login_events` | `unique(user_id, logged_in_date)` + `onConflictDoNothing`: at most one row per user per day, and no provider column |
| Session hooks | `databaseHooks.session.create.after` / `.update.after`, `packages/db/src/auth.ts:97-126` | Both call `trackLoginHook`; `update` fires on session refresh (`updateAge` = 1 day), which is not a sign-in |
| Magic link (`login-link` plugin) | `packages/db/src/auth/plugins/login-link.ts:77` raw-inserts a session with `impersonatedBy: 'login-link'` | Creates no `account` row, and bypasses `databaseHooks` entirely. Only caller is `createViewAsStudentToken` |
| Token auth (`token-exchange` plugin) | `packages/db/src/auth/plugins/token-exchange.ts:86` raw-inserts a session; for new users `packages/db/src/auth/token-exchange.ts:76` calls `signUpEmail` with a random password | Produces a `credential` account row for a user who can never use a password |
| Member profile page | `/org/[slug]/audience/[profileId]` → `user-analytics.svelte`, header is `hero-profile-card.svelte` | Header shows avatar, name, email, last seen. No badges |
| Audience list | `audience.svelte:44` header array + `audience-member-row.svelte` | Columns are positional; header and cell order kept in sync manually |
| Team list | `settings/pages/teams.svelte:164-202` | `Field.Set` list, not a table. Role badge + "invite sent" badge already present |
| Own account settings | `/org/[slug]/settings` → `settings/pages/profile.svelte` | Profile picture, name, username, email change, language. No password UI, no identity UI |
| Account API | `apps/api/src/routes/account/account.ts` — `GET /`, `PUT /profile`, `GET /profile`, `POST /view-as-student-token` | No endpoint returns linked identities |
| Badge component | `packages/ui/src/base/badge/badge.svelte` | Variants `default | secondary | destructive | warning | success | outline`; base styles already size an inline `svg` to `size-3` |

## Data Sources Checked

- `packages/db/src/schema.ts` — `account`, `session`, `profile`, `analytics_login_events`, `organization_sso_config` shapes
- `packages/db/src/auth.ts` — plugin registration, `databaseHooks`, social provider config
- `packages/db/src/auth/plugins/login-link.ts` and `plugins/token-exchange.ts` — the two session write paths that bypass Better Auth
- `apps/api/src/services/organization/sso.ts` — provider id generation and Enterprise gating
- `apps/api/src/services/organization.ts:834-901` — `getUserAnalytics` response shape
- `packages/db/src/queries/organization/organization.ts` — `getOrganizationAudience`, `getOrganizationTeam`
- `prd/enterprise-sso [DONE]/README.md` — shipped SSO model and terminology

## Product Goals

- An admin can tell, at a glance and for any member, which sign-in methods that member has and which one they last used.
- An admin can scan the audience and team lists and spot the accounts that are not on SSO.
- A user can see their own connected identities.
- The data is honest: a method is shown only if the member can actually sign in with it.
- No identity information crosses an org boundary.

## Non-Goals (v1)

- **Linking and unlinking identities.** Unlink needs last-method guards, re-authentication, and a "set a password first" flow. Read-only in v1.
- **Magic link as a user-facing method.** The `login-link` plugin exists only to power "view as student"; there is no general magic-link login to report on. Impersonation sessions must not be recorded as sign-ins.
- **A full sign-in audit log.** One last-used record per user, not a history. `prd/enterprise-sso [DONE]` owns audit/observability.
- **Filtering or segmenting the audience by sign-in method.** The column ships; the filter does not.
- **Admin-forced method changes** (revoke a password, force SSO for one user). `organization_auth_policy.force_sso` already covers the org-wide case.
- **Backfilling last-used for historical logins.** Not recoverable; the field starts collecting at deploy.

---

## Functional Requirements

### 1. Audience member profile — `/org/[slug]/audience/[profileId]`

Prototype: `audience-profile.html`.

- `hero-profile-card.svelte` gains a badge row in the existing metadata flex (`lines 24-37`), below the email / last-seen line.
- The last-used line renders alongside the existing "Last seen" metadata: `Last signed in with Acme Okta · 3 days ago`. It uses the same `calDateDiff` helper as last seen.
- A **Sign-in methods** section renders below the metric cards **only when the member has two or more methods**. One method needs no section; the header badge already says it.
- The section lists each method as an `Item` row: icon, label, and `Connected <date>`.
- States the prototype covers, all of which must be implemented:
  - **Single method** — one header badge, no section.
  - **Multiple methods** — header badge shows the highest-precedence method, section lists all.
  - **Foreign SSO** — badge reads `SSO`, section row reads `SSO` with no connection name and no domain.
  - **Never signed in since the feature shipped** — methods render, last-used line is omitted entirely. Do not render "Unknown" or an empty dash.
  - **No methods at all** — an invited member who has never completed signup. Render nothing rather than an empty section.

### 2. Audience list — `/org/[slug]/audience`

Prototype: `audience-list.html`.

- A `Sign-in method` column sits between `Status` and `Date joined`.
- One badge per row, highest precedence only. A member with two methods shows one badge; the profile is where the full set lives.
- Pending invitees (no `profileId`) render an empty cell, matching how the name cell already degrades for them.
- The header array in `audience.svelte:44-49` and the cells in `audience-member-row.svelte` must be updated together — column order is positional.

### 3. Settings → Team list — `/org/[slug]/settings/teams`

Prototype: `settings-team.html`.

- The badge slots into the existing left-hand flex row, immediately after the role badge, matching the `mr-3 text-xs` pattern already there.
- Unverified members (invite sent, never signed in) keep only the existing "invite sent" badge and show no method badge.

### 4. Own account settings — `/org/[slug]/settings`

Prototype: `account-settings.html`.

- A new **Sign-in methods** `Field.Set` is appended to `profile.svelte`, after "Personal information".
- Each connected identity is one row: icon, label, and `Connected <date>`.
- The user's own SSO connection is always labelled with its `display_name` — a user is entitled to see their own IdP.
- Read-only. No unlink buttons, no "add method" affordance. A `Field.Description` explains that identities are managed by the organization.
- **Empty state**: a user with no account rows (token-auth-only, pre-fix) sees a single row explaining their access is managed by their organization.

### 5. Badge vocabulary (all surfaces)

| Kind | Label | Icon | Variant |
| --- | --- | --- | --- |
| `sso` | connection `display_name`, else `SSO` | `ShieldCheck` | `secondary` |
| `token_auth` | `Token auth` | `KeyRound` | `secondary` |
| `google` | `Google` | inline Google mark | `outline` |
| `password` | `Password` | `LockKeyhole` | `outline` |

Managed identities (`sso`, `token_auth`) use `secondary` so they read as the stronger state; self-managed ones use `outline`.

---

## Technical Design

### Data model (`packages/db/src/schema.ts`)

Two changes. Neither adds a table.

#### 1. Last-used columns on `profile`

`analytics_login_events` is the wrong home: `unique(user_id, logged_in_date)` with `onConflictDoNothing` means only the day's *first* login is ever written, so a provider column there would silently record the wrong method for anyone who signs in twice a day by different routes. `profile` is 1:1 with `user` (created by `createProfileHook`) and is already joined by every surface in this PRD.

```ts
// profile
lastSignInMethod: text('last_sign_in_method'),
lastSignInProviderId: text('last_sign_in_provider_id'),
lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true, mode: 'string' })
```

`lastSignInProviderId` stores the raw `account.provider_id` so the SSO label can be resolved against `organization_sso_config` at render time, org-scoped, rather than being frozen into the row. This follows the repo rule that a persisted column stores the relationship, not a copied display value.

#### 2. Stop token-exchange from minting fake password identities

`packages/db/src/auth/token-exchange.ts:76` calls `signUpEmail` with a random password, producing an `account` row with `provider_id = 'credential'` for a user who has no password and can never use one. Left alone, every token-auth user would be badged `Password` — the exact opposite of the truth.

Fix at the write site: after the sign-up completes, update the created row's `provider_id` to `'token-exchange'`. Better Auth only looks up `'credential'` when handling password sign-in, so retagging the row disables a path the user never had, and makes the column honest.

No migration is authored here; schema edits stop at a passing `@cio/db` build.

### Deriving available methods (query layer)

```
getSignInMethodsByUserIds(userIds, orgId):
  rows = select account.userId, account.providerId, account.createdAt,
                sso.displayName, sso.organizationId
         from account
         left join organization_sso_config sso
           on sso.better_auth_provider_id = account.provider_id
         where account.userId in userIds

  for each row:
    if providerId == 'credential'      -> { kind: 'password',   label: null }
    else if providerId == 'google'     -> { kind: 'google',     label: null }
    else if providerId == 'token-exchange' -> { kind: 'token_auth', label: null }
    else                               -> { kind: 'sso',
                                            label: sso.organizationId == orgId ? sso.displayName : null }

  group by userId, sort by PRECEDENCE
```

Two rules that carry the security and correctness weight:

- **Never pattern-match the provider id.** The `org-` prefix comes from `generateProviderId()` and is not a contract. Anything that is not a known literal and does not resolve through the join is still reported as `sso` with a null label — unknown-but-federated is the safe default.
- **Label only same-org connections.** `account` is global to the user; a learner in three orgs carries all three SSO identities. Comparing `sso.organizationId` to the requesting `orgId` is what stops an Acme admin learning that a shared learner also belongs to Globex.

The function takes an array of user ids and returns a `Map<userId, SignInMethod[]>` so the audience and team lists stay one round trip.

### Recording the last-used method

`databaseHooks.session.create.after` receives an optional second `context` argument. `ctx.path` identifies the route that produced the session, which is the only place the provider is knowable.

```
trackSignInMethodHook(session, ctx):
  method, providerId = derive(ctx.path, ctx.params)
    '/sign-in/email' | '/sign-up/email'   -> ('password', 'credential')
    '/callback/:id'                       -> ('google', ctx.params.id)   // when id == 'google'
    '/sign-in/sso' | '/sso/callback/:id'  -> ('sso', ctx.params.id)
    anything else                         -> return   // do not write

  update profile set last_sign_in_method, last_sign_in_provider_id, last_sign_in_at = now()
  where user_id = session.userId
```

Three guards, each covering a trap found in the audit:

- **Wire it to `session.create.after` only, never `session.update.after`.** The update hook fires on every session refresh (`updateAge` = 1 day). Recording there would make "last signed in" mean "last used the app", duplicating the existing last-seen field.
- **`login-link` must not record.** It raw-inserts a session (`plugins/login-link.ts:77`) so no hook fires today, and that is the correct behavior: its only caller is "view as student". An admin impersonating a learner must not overwrite that learner's sign-in record.
- **`token-exchange` must record explicitly.** It also raw-inserts (`plugins/token-exchange.ts:86`), so it calls the recorder directly with `('token_auth', 'token-exchange')` at that write site.

### Shared types

```ts
// packages/utils/src/validation/account/sign-in-method.ts
export const SIGN_IN_METHOD = {
  PASSWORD: 'password',
  GOOGLE: 'google',
  SSO: 'sso',
  TOKEN_AUTH: 'token_auth'
} as const;

export const ZSignInMethodKind = z.nativeEnum(SIGN_IN_METHOD);
export type TSignInMethodKind = z.infer<typeof ZSignInMethodKind>;
```

Response shapes, defined once and reused by all four endpoints:

```ts
type SignInMethod = { kind: TSignInMethodKind; label: string | null; connectedAt: string };
type LastSignIn = { kind: TSignInMethodKind; label: string | null; at: string } | null;
```

### API routes

| Method | Path | Change | Guard |
| --- | --- | --- | --- |
| GET | `/organization/audience/:userId/analytics` | Add `user.signInMethods: SignInMethod[]` and `user.lastSignIn: LastSignIn` | `authMiddleware`, `orgTeamMemberMiddleware` |
| GET | `/organization/audience` | Add `signInMethod: SignInMethod \| null` per row (highest precedence) | `authMiddleware`, `orgTeamMemberMiddleware` |
| GET | `/organization/team` | Add `signInMethod: SignInMethod \| null` per member | `authMiddleware`, `orgTeamMemberMiddleware` |
| GET | `/account/identities` | New. Returns `{ methods: SignInMethod[]; lastSignIn: LastSignIn }` for the caller | `authMiddleware` |

`/account/identities` resolves SSO labels against the caller's own connection rather than a requesting org, since a user always may see their own IdP.

Each route returns a single type, per the routing rules in `CLAUDE.md`.

### Frontend plan (dashboard)

Layering follows `CLAUDE.md`: validation → queries → services → routes → feature types → API class → component.

| Layer | File | Change |
| --- | --- | --- |
| Query | `packages/db/src/queries/auth/sign-in-methods.ts` | New. `getSignInMethodsByUserIds`, `recordSignInMethod` |
| Hook | `packages/db/src/auth/hooks/track-sign-in-method.ts` | New. `trackSignInMethodHook(session, ctx)` |
| Service | `apps/api/src/services/organization.ts` | `getUserAnalytics`, `getOrgAudience`, `getOrgTeam` attach methods |
| Service | `apps/api/src/services/account.ts` | `getAccountIdentities(userId)` |
| Types | `apps/dashboard/src/lib/features/audience/utils/types.ts` | Inferred from the API, per repo rules |
| Utils | `apps/dashboard/src/lib/features/audience/utils/audience-utils.ts` | `signInMethodBadgeVariant`, `signInMethodLabelKey` — mirrors the existing `statusBadgeVariant` / `statusLabelKey` pair |
| Component | `apps/dashboard/src/lib/features/ui/sign-in-method-badge.svelte` | New. Props `kind`, `label`. Used by all four surfaces |
| Surfaces | `hero-profile-card.svelte`, `user-analytics.svelte`, `audience.svelte`, `audience-member-row.svelte`, `teams.svelte`, `settings/pages/profile.svelte` | Render the badge |
| i18n | `apps/dashboard/src/lib/utils/translations/en.json` + `pnpm translate` | `sign_in_method.*` keys |

The badge is a dashboard feature component, not a `packages/ui` primitive — it encodes product vocabulary, not a reusable visual pattern.

### Build verification

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/db build
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
test -f apps/dashboard/.env || cp apps/dashboard/.env.example apps/dashboard/.env
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm format:check
```

## Implementation Order

### Phase 1: Schema and constants

1. Add `lastSignInMethod`, `lastSignInProviderId`, `lastSignInAt` to `profile` in `packages/db/src/schema.ts`.
2. Add `SIGN_IN_METHOD` and `ZSignInMethodKind` to `packages/utils/src/validation/account/sign-in-method.ts`.
3. `pnpm --filter @cio/db build`.

### Phase 2: Recording

4. Add `recordSignInMethod` to the new query file.
5. Add `trackSignInMethodHook`; wire it into `databaseHooks.session.create.after` only.
6. Retag the token-exchange `credential` row to `'token-exchange'` at `packages/db/src/auth/token-exchange.ts`, and call the recorder from the plugin's session write site.
7. Confirm `login-link` still records nothing.

### Phase 3: Query layer

8. `getSignInMethodsByUserIds(userIds, orgId)` with the `organization_sso_config` left join and the org-scoped label rule.
9. Precedence sort helper.

### Phase 4: Services and routes

10. Attach methods in `getUserAnalytics`, `getOrgAudience`, `getOrgTeam`.
11. Add `getAccountIdentities` and `GET /account/identities`.
12. `pnpm --filter @cio/api build`.

### Phase 5: Dashboard

13. `sign-in-method-badge.svelte` plus the badge-variant/label helpers.
14. Member profile: header badges, last-used line, Sign-in methods section.
15. Audience list column (header array + row cell together).
16. Team list badge.
17. Own account settings section.
18. Translation keys, then `cd apps/dashboard && pnpm translate`.

### Phase 6: Bug fixes and verification

19. `user-analytics.svelte`: `type=` → `variant=` on the filter badges; course status badge to `success` / `warning` variants.
20. Run the full build verification block.

## Acceptance Criteria

1. A member with only a password shows one `Password` badge on their profile, and no Sign-in methods section.
2. A member with Google and password shows a `Google` badge in the header (precedence) and a section listing both, each with its connected date.
3. A member who signed in through their own org's SSO shows a badge carrying the connection's `display_name`.
4. A member whose only SSO identity belongs to another organization shows `SSO` with no name, and the other org's `display_name` appears nowhere in the API response.
5. The audience list shows exactly one badge per member, the highest-precedence one, and an empty cell for pending invitees.
6. The team list shows the badge after the role badge, and shows no badge for unverified invitees.
7. A user visiting their own settings sees every identity they can sign in with, labelled with their own IdP name where applicable.
8. Signing in with email and password sets `last_sign_in_method = 'password'`; signing in with Google sets `'google'`; signing in through SSO sets `'sso'`.
9. A session refresh 24 hours after sign-in does not change `last_sign_in_at`.
10. Using "view as student" does not change the target learner's last-used record.
11. A user created through token exchange is badged `Token auth`, never `Password`.
12. A member who has not signed in since deploy renders their methods with no last-used line, and no placeholder text.
13. Loading the audience list for 50 members issues one sign-in-method query, not 50.
14. The course filter badges on the member profile visibly change state when clicked.
15. Existing audience, team, profile, and analytics behavior continues to work exactly as today (zero regression).
16. All user-facing strings use translation keys, and every locale file is regenerated.
17. `pnpm --filter @cio/db build`, `pnpm --filter @cio/api build`, `pnpm --filter @cio/dashboard build`, and `pnpm format:check` all pass.

---

## Risks and Mitigations

- **Risk**: Token-auth users created *before* this change already have `credential` account rows that are indistinguishable from real password users, and will be badged `Password`.
  - **Mitigation**: The retag fixes all new rows. For existing ones, ship a targeted script that retags `credential` rows belonging to users who are members only of orgs with token auth configured and who have no other account row. Users outside that intersection are genuinely ambiguous; leave them and document the limitation.
- **Risk**: `ctx.path` is a Better Auth internal shape, so a library upgrade could silently change the strings and stop recording.
  - **Mitigation**: `derive()` returns early on anything unrecognized, so an upgrade degrades to "no last-used line" rather than wrong data. Add unit tests over the path strings so the break is loud at CI time, not in production.
- **Risk**: `last_sign_in_*` is null for the entire user base on deploy day, making the feature look broken.
  - **Mitigation**: The last-used line is omitted rather than showing a placeholder, and the methods badges — which are fully retroactive from `account` — carry the feature on their own from minute one.
- **Risk**: A member's SSO identity leaks another org's connection name.
  - **Mitigation**: The label is resolved by comparing `organization_sso_config.organization_id` to the requesting org, in the query layer rather than at render time, so no route can opt out. Acceptance criterion 4 tests the response body, not just the UI.
- **Risk**: Adding methods to the audience list introduces an N+1 across a paginated list.
  - **Mitigation**: The query is batched by `inArray(userIds)` and returns a map, mirroring the existing batched last-seen lookup in `packages/db/src/queries/analytics/analytics.ts:90`. Acceptance criterion 13 covers it.
- **Risk**: Read-only identities invite the immediate follow-up "let me unlink Google", and shipping that carelessly locks users out.
  - **Mitigation**: Explicitly a non-goal. When it is picked up it needs a last-method guard, a set-a-password step, and re-authentication — a PRD of its own.
- **Risk**: Rendering the Google brand mark inline pulls a third-party logo into the design system.
  - **Mitigation**: Inline the mark in the feature component only, sized by the existing `[&>svg]:size-3` badge rule. It does not enter `packages/ui`.
