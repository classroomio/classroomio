# Zapier Integration: Implementation Plan

Status: proposed, 2026-10-30. Build plan for `prd/zapier`. Where this plan and an earlier draft disagree, this plan wins on how to build; the product intent of every draft is kept.

Part I is the plan: scope, decisions, architecture, delivery, testing and rollout. Part II is the reference implementation: proposed code for every layer, written to this repo's conventions. An engineer or agent who has never seen the earlier drafts should be able to ship the feature from this file alone.

Every `path:line` reference was checked on 2026-10-30 against `main` (`35eb7fb05`) with the open Zapier and OAuth PRs merged on top (§2.1).

---

## Contents

**Part I: Plan**

0. [How to use this plan](#0-how-to-use-this-plan)
1. [What ships](#1-what-ships)
2. [Inputs and how they were reconciled](#2-inputs-and-how-they-were-reconciled)
3. [Decisions](#3-decisions)
4. [Architecture](#4-architecture)
5. [OAuth: building on the authorization server in #1435](#5-oauth-building-on-the-authorization-server-in-1435)
6. [Data model](#6-data-model)
7. [Public API changes](#7-public-api-changes)
8. [Webhook platform changes (managed subscriptions)](#8-webhook-platform-changes-managed-subscriptions)
9. [Dashboard](#9-dashboard)
10. [Zapier app (`apps/zapier`)](#10-zapier-app-appszapier)
11. [Delivery plan (PRs)](#11-delivery-plan-prs)
12. [Testing strategy](#12-testing-strategy)
13. [Rollout and operations](#13-rollout-and-operations)
14. [Documentation](#14-documentation)
15. [Risks and mitigations](#15-risks-and-mitigations)
16. [Spike: behaviors to verify first](#16-spike-behaviors-to-verify-first)
17. [Appendix](#17-appendix)

**Part II: Reference implementation**

- [R0. Conventions used in this code](#r0-conventions-used-in-this-code)
- [R1. Database](#r1-database)
- [R2. Shared constants and validation (`@cio/utils`)](#r2-shared-constants-and-validation-cioutils)
- [R3. OAuth server configuration (`@cio/db/auth`)](#r3-oauth-server-configuration-ciodbauth)
- [R4. Queries (`@cio/db/queries`)](#r4-queries-ciodbqueries)
- [R5. Core webhook services (`@cio/core`)](#r5-core-webhook-services-ciocore)
- [R6. API services](#r6-api-services)
- [R7. API middleware](#r7-api-middleware)
- [R8. API routes](#r8-api-routes)
- [R9. OpenAPI and API docs placement](#r9-openapi-and-api-docs-placement)
- [R10. Dashboard](#r10-dashboard)
- [R11. Zapier app](#r11-zapier-app)
- [R12. CI and release workflows](#r12-ci-and-release-workflows)
- [R13. Tests](#r13-tests)
- [R14. Help-center article skeletons](#r14-help-center-article-skeletons)

---

# Part I: Plan

## 0. How to use this plan

**Prerequisite.** [#1435](https://github.com/classroomio/classroomio/pull/1435) (OAuth 2.1 authorization server) must be merged before PR 1 in §11 starts. Zapier authenticates through it. [#1436](https://github.com/classroomio/classroomio/pull/1436) (remote MCP, stacked on [#1435](https://github.com/classroomio/classroomio/pull/1435)) is independent of Zapier but edits the same Automation area; rebase on it if it lands first.

**Work order.** Spike (§16) → PR 0 → PR 1 → PR 2 and PR 3 in parallel → PR 4 (§11). Each PR lists files, contracts, tests and acceptance criteria and points into Part II for code.

**Read before writing code:**

- `CLAUDE.md` / `AGENTS.md`: layering (validation → queries → services → routes), one migration per PR, naming, translations, Svelte 5 rules.
- `skills/writing-code/SKILL.md`: no comments except external constraints; JSDoc only for contracts. Part II follows it.
- `skills/public-api-review/SKILL.md`: actor model, scopes, entitlements, one-sentence `describeRoute` descriptions, docs sidebar, required tests.
- `skills/add-docs-image/SKILL.md` before any help-center screenshot.
- `skills/stage-and-commit/SKILL.md` and `skills/ship-feature/SKILL.md` for commits and PRs.
- `apps/docs/content/docs/developers/oauth.mdx` (added by [#1435](https://github.com/classroomio/classroomio/pull/1435)): the OAuth server's public contract.

**Defaults.** §3 lists decisions with a recommended default. Build the default unless a reviewer overrides it; decisions marked **sign-off** should be confirmed by a product owner before PR 1 merges.

**Repo rules that bite on this feature:**

- Node 24 (`export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"`). `skills/ship-feature` still says Node 20; that is stale.
- Do **not** run the dashboard vite build. Verify dashboard changes with `svelte-check` against a baseline (the repo has pre-existing errors) and targeted `vitest`. API and package builds are fine.
- Migrations are hand-written SQL: `meta/` only has snapshots up to `0027`, so `drizzle-kit generate` would re-emit 0028 onwards. Write the SQL, add the journal entry, mirror it in `packages/db/src/schema.ts`. The new `when` must be greater than `main`'s maximum at merge time; restamp and renumber on collision (CLAUDE.md "Database migrations").
- DB integration tests run on a throwaway database, never by migrating the shared dev DB from a feature branch.

**Reading the PR documents.** All open Zapier and OAuth PR documents can be read without checking out their branches:

```bash
git fetch origin ellenaokpani-patch-5 ellenaokpani-patch-7 feat/zapier-prototype-connections-flow docs/zapier-prd-instant-triggers feat/better-auth-1-7
git show origin/ellenaokpani-patch-5:prd/zapier/README.md            # #1452 PRD (polling, UX states)
git show origin/docs/zapier-prd-instant-triggers:prd/zapier/README.md  # #1441 PRD (REST hooks, catalog)
git show origin/feat/better-auth-1-7:apps/docs/content/docs/developers/oauth.mdx  # #1435 OAuth contract
git show origin/feat/zapier-prototype-connections-flow:prototypes/zapier-integration/README.md  # #1455 prototype
```

---

## 1. What ships

A native ClassroomIO app on Zapier, plus the server and dashboard pieces it needs:

1. **Zapier as a registered OAuth client** of the authorization server from [#1435](https://github.com/classroomio/classroomio/pull/1435): a trusted, confidential client with a fixed scope set, PKCE, and refresh-token settings that survive Zapier's parallel refreshes.
2. **Instant triggers (REST Hooks)** on the shipped webhooks platform: Zapier subscribes a target URL per Zap; ClassroomIO delivers signed events; Zapier unsubscribes when the Zap is turned off; revoking the connection removes its subscriptions.
3. **Small public API additions**: `GET /me`, exact-match search filters, an idempotent "enroll by email" endpoint, webhook subscription and sample endpoints, and a `webhook:subscription:*` scope pair.
4. **Zapier tab** under Automation (`/org/[slug]/automation/zapier`): connect, see Zapier connections and their active triggers, revoke, browse a curated app catalog. One tab, no new pages.
5. **Small OAuth UX deltas** on [#1435](https://github.com/classroomio/classroomio/pull/1435)'s screens: plan eligibility when choosing a workspace, a verified badge for trusted clients, and Zapier connections kept out of the MCP tab's generic list.
6. **`apps/zapier`**: a Zapier Platform CLI app (v19) with 14 triggers, 11 actions and 2 searches, built, tested and validated in CI, pushed manually.
7. **Docs**: help-center guides, API reference placement, webhooks changelog, developer OAuth page update.

Out of scope for v1 (§17.3): member tags and the Tag Student action, Clone Course and Grade Submission actions, programs, Make/n8n/Pipedream listings, Zapier's Workflow Element, Zapier for self-hosted installs.

---

## 2. Inputs and how they were reconciled

### 2.1 Sources

| Source | Author | What it is | Used for |
| --- | --- | --- | --- |
| [#1452](https://github.com/classroomio/classroomio/pull/1452) | Ellena Okpani | PRD rewrite: OAuth, polling triggers, 5/5/2 catalog, Zaps page states, App Directory, consent screen | UX states, gates, copy, manual QA list |
| [#1456](https://github.com/classroomio/classroomio/pull/1456) | Ellena Okpani | Prototype links at the top of the PRD; removes Open Questions | Links |
| [#1455](https://github.com/classroomio/classroomio/pull/1455) | Ellena Okpani | Prototype: Zaps page, App Directory, "ClassroomIO + {App}" page, simulated Zapier Connections; removes ClassroomIO consent and connection pages | Catalog content (20 apps), visual flow |
| [#1441](https://github.com/classroomio/classroomio/pull/1441) | Rotimi Best | PRD v2: instant REST Hook triggers on the shipped webhooks platform; 14/14/2 catalog; bearer-auth subscription endpoint | Trigger mechanism, catalog, subscription design |
| [#1435](https://github.com/classroomio/classroomio/pull/1435) | Rotimi Best | OAuth 2.1 authorization server on Better Auth 1.7 (`@better-auth/oauth-provider`): org selection, consent, JWT access tokens bound to a resource, rotating refresh tokens, per-request admin and plan checks, Connected apps on the MCP tab | **The** authorization server Zapier uses |
| [#1436](https://github.com/classroomio/classroomio/pull/1436) | Rotimi Best | Remote MCP over Streamable HTTP, stacked on [#1435](https://github.com/classroomio/classroomio/pull/1435); splits the MCP tab into Connections and deprecated Keys; stops creating MCP keys | Not a Zapier PR; affects the Automation area and connected-apps listing |
| Webhooks [#1320](https://github.com/classroomio/classroomio/pull/1320), [#1379](https://github.com/classroomio/classroomio/pull/1379), [#1404](https://github.com/classroomio/classroomio/pull/1404) | — | Shipped outbound webhooks: 25 events, Standard Webhooks signing, BullMQ delivery, health | Trigger delivery |
| Zapier platform docs, Better Auth 1.7 types | — | OAuth2 config, REST hooks, publishing rules, `refreshTokenReuseInterval` | §10, §16, §17.4 |

[#1452](https://github.com/classroomio/classroomio/pull/1452) and [#1441](https://github.com/classroomio/classroomio/pull/1441) each rewrite `prd/zapier/README.md` in full and are both open. PR 0 replaces both with one consolidated PRD.

### 2.2 Conflicts and resolutions

| # | Topic | Earlier drafts | Code / newer PRs | Resolution |
| --- | --- | --- | --- | --- |
| C1 | Trigger mechanism | [#1452](https://github.com/classroomio/classroomio/pull/1452): polling with `?since=` cursors; webhooks "unshipped" | Webhooks shipped; [#1441](https://github.com/classroomio/classroomio/pull/1441): REST Hooks | **REST Hooks** (D1). Payment requests have no table, so polling them is impossible anyway |
| C2 | OAuth server | [#1452](https://github.com/classroomio/classroomio/pull/1452) and [#1441](https://github.com/classroomio/classroomio/pull/1441): hand-rolled `/oauth/authorize`, `/oauth/token`, `/oauth/revoke` with `zapier:read`/`zapier:write`, opaque tokens and three token tables | [#1435](https://github.com/classroomio/classroomio/pull/1435): Better Auth OAuth 2.1 server, granular automation-key scopes, JWT access tokens | **Use [#1435](https://github.com/classroomio/classroomio/pull/1435)** (D3). Zapier is one more client. No authorization or token endpoints and no token tables of our own |
| C3 | Catalog | [#1452](https://github.com/classroomio/classroomio/pull/1452): 5/5/2. [#1441](https://github.com/classroomio/classroomio/pull/1441): 14/14/2 | Tags attach to courses only (`tag_assignment`: `tag_id`, `course_id`); grading takes per-question `answers` (`validation/public-api/course-submission.ts:26-42`); clone needs `course:write` | **14 triggers, 11 actions, 2 searches** (D2) |
| C4 | Consent screen | [#1452](https://github.com/classroomio/classroomio/pull/1452) keeps it; [#1455](https://github.com/classroomio/classroomio/pull/1455) removes it | [#1435](https://github.com/classroomio/classroomio/pull/1435) ships `/oauth/select-organization` and `/oauth/consent` | **Use [#1435](https://github.com/classroomio/classroomio/pull/1435)'s screens** with two small deltas (D4) |
| C5 | Read-only connections | Both PRDs: admins can untick write on consent | Better Auth's consent endpoint takes `accept` and optional claims, no scope narrowing (§17.4) | **Defer** (D4, sign-off). Zapier requests a fixed, least-privilege scope set |
| C6 | Plan downgrade | Both PRDs: revoke every grant immediately | [#1435](https://github.com/classroomio/classroomio/pull/1435): every OAuth request re-checks the plan and returns `403 UPGRADE_REQUIRED`; webhook deliveries are suppressed by entitlement | **Pause, don't revoke** (D7, sign-off). Upgrading restores Zaps without reconnecting |
| C7 | Zaps page "connected apps" (HubSpot, Slack, Zoom) | [#1455](https://github.com/classroomio/classroomio/pull/1455) shows them | [#1452](https://github.com/classroomio/classroomio/pull/1452) non-goal; Zapier's Zap-listing APIs need a public integration | **Show connections and their active triggers** (D8) |
| C8 | Separate pages under the Zapier tab | [#1452](https://github.com/classroomio/classroomio/pull/1452): connection screen, App Directory, per-app route | Requirement: Zapier is a tab under Automation; tab matcher uses `endsWith` (`automation/+layout.svelte:19-25`) | **One tab**; catalog is a section, an app opens in a sheet (D9) |
| C9 | "Create a Zap opens consent first"; "Deny returns to the Zaps page" | [#1452](https://github.com/classroomio/classroomio/pull/1452) | OAuth is client-initiated; denial redirects to the client | **Not possible as written** (D10). The dashboard sends the user to Zapier |
| C10 | Zapier connections in the generic list | — | [#1435](https://github.com/classroomio/classroomio/pull/1435)/#1436 list every connected app on the MCP tab | **Zapier tab owns Zapier connections**; the MCP tab excludes them (D17) |
| C11 | `type: 'zapier'` keys | Drop the enum value | Value exists in the DB enum (`schema.ts`, `ORGANIZATION_API_KEY_TYPE`) and skips every plan check today (`apps/api/src/services/organization/automation-usage.ts`, `assertOrganizationAutomationKeyCreationAllowed`) | **Keep the DB value, block creation** (D12) |
| C12 | Connection caps per plan | 5 / 25 grants | [#1435](https://github.com/classroomio/classroomio/pull/1435) grants are one consent per (admin, client, org) | **No connection cap**; cap trigger subscriptions instead (D11) |
| C13 | Automation hub card | Described as existing | `/automation` redirects to `/automation/mcp` | **No hub** |
| C14 | `integration-research.md` | Cited as the source of the 20 apps | Not in git history | Use `prototypes/zapier-integration/apps-catalog.js` |
| C15 | SSO dropping the return URL | — | [#1435](https://github.com/classroomio/classroomio/pull/1435) sends SSO users back to the OAuth flow (`(auth)/login/+page.svelte`) | Nothing to do |
| C16 | `apps/api/src/services/license.ts` downgrade hook | [#1452](https://github.com/classroomio/classroomio/pull/1452) | File does not exist | Not needed under D7 |

---

## 3. Decisions

| ID | Decision | Default | Why | Sign-off |
| --- | --- | --- | --- | --- |
| D1 | Trigger mechanism | REST Hooks on the webhooks platform; no polling | Instant; no new list endpoints; reuses signing, retries, health | — |
| D2 | v1 catalog | 14 triggers, 11 actions, 2 searches (§10.5-§10.7) | Every trigger maps to a shipped event; every action to an existing route or one new idempotent endpoint; least-privilege scopes | **sign-off** |
| D3 | Authorization server | [#1435](https://github.com/classroomio/classroomio/pull/1435). Zapier is a confidential client registered once by ops, listed in `cachedTrustedClients` | One OAuth server for MCP, Zapier and future clients | — |
| D4 | Consent UX | [#1435](https://github.com/classroomio/classroomio/pull/1435)'s pages, plus (a) plan eligibility on the workspace picker for the public-API resource and (b) a "Verified" badge for trusted clients. No read-only toggle in v1 | Avoid useless grants on Basic orgs; let admins trust Zapier; Better Auth has no scope narrowing on consent | **sign-off** (read-only) |
| D5 | Scopes | Existing automation-key vocabulary ([#1435](https://github.com/classroomio/classroomio/pull/1435)) plus `webhook:subscription:read` / `webhook:subscription:write`. Zapier requests exactly `ZAPIER_OAUTH_SCOPES` (R2.2) | No `course:write`, no team or organization scopes | — |
| D6 | Token policy | [#1435](https://github.com/classroomio/classroomio/pull/1435) defaults (10-minute JWT access tokens, rotating refresh tokens) plus `refreshTokenReuseInterval: 60` and a 90-day refresh-token lifetime | Zapier refreshes from parallel tasks; with a zero reuse interval the losing refresh is treated as theft and the connection dies. Trigger-only Zaps call the API rarely | — |
| D7 | Plan downgrade | Pause: `403 UPGRADE_REQUIRED` on every call; deliveries suppressed; the tab explains it; upgrading resumes | Matches [#1435](https://github.com/classroomio/classroomio/pull/1435); no data loss; PRD's "Zaps fail with a plan error" still holds | **sign-off** |
| D8 | Zaps list | Connections and their active triggers | All ClassroomIO can know before public listing | **sign-off** |
| D9 | Dashboard IA | One Zapier tab; catalog section; app sheet; state in the query string | Product requirement | — |
| D10 | Dashboard-initiated connect | CTAs open Zapier (invite URL while private, listing after); Zapier starts OAuth | OAuth is client-initiated | — |
| D11 | Managed subscriptions | `webhook_endpoint` rows with `oauth_consent_id` (cascade on revoke); excluded from the 20-endpoint cap and the Webhooks tab; capped per plan (50 / 250) | Reuse delivery; isolate customer endpoints; bound Zap counts | — |
| D12 | `zapier` key type | Keep the DB enum value; reject it in the create schema | Postgres can't drop an enum value cheaply; closes the plan-check gap | — |
| D13 | Enroll action | New `POST /public-api/v1/courses/:courseId/enrollments`, find-or-invite by email, idempotent | Existing add-member requires an existing org member (`course-member.ts:22-37`); Zapier retries actions | — |
| D14 | Entitlement | `canUsePublicApi` via [#1435](https://github.com/classroomio/classroomio/pull/1435)'s `assertPublicApiAllowed`; Zapier tab shows a cloud-only callout in self-hosted mode | Same gate as API keys and webhooks; the Zapier app targets `api.classroomio.com` | — |
| D15 | Brand marks in the catalog | Official assets per each brand's guidelines after a legal check; monogram fallback | Prototype logos are prototype-only | **sign-off** |
| D16 | Actor for Zapier actions | The admin who granted the connection; [#1435](https://github.com/classroomio/classroomio/pull/1435) re-checks admin on every request and deletes their grants when they lose it | Mirrors API keys | — |
| D17 | Connected-apps listing | API returns `kind: 'zapier' | 'app'`; Zapier tab shows `zapier`, MCP tab shows `app` | One source, two views | — |
| D18 | Rate limits | [#1435](https://github.com/classroomio/classroomio/pull/1435) meters each grant through a hidden `organization_api_key` row, so the existing per-key limiter (100/min) applies. No Zapier-specific limiter in v1 | Consistent with every other OAuth client | — |

---

## 4. Architecture

```text
                       ┌─────────────────────────── zapier.com ───────────────────────────┐
                       │  Zap editor ── ClassroomIO app (apps/zapier, zapier-platform v19) │
                       └───┬───────────────┬────────────────────┬────────────────────┬────┘
     (1) connect popup     │ (2) token     │ (3) actions/search  │ (4) subscribe       │ (5) signed POST
                           ▼               ▼                     ▼                     ▲   to hooks.zapier.com
  app.classroomio.com  (issuer: …/api/auth)          api.classroomio.com/public-api/v1 │
  ┌──────────────────────────────────────┐          ┌──────────────────────────────────┴─────────────┐
  │ /api/auth/oauth2/authorize | token    │  JWKS    │ automationKeyOrOAuthMiddleware (#1435)          │
  │ /oauth/select-organization  (#1435)   │─────────▶│   JWT → org_id, scopes → hidden grant key       │
  │ /oauth/consent              (#1435)   │          │ publicApiScopesMiddleware → per-key limiter     │
  │ /org/:slug/automation/zapier (new tab)│─session─▶│ /me  /webhooks/subscriptions  /webhooks/samples │
  └──────────────────────────────────────┘          │ /courses/:id/enrollments  audience, courses…    │
                                                     └───────────────┬────────────────────────────────┘
                                                                     │ services emit events
                                                                     ▼
                              packages/core webhook emit → webhook_event + webhook_delivery
                              → BullMQ `webhooks` → apps/jobs worker → managed endpoint (Zapier)
```

### 4.1 Connect (all of it is [#1435](https://github.com/classroomio/classroomio/pull/1435) except the client registration and the deltas in D4)

1. User clicks Connect in Zapier. Zapier opens `https://app.classroomio.com/api/auth/oauth2/authorize?response_type=code&client_id=…&redirect_uri=…&scope=<ZAPIER_OAUTH_SCOPES>&state=…&code_challenge=…&code_challenge_method=S256&resource=https://api.classroomio.com/public-api/v1`.
2. Not signed in → `/login` (email, Google and SSO all return to the flow, per [#1435](https://github.com/classroomio/classroomio/pull/1435)).
3. `/oauth/select-organization`: admin orgs only; for the public-API resource, orgs whose plan fails `canUsePublicApi` show disabled with "Upgrade to Early Adopter" (D4a).
4. `/oauth/consent`: client name, Verified badge for trusted clients (D4b), scope summary, redirect host. Allow → code → Zapier.
5. Zapier exchanges the code at `…/oauth2/token` (client secret + PKCE verifier + `resource`), gets a 10-minute JWT and a refresh token.
6. Zapier's test call `GET /public-api/v1/me` returns the org name for the connection label.

### 4.2 Trigger

Zap on → `performSubscribe` → `POST /public-api/v1/webhooks/subscriptions {targetUrl, eventType, courseId?, cohortId?}` → managed `webhook_endpoint` (+ one `webhook_subscription`) bound to the grant's `oauth_consent_id`. An event fires → existing emit/deliver pipeline → signed POST to `targetUrl` → Zapier `perform` verifies the signature, filters, returns `[record]`. Zap off → `DELETE /public-api/v1/webhooks/subscriptions/:id`. Connection revoked or admin demoted → [#1435](https://github.com/classroomio/classroomio/pull/1435) deletes the consent → `ON DELETE CASCADE` removes the managed endpoints.

### 4.3 Action

Zapier calls the public API with `Authorization: Bearer <JWT>`. [#1435](https://github.com/classroomio/classroomio/pull/1435)'s `automationKeyOrOAuthMiddleware` verifies it, checks admin, consent and plan, and sets `automationKey` to the grant's hidden key with the token's scopes. `publicApiScopesMiddleware` and the per-key limiter apply. The route, service and query layers run unchanged.

---

## 5. OAuth: building on the authorization server in [#1435](https://github.com/classroomio/classroomio/pull/1435)

What [#1435](https://github.com/classroomio/classroomio/pull/1435) already provides (do not rebuild): Better Auth 1.7.13 with `@better-auth/oauth-provider` (`packages/db/src/auth/oauth/oauth-plugins.ts`); issuer `${APP_ORIGIN}/api/auth`; resources `PUBLIC_API_RESOURCE` and `MCP_RESOURCE` (`packages/db/src/constants.ts`); PKCE S256; JWT access tokens (10 min) with an `org_id` claim from the selected workspace; rotating refresh tokens with replay detection; scopes = automation-key vocabulary minus `public_api:*` (`oauth-scopes.ts`); `verifyOAuthAccessToken` (`verify-access-token.ts`); per-request admin, consent and plan checks (`apps/api/src/services/oauth/oauth.ts`); a hidden `organization_api_key` row per grant for metering (`getOrCreateOAuthGrantKey`); `/oauth/select-organization` and `/oauth/consent` pages; Connected apps list and revoke (`/organization/automation/connected-apps`); discovery under `/.well-known/`.

What this plan adds for Zapier:

| Area | Change | Part II |
| --- | --- | --- |
| Client registration | One-off script registers Zapier as a confidential client (`client_secret_post`, PKCE, Zapier's redirect URI, `ZAPIER_OAUTH_SCOPES`). Its id goes into `OAUTH_TRUSTED_CLIENT_IDS` and `ZAPIER_OAUTH_CLIENT_ID` | R3.2 |
| Trusted clients | `cachedTrustedClients` = `OAUTH_TRUSTED_CLIENT_IDS`, so the record can't be edited through Better Auth's CRUD endpoints, and the dashboard can show a Verified badge | R3.1, R10.8 |
| Refresh tokens | `refreshTokenReuseInterval: 60`; refresh lifetime 90 days (per resource if Better Auth supports it, else global; spike item) | R3.1 |
| Scopes | `webhook:subscription:read` / `:write` added to the vocabulary, mapped in `getPublicApiRouteScope`, grouped on the consent screen | R2.1, R7.2, R10.8 |
| Workspace picker | `GET /oauth/organizations?resource=` returns `eligible` and `reason`; the page disables ineligible orgs | R6.6, R8.5, R10.8 |
| Client identity on requests | `oauthTokenMiddleware` also sets `oauthClientId`, used for `/me` and webhook `source.oauthClientId` | R7.1 |
| Connected apps | `listOAuthConnectedAppsService` adds `kind`; revoke refreshes the webhook endpoint cache | R6.6 |

Dependencies on [#1435](https://github.com/classroomio/classroomio/pull/1435)'s review: Greptile flagged plan bypass, removed tokens regaining access, cross-resource tokens, course-import failures and SSO continuation. Later commits on that branch (`fix(auth): address review findings…`, `…report plan restrictions on OAuth requests as 403`, `…harden token handling`) address them; confirm every thread is resolved before PR 1 depends on it.

Environment:

| Var | Where | Purpose |
| --- | --- | --- |
| `OAUTH_TRUSTED_CLIENT_IDS` | `packages/db` (process env, like `constants.ts` does today) | Comma-separated client ids treated as trusted |
| `ZAPIER_OAUTH_CLIENT_ID` | `packages/core/src/config/env.ts` | Identifies Zapier's grants for the Zapier tab, `/me` and host allowlist |
| `ZAPIER_OAUTH_REDIRECT_URIS` | registration script input only | Zapier's redirect URI(s), copied from the Zapier developer platform |

---

## 6. Data model

One migration, in PR 1: `00NN_webhook_subscriptions.sql` (expected `0043`, after [#1435](https://github.com/classroomio/classroomio/pull/1435)'s `0042_oauth_provider`). SQL and schema in R1.

| Table | Change |
| --- | --- |
| `webhook_endpoint` | `oauth_consent_id uuid null → oauth_consent(id) on delete cascade` (null = customer endpoint); `filter_course_id uuid null`; `filter_cohort_id uuid null`; index on `oauth_consent_id`; partial unique index `(oauth_consent_id, payload_url) where oauth_consent_id is not null` (idempotent subscribe) |
| `webhook_event` | index `(organization_id, event_type, created_at desc)` for samples |

No new tables. Grants, tokens and consents live in [#1435](https://github.com/classroomio/classroomio/pull/1435)'s tables.

---

## 7. Public API changes

| Method | Path | Status | Scope | Contract (R2, R8) |
| --- | --- | --- | --- | --- |
| GET | `/me` | new | any authenticated principal | `{ organization, connection: {kind, id, clientId, scopes}, actor }`; Zapier test call and connection label |
| GET | `/audience?email=` | extend | `audience:read` | exact, case-insensitive match on profile or member email |
| GET | `/courses?slug=&title=` | extend | `course:read` | exact slug; exact case-insensitive title |
| GET | `/courses/:courseId/members?email=` | extend | `course:member:read` | exact email |
| POST | `/courses/:courseId/enrollments` | new | `course:member:write` | `{email, sendEmail}` → `{status: enrolled \| already_enrolled \| invited \| already_invited, memberId, inviteId, email}`; idempotent |
| POST | `/webhooks/subscriptions` | new | `webhook:subscription:write` | OAuth only. `{targetUrl, eventType, courseId?, cohortId?}` → 201 `{id, eventType, targetUrl, courseId, cohortId, secret, createdAt}`; same target URL → 200 with the existing subscription |
| DELETE | `/webhooks/subscriptions/:subscriptionId` | new | `webhook:subscription:write` | only the caller's grant; 404 otherwise |
| GET | `/webhooks/samples?eventType=&courseId=&cohortId=` | new | `webhook:subscription:read` | up to 3 latest real envelopes, else the static example; same shape as a delivery |

Webhook payloads: `source` on `course.member.added` gains `oauthClientId: string | null` (additive; dated changelog entry in `developers/webhooks.mdx`) so Zap authors can skip events their own actions caused.

OpenAPI: new tags `Connection` and `Webhook Subscriptions` in a new `Automation` docs section; enrollments under `Course Members` (R9). Regenerate with `pnpm --filter @cio/api upload:openapi` after merge, and put the sidebar tree in the PR description.

---

## 8. Webhook platform changes (managed subscriptions)

| Change | Where | Part II |
| --- | --- | --- |
| Create or reuse a managed subscription under the plan cap, with an org row lock | `queries/webhook/subscriptions.ts` | R4.1 |
| Delete by (consent, id); list per org; count per org | same | R4.1 |
| Customer queries ignore managed rows: list, get, count, update, delete | `queries/webhook/webhook.ts` | R4.2 |
| Fan-out honors course and cohort filters | `listActiveEndpointsForEvent` + `emit.ts` | R4.2, R5.1 |
| HTTP 410 from a managed endpoint deletes it (Zapier already unsubscribed) | `deliver.ts` | R5.2 |
| No admin health emails for managed endpoints; health shows on the Zapier tab | `health.ts` | R5.3 |
| Samples: latest events of a type, else static examples | `queries/webhook/subscriptions.ts`, `constants/webhook-examples.ts` | R4.1, R2.4 |
| Target host must be in the client's allowlist (`hooks.zapier.com` for Zapier) and pass the SSRF guard | subscriptions service | R6.3 |

Known platform limits Zapier inherits (not changed here, §15): emits go through an in-process queue (`packages/core/src/services/webhook/emit.ts`, `MAX_CONCURRENT_EMITS`), and HTTP retries are 3 attempts over about 70 s (`WEBHOOK_RETRY_DELAYS_MS`).

---

## 9. Dashboard

### 9.1 IA: one tab

Everything lives in `routes/(app)/org/[slug]/automation/zapier/+page.svelte` under the shared `UnderlineTabs` (`automation/+layout.svelte`, `max-w-4xl`). Query-string state only: `q` (catalog search), `category`, `app` (opens the app sheet). Add the "Read docs" `Page.Action` the other tabs have.

### 9.2 States

| State | Condition | Renders |
| --- | --- | --- |
| Loading | first fetch pending | `Skeleton` blocks at final size |
| Not admin | `!$isOrgAdmin` | `Alert.Callout` (`automation.permissions.*`); catalog visible, CTAs disabled |
| Self-hosted | `PUBLIC_IS_SELFHOSTED === 'true'` | Callout: Zapier is on ClassroomIO Cloud; link to Webhooks ("Webhooks by Zapier" works with a webhook URL) |
| Not available yet | `PUBLIC_ZAPIER_CONNECT_URL` unset | Existing coming-soon callout (lets PR 2 merge before production setup) |
| Not entitled | `!$hasPublicApiAccess` | `UpgradeBanner` (`upgrade.zapier_required`); no connect links; catalog visible; if Zapier connections exist, a "paused by plan" callout |
| Not connected | entitled, no Zapier connection | `Empty variant="page"` with **Connect on Zapier** (primary, new tab) and **Browse apps** (scrolls to catalog); setup steps; catalog |
| Connected | ≥1 Zapier connection | Status callout; **Create a Zap** and **Manage on Zapier**; connections table; trigger usage vs cap; catalog |

Connections table (one row per Zapier consent): authorized by, permission areas, active triggers, last used, connected date. Row menu: **View triggers** (sheet), **Remove access** (dialog). Triggers sheet: trigger name, course or cohort filter, health, last delivery, created. Catalog: live search, category chips with real counts, 8 cards then "Show all", closing note about 6,000+ apps; a card opens the "ClassroomIO + {App}" sheet with the app's example automations, ClassroomIO triggers and actions, and the CTA.

### 9.3 [#1435](https://github.com/classroomio/classroomio/pull/1435) screens

- `/oauth/select-organization`: show ineligible orgs disabled with a reason (`plan`), and don't auto-select a single ineligible org (R10.8).
- `/oauth/consent`: Verified badge when the client is trusted (R10.8); add a `webhooks` scope group so `webhook:subscription:*` reads as "Receive events when things happen in your workspace".
- MCP tab: list only `kind === 'app'` connections (R10.9).

### 9.4 Env

`PUBLIC_ZAPIER_CONNECT_URL` (invite URL now, listing URL later), `PUBLIC_ZAPIER_LISTING` (`private` | `public`), `PUBLIC_ZAPIER_APP_KEY` (pre-filled Zaps after listing). Each is optional, so the dashboard reads them through `$env/dynamic/public`. Add them to `apps/dashboard/.env.example`.

---

## 10. Zapier app (`apps/zapier`)

### 10.1 Package and build

- `@cio/zapier`, private, not part of Docker images. `zapier-platform-core` and `zapier-platform-cli` pinned to the same 19.x release that is older than the pnpm cooldown (`pnpm-workspace.yaml`, `minimumReleaseAge: 1440`). v19 ships the `zapier-platform` binary only.
- esbuild bundles `src/index.ts` → `dist/index.js` (CJS, `platform: 'node'`, external `zapier-platform-core`), like `packages/mcp/scripts/build.mjs`. `@cio/utils` is a devDependency and is bundled, so Zapier's build never sees `workspace:*`.
- Two Zapier integrations: **ClassroomIO (Staging)** and **ClassroomIO**, selected by `ZAPIER_APP_ENV` through `.zapierapprc.staging` / `.zapierapprc`. Each has its own registered OAuth client on the matching API, and Zapier env vars `CLIENT_ID`, `CLIENT_SECRET`, `CIO_APP_ORIGIN`, `CIO_API_ORIGIN`.

### 10.2 Authentication

OAuth2 with `enablePkce`, `autoRefresh`, `resource` sent on authorize, token and refresh, scope `ZAPIER_OAUTH_SCOPES`, test `GET /public-api/v1/me`, label = org name (R11.4).

### 10.3 Error mapping

401 → `RefreshAuthError`; 403 `UPGRADE_REQUIRED` → plan message; 403 other → `Forbidden`; 404 → `NotFound` (unsubscribe treats as done); 400 → message with field; 429 → `ThrottledError(retryAfter)`; 5xx → generic with request id (R11.5).

### 10.4 Trigger factory

`createEventTrigger(definition)` builds every REST Hook trigger: subscribe, unsubscribe, `perform` (verify Standard Webhooks signature with `bundle.subscribeData.secret` and `bundle.rawRequest`, drop other event types, apply client-side filters, return `[flatten(envelope)]`), `performList` (samples endpoint), static `sample` from `@cio/utils` (R11.6).

### 10.5 Triggers

| Key | Label | Event | Filters |
| --- | --- | --- | --- |
| `new_course_enrollment` | New Course Enrollment | `course.member.added` | Course (server); Source |
| `course_member_removed` | Student Removed from Course | `course.member.removed` | Course |
| `course_completed` | Course Completed | `course.completed` | Course |
| `new_certificate` | New Certificate | `course.certificate.issued` | Course; adds a `file` |
| `new_submission` | New Exercise Submission | `course.submission.created` | Course |
| `submission_status_changed` | Submission Status Changed | `course.submission.status_changed` | Course |
| `lesson_completed` | Lesson Completed | `lesson.completion.updated` (only `isComplete`) | Course |
| `course_invite_accepted` | Course Invite Accepted | `course.invite.accepted` | Course |
| `new_payment_request` | New Payment Request | `course.payment_request.created` | Course |
| `new_organization_member` | New Organization Member | `organization.member.added` | Role |
| `compliance_status_changed` | Compliance Status Changed | `compliance.record.status_changed` | Course |
| `course_published` | Course Published | `course.published` | — |
| `live_session_scheduled` | Live Session Scheduled | `lesson.session.scheduled` | Course |
| `new_cohort_member` | New Cohort Member | `cohort.member.added` | Cohort (server) |

### 10.6 Actions

| Key | Label | Calls |
| --- | --- | --- |
| `enroll_student` | Enroll Student in Course | `POST /courses/:courseId/enrollments` |
| `add_student` | Add Student to Organization | `POST /audience` |
| `update_student` | Update Student | `GET /audience?email=` → `PUT /audience/:memberId` |
| `remove_student` | Remove Student from Organization | `GET /audience?email=` → `DELETE /audience/:memberId` |
| `remove_course_member` | Remove Student from Course | `GET /courses/:id/members?email=` → `DELETE …/members/:memberId` |
| `send_course_invite` | Send Course Invite | `POST /courses/:id/invites` |
| `revoke_course_invite` | Revoke Course Invite | `POST /courses/:id/invites/:inviteId/revoke` |
| `reset_course_progress` | Reset Student Course Progress | members by email → `POST …/reset-progress` |
| `mark_lesson_complete` | Mark Lesson Complete | members by email → `PUT …/members/:memberId/lessons/:lessonId/completion` |
| `add_cohort_member` | Add Student to Cohort | `POST /cohorts/:id/members` |
| `post_cohort_announcement` | Post to Cohort Feed | `POST /cohorts/:id/newsfeed` |

Deferred: Tag Student (no member tags), Clone Course (would need `course:write`, which also edits course content), Grade Submission (per-question payload).

### 10.7 Searches and dropdowns

`find_student` (`GET /audience?email=`, paired with `add_student` in `searchOrCreates`), `find_course` (`?slug=` or `?title=`). Hidden dropdown triggers: courses (paginated), cohorts, lessons (course-dependent), course invites. Status-based filtering (submission or compliance status) is left to Zapier's built-in Filter step, because those status values are labels, not a stable enum in the webhook contract.

### 10.8 Certificate file

`new_certificate` adds `file: z.dehydrateFile(hydrators.certificateFile, {courseId, memberId})`; the hydrator downloads `GET /courses/:courseId/certificates/:memberId/download` with the connection's token and stashes it. Verify in PR 3 that the event's `memberId` is the id the download route expects (`routes/v1/courses/certificates.ts`).

### 10.9 After public listing

Pre-filled Zaps (`https://api.zapier.com/v1/embed/{app}/create?steps[0][app]=…`) in the app sheet; Zapier's Workflow API or Workflow Element to list real Zaps (both need a public integration).

---

## 11. Delivery plan (PRs)

Each PR targets `main`, is self-contained and carries at most one migration.

### Prerequisite: [#1435](https://github.com/classroomio/classroomio/pull/1435) merged

### PR 0: `docs(zapier): consolidate the PRD and add the implementation plan`

- One `prd/zapier/README.md` from [#1441](https://github.com/classroomio/classroomio/pull/1441), [#1452](https://github.com/classroomio/classroomio/pull/1452), [#1455](https://github.com/classroomio/classroomio/pull/1455), [#1456](https://github.com/classroomio/classroomio/pull/1456) and §2-§3; link this plan; close the superseded doc PRs with a pointer.
- `PRD-TRACKER.md`: `prd/webhooks` → done; `prd/zapier` → in progress.
- Prototype README: mark out-of-date sections (consent and connected pages, `ZAPIER_AUTOMATION_LIMITS_BY_PLAN`).

### PR 1: `feat(api): add webhook subscriptions and Zapier connection support`

Scope: R1, R2, R3, R4, R5, R6, R7, R8, R9, R13 (API), developer docs (§14.2).

Acceptance:

- Registering the Zapier client and running the local flow (§12.4) yields a token that calls `/me`, the new filters, the enrollment endpoint, and the subscription endpoints.
- A subscription for `course.member.added` on Skillshare Test receives a signed delivery seconds after an enrollment; a course filter excludes other courses; a 410 deletes the subscription; removing the connection deletes its subscriptions.
- Managed endpoints never appear in `GET /organization/webhooks` and never count toward 20.
- API keys get `403 OAUTH_CONNECTION_REQUIRED` on subscription routes; `zapier` keys can't be created; existing keys behave as before.
- Basic org: OAuth calls return `403 UPGRADE_REQUIRED`; the workspace picker marks it ineligible.
- Reachability test passes (§12.1).

### PR 2: `feat(dashboard): add the Zapier tab`

Scope: R10, help articles (R14, §14.1) with framed screenshots.

Acceptance: every state in §9.2 renders for the seeded orgs (§12.5); revoke updates the table without reload; catalog state survives reload; MCP tab no longer lists Zapier; workspace picker and consent deltas work; `svelte-check` shows no new errors; `pnpm translate` ran and placeholders were checked.

### PR 3: `feat(zapier): add the ClassroomIO Zapier app`

Scope: R11, R12, staging integration pushed, one successful live run per trigger, action and search on staging.

Acceptance: CI green; `zapier-platform validate` clean; the PRD's canonical Zaps run on staging (HubSpot deal → Enroll Student; New Certificate → Google Drive with the PDF; New Exercise Submission → Slack).

### PR 4 (after private validation): `feat(website): add Zapier to the automation pages`

`apps/website/src/routes/automation/+page.svelte` and `automation-band.svelte` (used by the home page); `automate-section.svelte` is exported but unused.

---

## 12. Testing strategy

### 12.1 Unit (vitest, mocked queries, style of `apps/api/src/__tests__/webhook-service.test.ts`)

- Subscriptions service: OAuth-only, host allowlist, SSRF rejection, cap reached, idempotent re-subscribe, delete only own, cache refresh.
- Samples: latest events, static fallback, course filter.
- `/me` for both principal kinds.
- Enrollment: each of the four statuses, staff email, unknown course, idempotency.
- Filters: audience email, course slug/title, member email.
- Fan-out filters, 410 handling, health email suppression.
- Scope map: `/webhooks/*`, `/me`, `/courses/:id/enrollments`.
- **Reachability test** (R13.2): with a token carrying exactly `ZAPIER_OAUTH_SCOPES`, enumerate every v1 route and assert which are allowed; a new route can't silently widen Zapier's access.
- Dashboard utils: catalog filter and counts, link builder, connection mapping.

### 12.2 DB integration (scratch database)

Concurrent subscribes under the cap never exceed it; concurrent subscribes with the same target URL create one row; deleting a consent cascades to its endpoints and their deliveries.

### 12.3 Contract and security

OpenAPI tags and schemas for every new route; webhook examples and Zapier samples parse against `events.ts` schemas; org isolation (a grant can't delete another org's subscription); actor is never caller-supplied; `/security-review` on PR 1.

### 12.4 Local OAuth flow (no Zapier)

1. Register a dev client with the R3.2 script and `ZAPIER_OAUTH_REDIRECT_URIS=http://localhost:8799/callback`; put its id in `OAUTH_TRUSTED_CLIENT_IDS` and `ZAPIER_OAUTH_CLIENT_ID`; set `DASHBOARD_ORIGIN=http://localhost:5173` on the API.
2. Create a PKCE pair (`code_challenge = base64url(sha256(verifier))`).
3. Open `http://localhost:5173/api/auth/oauth2/authorize?response_type=code&client_id=…&redirect_uri=http://localhost:8799/callback&scope=<ZAPIER_OAUTH_SCOPES>&state=xyz&code_challenge=…&code_challenge_method=S256&resource=http://localhost:3002/public-api/v1`, sign in as `early-adopter@test.com`, pick Skillshare Test, allow.
4. Copy `code` from the failed redirect; `curl -X POST http://localhost:5173/api/auth/oauth2/token -d grant_type=authorization_code -d code=… -d redirect_uri=… -d client_id=… -d client_secret=… -d code_verifier=… -d resource=http://localhost:3002/public-api/v1`.
5. `curl -H "Authorization: Bearer <access_token>" http://localhost:3002/public-api/v1/me`.
6. Subscriptions need an allowed HTTPS host; locally add a tunnel host to the client's hook hosts for the test, or exercise the service with unit tests.

### 12.5 Manual QA matrix (seeded tenants)

| Org | Plan | Admin | Expect |
| --- | --- | --- | --- |
| Udemy Test | Basic (no plan row) | `admin@test.com` | Upgrade banner; picker shows the org disabled |
| Skillshare Test | Early Adopter | `early-adopter@test.com` | Full flow; trigger cap 50 |
| Coursera Test | Enterprise | `enterprise@test.com` | Full flow; trigger cap 250; SSO if configured |
| any | — | a student account | Picker empty state; tab shows the admin callout |

Also: self-hosted callout; downgrade Skillshare (`POST /organization/plan/cancel` with the server key) → calls 403, tab shows "paused", deliveries stop, upgrade resumes; demote the granting admin → connection disappears and its subscriptions are deleted; mobile width; dark mode.

### 12.6 With Zapier (staging)

Connect while logged out; label shows the org name; non-admin and Basic org; the canonical Zaps; Zap off deletes its subscription, on re-creates it; remove access in the dashboard → Zaps ask to reconnect; force token expiry → silent refresh; two Zaps running at once refresh without breaking the connection (D6); a receiver error → retries and health on the tab.

---

## 13. Rollout and operations

1. **Spike** (§16) before PR 1.
2. **Merge PR 1-2 dark.** Without a registered Zapier client nothing can connect; without `PUBLIC_ZAPIER_CONNECT_URL` the tab keeps the coming-soon callout.
3. **Staging**: create the staging Zapier integration; register its OAuth client on the staging API (R3.2); set Zapier env vars; push; run §12.6.
4. **Production**: check for live `zapier` keys (`SELECT count(*) FROM organization_api_key WHERE type = 'zapier' AND revoked_at IS NULL AND oauth_consent_id IS NULL`) and contact owners if any; register the production client; set `OAUTH_TRUSTED_CLIENT_IDS`, `ZAPIER_OAUTH_CLIENT_ID`; push `1.0.0`; keep internal test Zaps on (requirement 5.3); set `PUBLIC_ZAPIER_CONNECT_URL` to the invite link (it can't be revoked once accepted and Zapier shows no list of users; plan gating protects us regardless).
5. **Private validation** with about 5 paying orgs: Zapier's Monitoring tab, API logs, managed-endpoint health, PostHog events (`zapier_connect_clicked`, `zapier_connection_removed`, `zapier_trigger_subscribed`; helpers in `apps/api/src/services/product-events.ts` and the dashboard analytics wrapper).
6. **Public listing** ([publishing requirements](https://docs.zapier.com/platform/publish/integration-publishing-requirements)): HTTPS (4.2); no hard-coded credentials (4.3); every trigger, action and search with a kept successful run (5.3); production endpoints (5.4); label without secrets or app name (5.6); English (5.7); naming conventions (5.8); description "ClassroomIO is a …" (6.2); homepage = marketing site (6.3); a non-expiring test account for `integration-testing@zapier.com` on an **Early Adopter org** (7.1); an admin with a `classroomio.com` email (7.2). Requirement 1.4 bans payment processing; New Payment Request is a learner's form submission, so explain it or drop it if review objects.
7. After listing: `PUBLIC_ZAPIER_LISTING=public`, `PUBLIC_ZAPIER_APP_KEY`; pre-filled Zaps; consider the Workflow Element; PR 4.

---

## 14. Documentation

### 14.1 Help center (`apps/help`)

In `content/help/integrations-and-automation/`, registered in `apps/help/blume.config.ts`: `connect-classroomio-to-zapier.mdx`, `manage-zapier-connections.mdx`, `zapier-triggers-and-actions.mdx` (skeletons in R14). Update `understand-classroomio-integrations.mdx` and `create-and-manage-webhooks.mdx` (it says Zapier can provide a URL). Screenshots only per `skills/add-docs-image` (1350×830, scale 1, framed).

### 14.2 Developer docs (`apps/docs`)

- `developers/oauth.mdx` (from [#1435](https://github.com/classroomio/classroomio/pull/1435)): add `webhook:subscription:*` to the scope table; a "Receive events (REST hooks)" section for the subscription endpoints; note trusted clients.
- `developers/webhooks.mdx`: managed subscriptions; `source.oauthClientId` changelog entry.
- API reference placement per R9.

### 14.3 Repo docs

Consolidated `prd/zapier/README.md` (PR 0), `PRD-TRACKER.md`, and `README.md` / `ONBOARDING.md` Zapier mentions once shipped.

---

## 15. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Parallel Zapier refreshes trip refresh-token replay detection and kill the connection | `refreshTokenReuseInterval: 60` (D6); staging test with concurrent Zaps (§12.6) |
| Trigger-only Zaps rarely call the API, so refresh tokens idle out | 90-day refresh lifetime (D6); the certificate hydrator and dropdowns refresh in normal use |
| Events lost if the API process dies before recording (in-process emit queue) | Documented; durable outbox is a separate follow-up |
| Only 3 delivery attempts over about 70 s | Watch managed-endpoint failures during private validation; extend the schedule for managed endpoints if needed |
| Zap loops (an action causes an event that re-triggers the Zap) | `source.oauthClientId`; docs show the filter |
| Admin demoted or leaves → Zaps break | Expected ([#1435](https://github.com/classroomio/classroomio/pull/1435) deletes their grants); tab explains; docs recommend connecting with a long-lived admin |
| Plan and webhook entitlement drift | Both use `canUsePublicApi`; test asserts it |
| Zapier review rejects the listing | Keep test Zaps; schema-identical samples; English copy; drop New Payment Request if needed |
| Brand logo licensing | D15 |
| `zapier-platform push` from a pnpm workspace | Bundle everything except `zapier-platform-core`; spike item |
| [#1436](https://github.com/classroomio/classroomio/pull/1436) lands first and reshapes the MCP tab | Rebase R10.9 onto its Connections tab; same filter applies |

---

## 16. Spike: behaviors to verify first

Time-box to one or two days with a throwaway Zapier CLI app against staging or a tunnel. Record answers in the PR 1 description.

1. `enablePkce: true` in a CLI app: does Zapier add `code_challenge` to the authorize URL and `code_verifier` to the token request automatically?
2. Zapier's exact redirect URI for the integration (community reports `https://zapier.com/dashboard/auth/oauth/return/App<ID>CLIAPI/`).
3. Does Zapier persist a rotated `refresh_token` from the refresh response? (Required by [#1435](https://github.com/classroomio/classroomio/pull/1435)'s rotation.)
4. Better Auth 1.7: confirm `auth.api.adminCreateOAuthClient` (name, body, server-only call), `cachedTrustedClients`, `refreshTokenReuseInterval`, and whether refresh-token lifetime can be set per resource.
5. Does Better Auth require `resource` on the refresh request, or keep the original audience?
6. `bundle.rawRequest` in REST hook `perform` exposes headers and the raw body (types say yes), for signature checks.
7. Zapier answers `410` on a deleted hook URL.
8. `zapier-platform push` of a bundled `dist/index.js` from `apps/zapier` under pnpm.
9. The Node runtime of platform v19, to set the esbuild `target`.
10. Do pre-filled Zap links work for an invite-only app?

---

## 17. Appendix

### 17.1 Glossary

- **Connection / grant**: one `oauth_consent` row ([#1435](https://github.com/classroomio/classroomio/pull/1435)): one admin, one client, one organization.
- **Hidden grant key**: the `organization_api_key` row ([#1435](https://github.com/classroomio/classroomio/pull/1435)) that meters a grant; `oauth_consent_id` set, never listed.
- **Managed subscription**: a `webhook_endpoint` row with `oauth_consent_id`, created by a connected app for one trigger.
- **Entitled**: the active plan passes `canUsePublicApi`.

### 17.2 Out-of-scope findings (separate follow-ups)

1. API keys aren't re-checked against the plan per request; a downgrade leaves existing API keys working (`automation-usage.ts`).
2. Webhook emits aren't durable.
3. `prd/webhooks/README.md` describes the pre-ship design.
4. Automation nav `nestedRoutes` has no `webhooks` entry (`org-navigation.ts`).
5. `GET /audience` returns `createdAt` as `toDateString()`, not ISO (`queries/organization/audience.ts`).
6. The `(app)` client guard drops the return URL (`(app)/+layout.svelte`).
7. `course.member.added` declares sources `import`, `sso`, `payment`, `cohort` that nothing emits.

### 17.3 Roadmap after v1

Member tags → Tag Student; Grade Submission with an overall-score API; Clone Course with a narrower scope; Issue Certificate and Create Payment Request; `program_completed`; Make, n8n and Pipedream as registered clients; read-only connections once consent can narrow scopes; pre-filled Zaps and the Workflow Element after listing; durable webhook outbox.

### 17.4 References

- RFC 6749, RFC 7009, RFC 7636, RFC 8707 (resource indicators), RFC 9700 (OAuth security BCP).
- Better Auth `@better-auth/oauth-provider` 1.7.13 types ([dist](https://cdn.jsdelivr.net/npm/@better-auth/oauth-provider@1.7.13/dist/oauth-m0aNFIHP.d.mts)): `cachedTrustedClients`, `refreshTokenReuseInterval`, `refreshTokenExpiresIn`, `storeClientSecret`, `resources`, `postLogin`.
- Zapier: [OAuth v2](https://docs.zapier.com/platform/build/oauth), [schema (`autoRefresh`, `enablePkce`)](https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md), [REST hooks](https://docs.zapier.com/platform/build/cli-hook-trigger), [publishing requirements](https://docs.zapier.com/platform/publish/integration-publishing-requirements), [sharing](https://docs.zapier.com/integrations/manage/sharing.md), [platform news / v19](https://docs.zapier.com/platform/news), [pre-filled Zaps](https://docs.zapier.com/powered-by-zapier/embedding-zapier/pre-filled-zaps.md), [Workflow API](https://docs.zapier.com/partner-solutions/workflow-api/list-zaps), [Workflow Element](https://docs.zapier.com/powered-by-zapier/embedding-zapier/workflow-element), [core types](https://cdn.jsdelivr.net/npm/zapier-platform-core@19.3.0/types/custom.d.ts).

---

# Part II: Reference implementation

## R0. Conventions used in this code

- Code below is the proposed final shape. Paths are repo-relative. "Change" blocks show only the lines that differ; everything else in the file stays.
- Layering follows `CLAUDE.md`: Zod schemas in `@cio/utils`, SQL only in `@cio/db/queries`, business rules in services that throw `AppError`, routes that validate, call one service and return one shape.
- No comments except external constraints; JSDoc only where the signature doesn't state the contract (`skills/writing-code`).
- Names that [#1435](https://github.com/classroomio/classroomio/pull/1435) introduces (`automationKeyOrOAuthMiddleware`, `oauthTokenMiddleware`, `authenticateOAuthAccessTokenService`, `listOAuthConnectedApps`, `getOrCreateOAuthGrantKey`, `oauthConsent`, `PUBLIC_API_RESOURCE`) are used as they exist on `feat/better-auth-1-7`.
- Where this plan depends on a third-party API whose exact signature the spike (§16) must confirm, the code says so in the surrounding prose, never in a code comment.

---

## R1. Database

### R1.1 Migration `packages/db/src/migrations/0043_webhook_subscriptions.sql`

```sql
ALTER TABLE "webhook_endpoint" ADD COLUMN IF NOT EXISTS "oauth_consent_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN IF NOT EXISTS "filter_course_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN IF NOT EXISTS "filter_cohort_id" uuid;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_oauth_consent_id_oauth_consent_id_fk" FOREIGN KEY ("oauth_consent_id") REFERENCES "public"."oauth_consent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_endpoint_oauth_consent_id" ON "webhook_endpoint" USING btree ("oauth_consent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_webhook_endpoint_consent_target" ON "webhook_endpoint" USING btree ("oauth_consent_id","payload_url") WHERE "oauth_consent_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_event_org_type_created_at" ON "webhook_event" USING btree ("organization_id","event_type","created_at" DESC);
```

### R1.2 Journal entry (`packages/db/src/migrations/meta/_journal.json`)

```json
{
  "idx": 43,
  "version": "7",
  "when": 1793300000000,
  "tag": "0043_webhook_subscriptions",
  "breakpoints": true
}
```

Replace `when` with `Date.now()` at merge time and confirm it is greater than `main`'s maximum (CLAUDE.md "Database migrations"). Renumber if another branch took `0043`.

### R1.3 Schema (`packages/db/src/schema.ts`)

Change `webhookEndpoint` (after `oauthConsent`, which [#1435](https://github.com/classroomio/classroomio/pull/1435) defines earlier in the file):

```ts
export const webhookEndpoint = pgTable(
  'webhook_endpoint',
  {
    // …existing columns unchanged…
    oauthConsentId: uuid('oauth_consent_id').references(() => oauthConsent.id, { onDelete: 'cascade' }),
    filterCourseId: uuid('filter_course_id'),
    filterCohortId: uuid('filter_cohort_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    index('idx_webhook_endpoint_org_id').on(table.organizationId),
    index('idx_webhook_endpoint_oauth_consent_id').on(table.oauthConsentId),
    uniqueIndex('uq_webhook_endpoint_consent_target')
      .on(table.oauthConsentId, table.payloadUrl)
      .where(sql`${table.oauthConsentId} IS NOT NULL`)
  ]
);
```

Change `webhookEvent` indexes:

```ts
  (table) => [
    index('idx_webhook_event_created_at').on(table.createdAt),
    index('idx_webhook_event_org_created_at').on(table.organizationId, table.createdAt),
    index('idx_webhook_event_org_type_created_at').on(table.organizationId, table.eventType, table.createdAt.desc())
  ]
```

`packages/db/src/relations.ts`: add `oauthConsent: one(oauthConsent, { fields: [webhookEndpoint.oauthConsentId], references: [oauthConsent.id] })` to the `webhookEndpoint` relations and `webhookEndpoints: many(webhookEndpoint)` to `oauthConsent`.

---

## R2. Shared constants and validation (`@cio/utils`)

### R2.1 Scopes and key types (`packages/utils/src/validation/organization/automation-key.ts`)

Change:

```ts
export const ZOrganizationApiKeyType = z.enum(['mcp', 'api', 'zapier']);
export const ZCreatableOrganizationApiKeyType = ZOrganizationApiKeyType.exclude(['zapier']);

export const ZOrganizationApiKeyScope = z.enum([
  // …existing scopes unchanged…
  'organization:read',
  'organization:write',
  'webhook:subscription:read',
  'webhook:subscription:write',
  'public_api:*'
]);
```

and use `ZCreatableOrganizationApiKeyType` for `type` in `ZCreateOrganizationApiKey`. If [#1436](https://github.com/classroomio/classroomio/pull/1436) has landed, it already narrows key creation to `api`; keep its narrower set.

Because [#1435](https://github.com/classroomio/classroomio/pull/1435) derives `OAUTH_API_SCOPES` from this enum, the two new scopes become requestable through OAuth automatically.

### R2.2 Zapier catalog (`packages/utils/src/constants/zapier.ts`, new)

```ts
import type { TWebhookEventType } from './webhook';

export const ZAPIER_HOOK_HOSTS = ['hooks.zapier.com'] as const;

export const ZAPIER_OAUTH_SCOPES = [
  'offline_access',
  'audience:read',
  'audience:write',
  'course:read',
  'course:member:read',
  'course:member:write',
  'course:student:write',
  'course:certificate:read',
  'cohort:read',
  'cohort:write',
  'webhook:subscription:read',
  'webhook:subscription:write'
] as const;

export const ZAPIER_TRIGGER_FILTERS = ['course', 'cohort', 'source', 'role'] as const;
export type TZapierTriggerFilter = (typeof ZAPIER_TRIGGER_FILTERS)[number];

export type TZapierTrigger = {
  key: string;
  eventType: TWebhookEventType;
  noun: string;
  label: string;
  description: string;
  filters: readonly TZapierTriggerFilter[];
};

export const ZAPIER_TRIGGERS = [
  {
    key: 'new_course_enrollment',
    eventType: 'course.member.added',
    noun: 'Enrollment',
    label: 'New Course Enrollment',
    description: 'Triggers when a student is added to a course, however they joined.',
    filters: ['course', 'source']
  },
  {
    key: 'course_member_removed',
    eventType: 'course.member.removed',
    noun: 'Enrollment',
    label: 'Student Removed from Course',
    description: 'Triggers when a student is removed from a course.',
    filters: ['course']
  },
  {
    key: 'course_completed',
    eventType: 'course.completed',
    noun: 'Completion',
    label: 'Course Completed',
    description: 'Triggers when a student completes every required lesson in a course.',
    filters: ['course']
  },
  {
    key: 'new_certificate',
    eventType: 'course.certificate.issued',
    noun: 'Certificate',
    label: 'New Certificate',
    description: 'Triggers when a certificate is issued to a student.',
    filters: ['course']
  },
  {
    key: 'new_submission',
    eventType: 'course.submission.created',
    noun: 'Submission',
    label: 'New Exercise Submission',
    description: 'Triggers when a student submits an exercise.',
    filters: ['course']
  },
  {
    key: 'submission_status_changed',
    eventType: 'course.submission.status_changed',
    noun: 'Submission',
    label: 'Submission Status Changed',
    description: 'Triggers when a submission is graded or its status changes.',
    filters: ['course']
  },
  {
    key: 'lesson_completed',
    eventType: 'lesson.completion.updated',
    noun: 'Lesson Completion',
    label: 'Lesson Completed',
    description: 'Triggers when a student completes a lesson.',
    filters: ['course']
  },
  {
    key: 'course_invite_accepted',
    eventType: 'course.invite.accepted',
    noun: 'Invite',
    label: 'Course Invite Accepted',
    description: 'Triggers when someone accepts a course invite.',
    filters: ['course']
  },
  {
    key: 'new_payment_request',
    eventType: 'course.payment_request.created',
    noun: 'Payment Request',
    label: 'New Payment Request',
    description: 'Triggers when a learner submits a payment request for a course.',
    filters: ['course']
  },
  {
    key: 'new_organization_member',
    eventType: 'organization.member.added',
    noun: 'Member',
    label: 'New Organization Member',
    description: 'Triggers when someone joins the organization as a student, tutor or admin.',
    filters: ['role']
  },
  {
    key: 'compliance_status_changed',
    eventType: 'compliance.record.status_changed',
    noun: 'Compliance Record',
    label: 'Compliance Status Changed',
    description: "Triggers when a learner's compliance status changes, for example to overdue or expired.",
    filters: ['course']
  },
  {
    key: 'course_published',
    eventType: 'course.published',
    noun: 'Course',
    label: 'Course Published',
    description: 'Triggers when a course is published.',
    filters: []
  },
  {
    key: 'live_session_scheduled',
    eventType: 'lesson.session.scheduled',
    noun: 'Live Session',
    label: 'Live Session Scheduled',
    description: 'Triggers when a live session is scheduled or rescheduled.',
    filters: ['course']
  },
  {
    key: 'new_cohort_member',
    eventType: 'cohort.member.added',
    noun: 'Cohort Member',
    label: 'New Cohort Member',
    description: 'Triggers when a student is added to a cohort.',
    filters: ['cohort']
  }
] as const satisfies readonly TZapierTrigger[];
export type TZapierTriggerKey = (typeof ZAPIER_TRIGGERS)[number]['key'];

export const ZAPIER_ACTIONS = [
  {
    key: 'enroll_student',
    noun: 'Enrollment',
    label: 'Enroll Student in Course',
    description: 'Enrolls a student in a course by email, inviting them first if they are new.'
  },
  {
    key: 'add_student',
    noun: 'Student',
    label: 'Add Student to Organization',
    description: 'Invites a student to your organization without enrolling them in a course.'
  },
  {
    key: 'update_student',
    noun: 'Student',
    label: 'Update Student',
    description: "Updates a student's name, or the email of an invite that hasn't been accepted."
  },
  {
    key: 'remove_student',
    noun: 'Student',
    label: 'Remove Student from Organization',
    description: 'Removes a student from your organization.'
  },
  {
    key: 'remove_course_member',
    noun: 'Enrollment',
    label: 'Remove Student from Course',
    description: 'Removes a student from one course and keeps them in your organization.'
  },
  {
    key: 'send_course_invite',
    noun: 'Invite',
    label: 'Send Course Invite',
    description: 'Emails an invite to join a course.'
  },
  {
    key: 'revoke_course_invite',
    noun: 'Invite',
    label: 'Revoke Course Invite',
    description: 'Cancels a pending course invite so its link stops working.'
  },
  {
    key: 'reset_course_progress',
    noun: 'Progress',
    label: 'Reset Student Course Progress',
    description: "Clears a student's progress in a course and keeps them enrolled."
  },
  {
    key: 'mark_lesson_complete',
    noun: 'Lesson Completion',
    label: 'Mark Lesson Complete',
    description: 'Marks a lesson complete for a student.'
  },
  {
    key: 'add_cohort_member',
    noun: 'Cohort Member',
    label: 'Add Student to Cohort',
    description: 'Adds a student to a cohort.'
  },
  {
    key: 'post_cohort_announcement',
    noun: 'Announcement',
    label: 'Post to Cohort Feed',
    description: "Posts an announcement to a cohort's feed."
  }
] as const;
export type TZapierActionKey = (typeof ZAPIER_ACTIONS)[number]['key'];

export const ZAPIER_SEARCHES = [
  { key: 'find_student', noun: 'Student', label: 'Find Student', description: 'Finds a student in your organization by email.' },
  { key: 'find_course', noun: 'Course', label: 'Find Course', description: 'Finds a course by its slug or exact title.' }
] as const;
export type TZapierSearchKey = (typeof ZAPIER_SEARCHES)[number]['key'];
```

### R2.3 Subscription limits (`packages/utils/src/plans/webhook-subscriptions.ts`, new; export from `plans/index.ts`)

```ts
import { PLAN } from './constants';

const WEBHOOK_SUBSCRIPTION_LIMITS_BY_PLAN: Record<string, number> = {
  [PLAN.BASIC]: 0,
  [PLAN.EARLY_ADOPTER]: 50,
  [PLAN.ENTERPRISE]: 250
};

/**
 * Most webhook subscriptions that connected apps may hold for one organization on `planName`.
 */
export function getWebhookSubscriptionLimit(planName: string | null | undefined): number {
  if (!planName) return 0;

  return WEBHOOK_SUBSCRIPTION_LIMITS_BY_PLAN[planName] ?? 0;
}
```

### R2.4 Event examples (`packages/utils/src/validation/webhook/examples.ts`, new; export from `validation/webhook/index.ts`)

One `data` example per event type becomes the single source for the docs, the samples endpoint and the Zapier app's static `sample`. Move each JSON block from `apps/docs/content/docs/developers/webhooks.mdx` into this map (one entry shown; add `"oauthClientId": null` to every `source`), and extend the contract test (R13.4) so the docs and this map can't drift.

```ts
import { WEBHOOK_API_VERSION, type TWebhookEventType } from '../../constants/webhook';
import type { TWebhookEventData } from './events';

export type TWebhookExampleOrganization = { id: string; name: string | null; siteName: string | null };

export const WEBHOOK_EXAMPLE_CREATED_AT = '2026-10-01T09:00:00.000Z';

export const WEBHOOK_EVENT_DATA_EXAMPLES: { [TEvent in TWebhookEventType]: TWebhookEventData<TEvent> } = {
  'course.member.added': {
    courseId: '000000c1-0000-4000-8000-0000000000c1',
    memberId: '000000d1-0000-4000-8000-0000000000d1',
    profileId: '000000b1-0000-4000-8000-0000000000b1',
    email: 'student@example.com',
    roleId: 3,
    course: {
      id: '000000c1-0000-4000-8000-0000000000c1',
      title: 'Intro to Data Science',
      slug: 'intro-to-data-science',
      type: 'SELF_PACED',
      isPublished: true,
      cost: 0,
      currency: 'USD',
      tags: ['data']
    },
    student: {
      id: '000000b1-0000-4000-8000-0000000000b1',
      name: 'Alex Johnson',
      email: 'student@example.com',
      externalId: 'EMP-10482'
    },
    role: 'student',
    enrolledAt: '2026-10-01T09:00:00.000Z',
    source: {
      method: 'invite',
      inviteId: '000000e1-0000-4000-8000-0000000000e1',
      inviteLinkId: null,
      cohortId: null,
      programId: null,
      apiKeyId: null,
      oauthClientId: null
    },
    actorProfileId: null,
    actor: null,
    links: {
      dashboard: 'https://app.classroomio.com/courses/000000c1-0000-4000-8000-0000000000c1/people',
      student: 'https://acme.myclassroomio.com/courses/000000c1-0000-4000-8000-0000000000c1'
    }
  }
  // …one entry per remaining event type, copied from the docs reference…
};

/**
 * A complete envelope for `eventType` built from its example data, shaped exactly like a live delivery.
 */
export function buildWebhookExampleEnvelope<TEvent extends TWebhookEventType>(
  eventType: TEvent,
  organization: TWebhookExampleOrganization
) {
  return {
    id: `evt_example_${eventType.replaceAll('.', '_')}`,
    type: eventType,
    createdAt: WEBHOOK_EXAMPLE_CREATED_AT,
    apiVersion: WEBHOOK_API_VERSION,
    organization,
    data: WEBHOOK_EVENT_DATA_EXAMPLES[eventType]
  };
}
```

The `// …` line above is plan shorthand for the remaining 24 entries, not code to commit.

Change `packages/utils/src/validation/webhook/events.ts` so `source` carries the client:

```ts
    source: z.object({
      method: z.enum(WEBHOOK_MEMBER_SOURCE_METHODS),
      inviteId: z.string().nullable(),
      inviteLinkId: z.string().nullable(),
      cohortId: z.string().nullable(),
      programId: z.string().nullable(),
      apiKeyId: z.string().nullable(),
      oauthClientId: z.string().nullable()
    })
```

### R2.5 Public API schemas (`packages/utils/src/validation/public-api/`)

`me.ts` (new):

```ts
import * as z from 'zod';

export const ZPublicApiMeResponse = z.object({
  organization: z.object({
    id: z.uuid(),
    name: z.string(),
    siteName: z.string().nullable(),
    avatarUrl: z.string().nullable()
  }),
  connection: z.object({
    kind: z.enum(['api_key', 'oauth']).describe('oauth for an app connected through OAuth, api_key for an automation key'),
    id: z.uuid().describe('The OAuth grant id, or the automation key id'),
    clientId: z.string().nullable().describe('The OAuth client the token was issued to; null for automation keys'),
    scopes: z.array(z.string())
  }),
  actor: z.object({
    profileId: z.uuid().describe('The admin who connected the app, or who created the key'),
    fullname: z.string().nullable(),
    email: z.string().nullable()
  })
});
export type TPublicApiMeResponse = z.infer<typeof ZPublicApiMeResponse>;
```

`webhook-subscription.ts` (new):

```ts
import * as z from 'zod';

import { WEBHOOK_API_VERSION, WEBHOOK_EVENT_TYPES } from '../../constants/webhook';

const ZWebhookSubscriptionEventType = z.enum(WEBHOOK_EVENT_TYPES);

export const ZPublicApiCreateWebhookSubscription = z.object({
  targetUrl: z
    .url({ protocol: /^https$/ })
    .max(2048)
    .describe('HTTPS URL that receives the events. Only hosts registered for the connected app are accepted'),
  eventType: ZWebhookSubscriptionEventType.describe('The one event delivered to targetUrl'),
  courseId: z.uuid().optional().describe('Deliver only events for this course. Events without a course are not delivered'),
  cohortId: z.uuid().optional().describe('Deliver only events for this cohort. Events without a cohort are not delivered')
});
export type TPublicApiCreateWebhookSubscription = z.infer<typeof ZPublicApiCreateWebhookSubscription>;

export const ZPublicApiWebhookSubscriptionParam = z.object({
  subscriptionId: z.uuid()
});
export type TPublicApiWebhookSubscriptionParam = z.infer<typeof ZPublicApiWebhookSubscriptionParam>;

export const ZPublicApiWebhookSubscriptionResponse = z.object({
  id: z.uuid(),
  eventType: ZWebhookSubscriptionEventType,
  targetUrl: z.string(),
  courseId: z.uuid().nullable(),
  cohortId: z.uuid().nullable(),
  secret: z
    .string()
    .describe('Signing secret for the Standard Webhooks webhook-signature header. Store it with the subscription'),
  createdAt: z.string()
});

export const ZPublicApiDeleteWebhookSubscriptionResponse = z.object({ id: z.uuid() });

export const ZPublicApiWebhookSamplesQuery = z.object({
  eventType: ZWebhookSubscriptionEventType,
  courseId: z.uuid().optional().describe('Only events for this course'),
  cohortId: z.uuid().optional().describe('Only events for this cohort'),
  limit: z.coerce.number().int().min(1).max(3).default(3).describe('Events to return, 1-3. Default: 3.')
});
export type TPublicApiWebhookSamplesQuery = z.infer<typeof ZPublicApiWebhookSamplesQuery>;

export const ZPublicApiWebhookSampleResponse = z.object({
  id: z.string().describe('Event id, stable across delivery retries'),
  type: ZWebhookSubscriptionEventType,
  createdAt: z.string(),
  apiVersion: z.literal(WEBHOOK_API_VERSION),
  organization: z.object({ id: z.uuid(), name: z.string().nullable(), siteName: z.string().nullable() }),
  data: z.record(z.string(), z.unknown()).describe('The event data documented in the webhooks event reference')
});
```

`course-enrollment.ts` (new):

```ts
import * as z from 'zod';

export const ZPublicApiEnrollCourseStudent = z.object({
  email: z
    .email()
    .describe('The student to enroll. Someone not yet in your organization gets an invite and is enrolled when they accept'),
  sendEmail: z.boolean().default(true).describe('Email the invite or welcome message. Default: true.')
});
export type TPublicApiEnrollCourseStudent = z.infer<typeof ZPublicApiEnrollCourseStudent>;

export const ZPublicApiCourseEnrollmentStatus = z.enum(['enrolled', 'already_enrolled', 'invited', 'already_invited']);

export const ZPublicApiEnrollCourseStudentResponse = z.object({
  status: ZPublicApiCourseEnrollmentStatus.describe(
    'enrolled and invited describe what this call did; already_enrolled and already_invited mean nothing changed'
  ),
  memberId: z.uuid().nullable().describe('Course member id when the student is enrolled'),
  inviteId: z.uuid().nullable().describe('Pending course invite id when the student was invited'),
  email: z.string()
});
```

Filters. Change `audience.ts`:

```ts
export const ZPublicApiAudienceQuery = z.object({
  // …existing fields unchanged…
  email: z
    .email()
    .optional()
    .describe('Exact email, case-insensitive. Use it to look someone up; search matches parts of names and emails')
});
```

Change `course.ts` (define the public query independently instead of aliasing the dashboard schema, per `skills/public-api-review`):

```ts
export const ZPublicApiCoursesQuery = ZGetOrganizationCoursesQuery.extend({
  slug: z.string().trim().min(1).max(200).optional().describe('Exact course slug'),
  title: z.string().trim().min(1).max(200).optional().describe('Exact course title, case-insensitive')
});
```

Change `course-member.ts`:

```ts
export const ZPublicApiCourseMembersQuery = ZPublicApiPaginationQuery.extend({
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().min(1).optional(),
  email: z.email().optional().describe('Exact email, case-insensitive')
});
```

Export the three new files from `validation/public-api/index.ts`.

`packages/utils/src/validation/organization/oauth.ts` (from [#1435](https://github.com/classroomio/classroomio/pull/1435)), add:

```ts
export const ZListOAuthOrganizationsQuery = z.object({
  resource: z.url().optional()
});
export type TListOAuthOrganizationsQuery = z.infer<typeof ZListOAuthOrganizationsQuery>;
```

### R2.6 Error codes (`packages/utils/src/constants/error-codes.ts`)

```ts
  OAUTH_CONNECTION_REQUIRED: 'OAUTH_CONNECTION_REQUIRED',
  WEBHOOK_SUBSCRIPTION_NOT_FOUND: 'WEBHOOK_SUBSCRIPTION_NOT_FOUND',
  WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED: 'WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED',
  WEBHOOK_SUBSCRIPTION_CONFLICT: 'WEBHOOK_SUBSCRIPTION_CONFLICT',
  STAFF_CANNOT_ENROLL: 'STAFF_CANNOT_ENROLL',
```

---

## R3. OAuth server configuration (`@cio/db/auth`)

### R3.1 Plugin options

Change `packages/db/src/constants.ts`:

```ts
export const OAUTH_TRUSTED_CLIENT_IDS = (process.env.OAUTH_TRUSTED_CLIENT_IDS ?? '')
  .split(',')
  .map((clientId) => clientId.trim())
  .filter(Boolean);
```

Change `packages/db/src/auth/oauth/oauth-plugins.ts` ([#1435](https://github.com/classroomio/classroomio/pull/1435)):

```ts
import { MCP_RESOURCE, OAUTH_ISSUER, OAUTH_TRUSTED_CLIENT_IDS, PUBLIC_API_RESOURCE } from '@db/constants';

const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;
const REFRESH_TOKEN_REUSE_INTERVAL_SECONDS = 60;

export function buildOAuthPlugins(): BetterAuthPlugin[] {
  return [
    jwt({ jwt: { issuer: OAUTH_ISSUER } }),
    oauthProvider({
      // …existing options unchanged…
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
      // Zapier refreshes from parallel tasks; without a reuse window the losing refresh is treated as token theft.
      refreshTokenReuseInterval: REFRESH_TOKEN_REUSE_INTERVAL_SECONDS,
      cachedTrustedClients: new Set(OAUTH_TRUSTED_CLIENT_IDS)
    })
  ];
}
```

If the spike shows `resources` accepts a per-resource refresh lifetime, set 90 days on `PUBLIC_API_RESOURCE` only and leave the global default for MCP.

Export a helper next to it (`packages/db/src/auth/oauth/trusted-clients.ts`, re-exported from `@cio/db/auth`):

```ts
import { OAUTH_TRUSTED_CLIENT_IDS } from '@db/constants';

export function isTrustedOAuthClient(clientId: string): boolean {
  return OAUTH_TRUSTED_CLIENT_IDS.includes(clientId);
}
```

### R3.2 Client registration script (`packages/db/src/scripts/register-oauth-client.ts`, new)

Add `"oauth:register-client": "tsx src/scripts/register-oauth-client.ts"` to `packages/db/package.json`. Confirm `adminCreateOAuthClient`'s name and body in the spike (§16.4).

```ts
import 'dotenv/config';

import { ZAPIER_OAUTH_SCOPES } from '@cio/utils/constants/zapier';

import { auth } from '../auth';

const ZAPIER_LOGO_URI = 'https://cdn.zapier.com/zapier/images/logos/zapier-logomark.png';

function readRedirectUris(): string[] {
  const redirectUris = (process.env.ZAPIER_OAUTH_REDIRECT_URIS ?? '')
    .split(',')
    .map((uri) => uri.trim())
    .filter(Boolean);

  if (redirectUris.length === 0) {
    throw new Error('Set ZAPIER_OAUTH_REDIRECT_URIS to the redirect URI from the Zapier developer platform');
  }

  return redirectUris;
}

async function registerZapierClient() {
  const client = await auth.api.adminCreateOAuthClient({
    body: {
      client_name: 'Zapier',
      client_uri: 'https://zapier.com',
      logo_uri: ZAPIER_LOGO_URI,
      redirect_uris: readRedirectUris(),
      token_endpoint_auth_method: 'client_secret_post',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: ZAPIER_OAUTH_SCOPES.join(' ')
    }
  });

  console.log(`client_id=${client.client_id}`);
  console.log(`client_secret=${client.client_secret}`);
  console.log('Store both in the Zapier integration env (CLIENT_ID, CLIENT_SECRET). Add client_id to OAUTH_TRUSTED_CLIENT_IDS and ZAPIER_OAUTH_CLIENT_ID.');
}

await registerZapierClient();
process.exit(0);
```

Run once per environment: `ZAPIER_OAUTH_REDIRECT_URIS=<uri> pnpm --filter @cio/db oauth:register-client`. The secret is shown once.

---

## R4. Queries (`@cio/db/queries`)

### R4.1 Managed subscriptions (`packages/db/src/queries/webhook/subscriptions.ts`, new; export from `queries/webhook/index.ts`)

```ts
import * as schema from '@db/schema';

import { and, count, desc, eq, isNotNull, sql, type SQL } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewWebhookEndpoint } from '@db/types';

import { attachEventTypes, createWebhookEndpoint, type TWebhookEndpointWithEvents } from './webhook';

export type TManagedWebhookSubscriptionValues = Pick<
  TNewWebhookEndpoint,
  'organizationId' | 'name' | 'payloadUrl' | 'secretCiphertext' | 'secretLast4' | 'createdByProfileId'
> & {
  oauthConsentId: string;
  filterCourseId: string | null;
  filterCohortId: string | null;
};

export type TManagedWebhookSubscriptionResult = {
  subscription: TWebhookEndpointWithEvents;
  created: boolean;
};

export type TLatestWebhookEventsFilter = {
  courseId?: string;
  cohortId?: string;
  limit: number;
};

async function findManagedSubscriptionByTarget(
  oauthConsentId: string,
  payloadUrl: string,
  client: DbOrTxClient
): Promise<TWebhookEndpointWithEvents | null> {
  const [endpoint] = await client
    .select()
    .from(schema.webhookEndpoint)
    .where(
      and(eq(schema.webhookEndpoint.oauthConsentId, oauthConsentId), eq(schema.webhookEndpoint.payloadUrl, payloadUrl))
    )
    .limit(1);

  if (!endpoint) return null;

  const [withEvents] = await attachEventTypes([endpoint], client);

  return withEvents ?? null;
}

export async function countManagedWebhookSubscriptions(
  organizationId: string,
  client: DbOrTxClient = db
): Promise<number> {
  try {
    const [row] = await client
      .select({ total: count() })
      .from(schema.webhookEndpoint)
      .where(
        and(
          eq(schema.webhookEndpoint.organizationId, organizationId),
          isNotNull(schema.webhookEndpoint.oauthConsentId)
        )
      );

    return row?.total ?? 0;
  } catch (error) {
    console.error('countManagedWebhookSubscriptions error:', error);
    throw new Error('Failed to count webhook subscriptions');
  }
}

/**
 * Returns the connected app's subscription for `values.payloadUrl`, creating it for `eventType` while the
 * organization holds fewer than `maxSubscriptions`. Counts and inserts under a row lock on the organization.
 * Returns null at the cap.
 */
export async function upsertManagedWebhookSubscription(
  values: TManagedWebhookSubscriptionValues,
  eventType: string,
  maxSubscriptions: number
): Promise<TManagedWebhookSubscriptionResult | null> {
  try {
    return await db.transaction(async (tx) => {
      await tx
        .select({ id: schema.organization.id })
        .from(schema.organization)
        .where(eq(schema.organization.id, values.organizationId))
        .for('update');

      const existing = await findManagedSubscriptionByTarget(values.oauthConsentId, values.payloadUrl, tx);

      if (existing) return { subscription: existing, created: false };

      const total = await countManagedWebhookSubscriptions(values.organizationId, tx);

      if (total >= maxSubscriptions) return null;

      const subscription = await createWebhookEndpoint(
        {
          ...values,
          updatedByProfileId: values.createdByProfileId,
          eventMode: 'selected',
          verifySsl: true,
          isActive: true
        },
        [eventType],
        tx
      );

      return { subscription, created: true };
    });
  } catch (error) {
    console.error('upsertManagedWebhookSubscription error:', error);
    throw new Error('Failed to create webhook subscription');
  }
}

/**
 * Deletes one subscription owned by the grant. Returns false when the grant has no such subscription.
 */
export async function deleteManagedWebhookSubscription(oauthConsentId: string, subscriptionId: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(schema.webhookEndpoint)
      .where(
        and(eq(schema.webhookEndpoint.id, subscriptionId), eq(schema.webhookEndpoint.oauthConsentId, oauthConsentId))
      )
      .returning({ id: schema.webhookEndpoint.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('deleteManagedWebhookSubscription error:', error);
    throw new Error('Failed to delete webhook subscription');
  }
}

/**
 * Deletes a managed subscription by id regardless of grant, for the delivery worker. Customer endpoints are never matched.
 */
export async function deleteManagedWebhookSubscriptionById(subscriptionId: string): Promise<void> {
  try {
    await db
      .delete(schema.webhookEndpoint)
      .where(and(eq(schema.webhookEndpoint.id, subscriptionId), isNotNull(schema.webhookEndpoint.oauthConsentId)));
  } catch (error) {
    console.error('deleteManagedWebhookSubscriptionById error:', error);
    throw new Error('Failed to delete webhook subscription');
  }
}

export async function listManagedWebhookSubscriptions(organizationId: string): Promise<TWebhookEndpointWithEvents[]> {
  try {
    const endpoints = await db
      .select()
      .from(schema.webhookEndpoint)
      .where(
        and(
          eq(schema.webhookEndpoint.organizationId, organizationId),
          isNotNull(schema.webhookEndpoint.oauthConsentId)
        )
      )
      .orderBy(desc(schema.webhookEndpoint.createdAt));

    return attachEventTypes(endpoints, db);
  } catch (error) {
    console.error('listManagedWebhookSubscriptions error:', error);
    throw new Error('Failed to list webhook subscriptions');
  }
}

/**
 * The organization's most recent recorded envelopes of `eventType`, newest first.
 */
export async function listLatestWebhookEvents(
  organizationId: string,
  eventType: string,
  filter: TLatestWebhookEventsFilter
): Promise<Record<string, unknown>[]> {
  try {
    const conditions: SQL[] = [
      eq(schema.webhookEvent.organizationId, organizationId),
      eq(schema.webhookEvent.eventType, eventType)
    ];

    if (filter.courseId) {
      conditions.push(sql`${schema.webhookEvent.payload} -> 'data' ->> 'courseId' = ${filter.courseId}`);
    }

    if (filter.cohortId) {
      conditions.push(sql`${schema.webhookEvent.payload} -> 'data' ->> 'cohortId' = ${filter.cohortId}`);
    }

    const rows = await db
      .select({ payload: schema.webhookEvent.payload })
      .from(schema.webhookEvent)
      .where(and(...conditions))
      .orderBy(desc(schema.webhookEvent.createdAt))
      .limit(filter.limit);

    return rows.map((row) => row.payload);
  } catch (error) {
    console.error('listLatestWebhookEvents error:', error);
    throw new Error('Failed to list webhook events');
  }
}
```

### R4.2 Customer endpoint queries ignore managed rows (`packages/db/src/queries/webhook/webhook.ts`)

Change: export `attachEventTypes`, add a shared condition, and apply it to every customer-facing query.

```ts
import { and, count, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';

const isCustomerEndpoint = isNull(schema.webhookEndpoint.oauthConsentId);

export type TWebhookEventScope = {
  courseId?: string | null;
  cohortId?: string | null;
};

export async function attachEventTypes(
  // …unchanged body…
```

In `updateWebhookEndpoint`, `deleteWebhookEndpoint` and `getWebhookEndpoint`, change the `where` to:

```ts
      .where(
        and(
          eq(schema.webhookEndpoint.id, webhookId),
          eq(schema.webhookEndpoint.organizationId, organizationId),
          isCustomerEndpoint
        )
      )
```

`listWebhookEndpoints` and `countWebhookEndpoints`:

```ts
      .where(and(eq(schema.webhookEndpoint.organizationId, organizationId), isCustomerEndpoint))
```

`listActiveEndpointsForEvent` gains the event's scope:

```ts
export async function listActiveEndpointsForEvent(
  organizationId: string,
  eventType: string,
  scope: TWebhookEventScope = {},
  client: DbOrTxClient = db
): Promise<TWebhookEndpoint[]> {
  try {
    return await client
      .select()
      .from(schema.webhookEndpoint)
      .where(
        and(
          eq(schema.webhookEndpoint.organizationId, organizationId),
          eq(schema.webhookEndpoint.isActive, true),
          or(
            isNull(schema.webhookEndpoint.filterCourseId),
            scope.courseId ? eq(schema.webhookEndpoint.filterCourseId, scope.courseId) : sql`false`
          ),
          or(
            isNull(schema.webhookEndpoint.filterCohortId),
            scope.cohortId ? eq(schema.webhookEndpoint.filterCohortId, scope.cohortId) : sql`false`
          ),
          or(
            eq(schema.webhookEndpoint.eventMode, 'all'),
            sql`exists (
              select 1 from ${schema.webhookSubscription}
              where ${schema.webhookSubscription.webhookId} = ${schema.webhookEndpoint.id}
              and ${schema.webhookSubscription.eventType} = ${eventType}
            )`
          )
        )
      );
  } catch (error) {
    console.error('listActiveEndpointsForEvent error:', error);
    throw new Error('Failed to list webhook endpoints for event');
  }
}
```

`getWebhookEndpointById` (worker) and `orgHasActiveWebhookEndpoint` (cache) keep matching both kinds.

### R4.3 Exact-match filters

`packages/db/src/queries/organization/audience.ts`, inside the audience list query after the `search` block:

```ts
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();

    conditions.push(
      or(
        eq(sql`lower(${schema.profile.email})`, normalizedEmail),
        eq(sql`lower(${schema.organizationmember.email})`, normalizedEmail)
      )!
    );
  }
```

`packages/db/src/queries/course/course.ts`: add `slug?: string; title?: string` to `GetOrgCoursesOptions` and to the picked options of the condition builder, then:

```ts
  if (slug) {
    conditions.push(eq(schema.course.slug, slug));
  }

  if (title) {
    conditions.push(eq(sql`lower(${schema.course.title})`, title.trim().toLowerCase()));
  }
```

Pass `slug` and `title` through the v1 courses list service unchanged.

`packages/db/src/queries/course/people.ts`, `getPaginatedCourseMembers`, next to its `search` handling (destructure `email` from options):

```ts
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      conditions.push(
        or(
          eq(sql`lower(${schema.groupmember.email})`, normalizedEmail),
          eq(sql`lower(${schema.profile.email})`, normalizedEmail)
        )!
      );
    }
```

### R4.4 Enrollment lookups

`packages/db/src/queries/course/people.ts`, new:

```ts
/**
 * The course membership for `email`, matched on the member's own email or their profile's, or null.
 */
export async function getCourseMemberIdByEmail(courseId: string, email: string): Promise<string | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [row] = await db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.profile.id, schema.groupmember.profileId))
      .where(
        and(
          eq(schema.course.id, courseId),
          or(
            eq(sql`lower(${schema.groupmember.email})`, normalizedEmail),
            eq(sql`lower(${schema.profile.email})`, normalizedEmail)
          )
        )
      )
      .limit(1);

    return row?.id ?? null;
  } catch (error) {
    console.error('getCourseMemberIdByEmail error:', error);
    throw new Error('Failed to look up course member');
  }
}
```

`packages/db/src/queries/course/invite.ts`, new (add `desc`, `gt`, `lt` and `sql` to the file's `drizzle-orm` import if missing):

```ts
/**
 * The newest usable invite to `courseId` that names `email` among its allowed emails, or null.
 */
export async function findActiveCourseInviteIdForEmail(courseId: string, email: string): Promise<string | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const [row] = await db
      .select({ id: schema.courseInvite.id })
      .from(schema.courseInvite)
      .where(
        and(
          eq(schema.courseInvite.courseId, courseId),
          eq(schema.courseInvite.isRevoked, false),
          gt(schema.courseInvite.expiresAt, new Date().toISOString()),
          lt(schema.courseInvite.usedCount, schema.courseInvite.maxUses),
          sql`exists (select 1 from unnest(${schema.courseInvite.allowedEmails}) as allowed(email) where lower(allowed.email) = ${normalizedEmail})`
        )
      )
      .orderBy(desc(schema.courseInvite.createdAt))
      .limit(1);

    return row?.id ?? null;
  } catch (error) {
    console.error('findActiveCourseInviteIdForEmail error:', error);
    throw new Error('Failed to look up course invite');
  }
}
```

### R4.5 Course titles for the Zapier tab (`packages/db/src/queries/course/course.ts`, new)

```ts
export async function getCourseTitlesByIds(courseIds: string[]): Promise<Map<string, string | null>> {
  if (courseIds.length === 0) return new Map();

  try {
    const rows = await db
      .select({ id: schema.course.id, title: schema.course.title })
      .from(schema.course)
      .where(inArray(schema.course.id, courseIds));

    return new Map(rows.map((row) => [row.id, row.title]));
  } catch (error) {
    console.error('getCourseTitlesByIds error:', error);
    throw new Error('Failed to load course titles');
  }
}
```

---

## R5. Core webhook services (`@cio/core`)

### R5.1 Fan-out uses the event's course and cohort (`packages/core/src/services/webhook/emit.ts`)

```ts
import { listActiveEndpointsForEvent, type TWebhookEventScope } from '@cio/db/queries/webhook';

function readWebhookEventScope(data: Record<string, unknown>): TWebhookEventScope {
  const courseId = typeof data.courseId === 'string' ? data.courseId : null;
  const cohortId = typeof data.cohortId === 'string' ? data.cohortId : null;

  return { courseId, cohortId };
}
```

and in `recordWebhookEvent`:

```ts
    const scope = readWebhookEventScope(data as Record<string, unknown>);
    const endpoints = await listActiveEndpointsForEvent(organizationId, eventType, scope);
```

Change `buildMemberSource` to accept and return `oauthClientId` (default `null`) so every emitter keeps compiling and API-initiated enrollments can set it (R6.7).

### R5.2 A 410 from a managed endpoint ends the subscription (`packages/core/src/services/webhook/deliver.ts`)

```ts
import { deleteManagedWebhookSubscriptionById } from '@cio/db/queries/webhook';

import { refreshOrgHasWebhookEndpoints } from './endpoint-cache';

const HTTP_GONE = 410;

function isUnsubscribedByReceiver(endpoint: TWebhookEndpoint, result: TWebhookAttemptResult): boolean {
  return endpoint.oauthConsentId !== null && result.responseStatus === HTTP_GONE;
}
```

In `drainWebhookEndpoint`, right after `attemptWebhookDelivery`:

```ts
    const result = await attemptWebhookDelivery(endpoint, record.delivery, record.event);

    if (isUnsubscribedByReceiver(endpoint, result)) {
      await deleteManagedWebhookSubscriptionById(webhookId);
      await refreshOrgHasWebhookEndpoints(endpoint.organizationId);

      break;
    }

    const transition = await recordWebhookAttempt(record.delivery.id, webhookId, !record.delivery.isTest, result);
```

Deleting the endpoint cascades its deliveries, so nothing is left to retry.

### R5.3 No admin health emails for managed endpoints (`packages/core/src/services/webhook/health.ts`)

```ts
    const endpoint = await getWebhookEndpointById(webhookId);

    if (!endpoint || endpoint.oauthConsentId) return;
```

---

## R6. API services

### R6.1 Connected-app identity (`apps/api/src/services/oauth/clients.ts`, new)

Add `ZAPIER_OAUTH_CLIENT_ID: z.string().optional()` (with JSDoc) to `packages/core/src/config/env.ts` and document it in `apps/api/.env.example`.

```ts
import { env } from '@cio/core/config/env';
import { ZAPIER_HOOK_HOSTS } from '@cio/utils/constants/zapier';

export type TConnectedAppKind = 'zapier' | 'app';

export function getConnectedAppKind(clientId: string): TConnectedAppKind {
  return env.ZAPIER_OAUTH_CLIENT_ID !== undefined && clientId === env.ZAPIER_OAUTH_CLIENT_ID ? 'zapier' : 'app';
}

/**
 * Hosts a connected app may point webhook subscriptions at; empty when the client may not subscribe.
 */
export function getSubscriptionHostsForClient(clientId: string): readonly string[] {
  return getConnectedAppKind(clientId) === 'zapier' ? ZAPIER_HOOK_HOSTS : [];
}

export function getSubscriptionNamePrefix(clientId: string): string {
  return getConnectedAppKind(clientId) === 'zapier' ? 'Zapier' : 'Connected app';
}
```

### R6.2 The authenticated principal (`apps/api/src/utils/automation-principal.ts`, new)

```ts
import type { TOrganizationApiKey } from '@cio/db/types';

import { AppError, ErrorCodes } from '@api/utils/errors';

export type TAutomationPrincipal = {
  automationKey: TOrganizationApiKey;
  oauthClientId: string | null;
};

export type TOAuthGrantPrincipal = {
  oauthConsentId: string;
  clientId: string;
  keyId: string;
};

export function toAutomationPrincipal(
  automationKey: TOrganizationApiKey | undefined,
  oauthClientId: string | undefined
): TAutomationPrincipal {
  if (!automationKey) {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
  }

  return { automationKey, oauthClientId: oauthClientId ?? null };
}

/**
 * Narrows the principal to an OAuth grant. Throws 403 for automation keys.
 */
export function requireOAuthGrant(principal: TAutomationPrincipal): TOAuthGrantPrincipal {
  const { automationKey, oauthClientId } = principal;

  if (!automationKey.oauthConsentId || !oauthClientId) {
    throw new AppError(
      'Only apps connected through OAuth can manage webhook subscriptions',
      ErrorCodes.OAUTH_CONNECTION_REQUIRED,
      403
    );
  }

  return { oauthConsentId: automationKey.oauthConsentId, clientId: oauthClientId, keyId: automationKey.id };
}
```

### R6.3 Subscriptions (`apps/api/src/services/v1/webhooks/subscriptions.ts`, new)

```ts
import { refreshOrgHasWebhookEndpoints } from '@cio/core/services/webhook/endpoint-cache';
import { getWebhookUrlPolicy } from '@cio/core/services/webhook/policy';
import { decryptWebhookSecret, encryptWebhookSecret, generateWebhookSecret } from '@cio/core/services/webhook/secret';
import { assertWebhookUrlShape, resolveWebhookTarget, WebhookUrlError } from '@cio/core/services/webhook/url-guard';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import {
  deleteManagedWebhookSubscription,
  upsertManagedWebhookSubscription,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import { getWebhookSubscriptionLimit } from '@cio/utils/plans';
import type {
  TPublicApiCreateWebhookSubscription,
  TPublicApiWebhookSubscriptionParam
} from '@cio/utils/validation/public-api';

import {
  getConnectedAppKind,
  getSubscriptionHostsForClient,
  getSubscriptionNamePrefix
} from '@api/services/oauth/clients';
import { captureZapierTriggerSubscribed } from '@api/services/product-events';
import { assertWebhooksAllowed } from '@api/services/webhook/webhook';
import { requireOAuthGrant, type TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCourseBelongsToOrganization,
  assertOrgAdmin
} from '../shared';

const SUBSCRIPTION_NAME_MAX_LENGTH = 120;

async function assertTargetUrlAllowed(targetUrl: string, allowedHosts: readonly string[]): Promise<void> {
  const policy = getWebhookUrlPolicy();

  try {
    const parsed = assertWebhookUrlShape(targetUrl, policy);

    if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname)) {
      throw new AppError(
        'targetUrl must be an HTTPS URL on a host registered for this app',
        ErrorCodes.WEBHOOK_URL_INVALID,
        400,
        'targetUrl'
      );
    }

    await resolveWebhookTarget(parsed, policy);
  } catch (error) {
    if (error instanceof WebhookUrlError) {
      throw new AppError(error.message, ErrorCodes.WEBHOOK_URL_INVALID, 400, 'targetUrl');
    }

    throw error;
  }
}

async function getOrganizationSubscriptionLimit(organizationId: string): Promise<number> {
  const activePlan = await getActiveOrganizationPlan(organizationId);

  return getWebhookSubscriptionLimit(activePlan?.planName);
}

function readSubscriptionSecret(subscription: TWebhookEndpointWithEvents): string {
  if (!subscription.secretCiphertext) {
    throw new AppError('Webhook subscription has no signing secret', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return decryptWebhookSecret(subscription.secretCiphertext);
}

function toWebhookSubscriptionView(subscription: TWebhookEndpointWithEvents) {
  return {
    id: subscription.id,
    eventType: subscription.eventTypes[0],
    targetUrl: subscription.payloadUrl,
    courseId: subscription.filterCourseId,
    cohortId: subscription.filterCohortId,
    secret: readSubscriptionSecret(subscription),
    createdAt: subscription.createdAt
  };
}

/**
 * Subscribes the connected app's `targetUrl` to one event. Idempotent per target URL: a repeat returns the
 * existing subscription with `created: false`. Throws 403 for automation keys, at the plan cap, or without webhooks.
 */
export async function createWebhookSubscriptionService(
  orgId: string,
  actorId: string | null,
  principal: TAutomationPrincipal,
  payload: TPublicApiCreateWebhookSubscription
) {
  const grant = requireOAuthGrant(principal);
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);
  await assertWebhooksAllowed(orgId);
  await assertTargetUrlAllowed(payload.targetUrl, getSubscriptionHostsForClient(grant.clientId));

  if (payload.courseId) {
    await assertCourseBelongsToOrganization(orgId, payload.courseId);
  }

  if (payload.cohortId) {
    await assertCohortBelongsToOrganization(orgId, payload.cohortId);
  }

  const secret = generateWebhookSecret();
  const maxSubscriptions = await getOrganizationSubscriptionLimit(orgId);
  const name = `${getSubscriptionNamePrefix(grant.clientId)} · ${payload.eventType}`.slice(0, SUBSCRIPTION_NAME_MAX_LENGTH);
  const result = await upsertManagedWebhookSubscription(
    {
      organizationId: orgId,
      oauthConsentId: grant.oauthConsentId,
      name,
      payloadUrl: payload.targetUrl,
      secretCiphertext: encryptWebhookSecret(secret),
      secretLast4: secret.slice(-4),
      filterCourseId: payload.courseId ?? null,
      filterCohortId: payload.cohortId ?? null,
      createdByProfileId: actorId
    },
    payload.eventType,
    maxSubscriptions
  );

  if (!result) {
    throw new AppError(
      `This organization's plan allows up to ${maxSubscriptions} trigger subscriptions`,
      ErrorCodes.WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED,
      403
    );
  }

  if (!result.created && result.subscription.eventTypes[0] !== payload.eventType) {
    throw new AppError(
      'targetUrl is already subscribed to a different event',
      ErrorCodes.WEBHOOK_SUBSCRIPTION_CONFLICT,
      409,
      'targetUrl'
    );
  }

  if (result.created) {
    await refreshOrgHasWebhookEndpoints(orgId);
  }

  if (result.created && getConnectedAppKind(grant.clientId) === 'zapier') {
    captureZapierTriggerSubscribed({ organizationId: orgId, profileId: actorId, eventType: payload.eventType });
  }

  return { subscription: toWebhookSubscriptionView(result.subscription), created: result.created };
}

export async function deleteWebhookSubscriptionService(
  orgId: string,
  principal: TAutomationPrincipal,
  params: TPublicApiWebhookSubscriptionParam
) {
  const grant = requireOAuthGrant(principal);
  const deleted = await deleteManagedWebhookSubscription(grant.oauthConsentId, params.subscriptionId);

  if (!deleted) {
    throw new AppError('Webhook subscription not found', ErrorCodes.WEBHOOK_SUBSCRIPTION_NOT_FOUND, 404);
  }

  await refreshOrgHasWebhookEndpoints(orgId);

  return { id: params.subscriptionId };
}
```

`assertOrgAdmin` already ran in [#1435](https://github.com/classroomio/classroomio/pull/1435)'s token middleware for OAuth; it is repeated here because the service is the authority, as in every other v1 service.

### R6.4 Samples (`apps/api/src/services/v1/webhooks/samples.ts`, new)

```ts
import { getOrganizationById } from '@cio/db/queries/organization';
import { listLatestWebhookEvents } from '@cio/db/queries/webhook';
import { buildWebhookExampleEnvelope } from '@cio/utils/validation/webhook';
import type { TPublicApiWebhookSamplesQuery } from '@cio/utils/validation/public-api';

import { assertWebhooksAllowed } from '@api/services/webhook/webhook';
import { assertOrgAdmin } from '../shared';

/**
 * The organization's latest real events of the requested type, or one documented example when none exist yet.
 * Every item has the exact shape of a delivery.
 */
export async function listWebhookSamplesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiWebhookSamplesQuery
) {
  await assertOrgAdmin(orgId, actorId);
  await assertWebhooksAllowed(orgId);

  const events = await listLatestWebhookEvents(orgId, query.eventType, {
    courseId: query.courseId,
    cohortId: query.cohortId,
    limit: query.limit
  });

  if (events.length > 0) return events;

  const organization = await getOrganizationById(orgId);
  const exampleOrganization = { id: orgId, name: organization?.name ?? null, siteName: organization?.siteName ?? null };

  return [buildWebhookExampleEnvelope(query.eventType, exampleOrganization)];
}
```

### R6.5 Identity (`apps/api/src/services/v1/me/me.ts`, new)

```ts
import { getProfileById } from '@cio/db/queries/auth';
import { getOrganizationById } from '@cio/db/queries/organization';

import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor } from '../shared';

export async function getMeService(orgId: string, actorId: string | null, principal: TAutomationPrincipal) {
  assertAutomationActor(actorId);

  const [organization, actor] = await Promise.all([getOrganizationById(orgId), getProfileById(actorId)]);

  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const { automationKey, oauthClientId } = principal;
  const isOAuth = automationKey.oauthConsentId !== null;

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      siteName: organization.siteName,
      avatarUrl: organization.avatarUrl
    },
    connection: {
      kind: isOAuth ? ('oauth' as const) : ('api_key' as const),
      id: automationKey.oauthConsentId ?? automationKey.id,
      clientId: oauthClientId,
      scopes: automationKey.scopes ?? []
    },
    actor: {
      profileId: actorId,
      fullname: actor?.fullname ?? null,
      email: actor?.email ?? null
    }
  };
}
```

### R6.6 OAuth service changes (`apps/api/src/services/oauth/oauth.ts`, from [#1435](https://github.com/classroomio/classroomio/pull/1435))

```ts
import { env } from '@cio/core/config/env';
import { refreshOrgHasWebhookEndpoints } from '@cio/core/services/webhook/endpoint-cache';
import { isTrustedOAuthClient, PUBLIC_API_RESOURCE } from '@cio/db/auth';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { canUsePublicApi } from '@cio/utils/plans';

import { getConnectedAppKind } from './clients';

export type TOAuthGrant = {
  key: TOrganizationApiKey;
  clientId: string;
};

/**
 * Admin workspaces the user can pick for an OAuth flow. For the public API resource, a workspace whose plan
 * excludes the public API is returned with `eligible: false` and `reason: 'plan'`.
 */
export async function listOAuthOrganizationsService(userId: string, resource?: string) {
  const organizations = await listOAuthEligibleOrganizations(userId);
  const needsPublicApi = resource === PUBLIC_API_RESOURCE;
  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';
  const plans = needsPublicApi
    ? await Promise.all(organizations.map((organization) => getActiveOrganizationPlan(organization.id)))
    : [];

  return organizations.map((organization, index) => {
    const eligible = !needsPublicApi || canUsePublicApi(plans[index]?.planName, isSelfHosted);

    return { ...organization, eligible, reason: eligible ? null : ('plan' as const) };
  });
}

export async function listOAuthConnectedAppsService(organizationId: string) {
  const apps = await listOAuthConnectedApps(organizationId);

  return apps.map((app) => ({
    ...app,
    kind: getConnectedAppKind(app.clientId),
    lastUsedAt: app.lastUsedAt ? new Date(app.lastUsedAt).toISOString() : null
  }));
}

export async function revokeOAuthConnectedAppService(organizationId: string, consentId: string) {
  const revoked = await revokeOAuthConsent(consentId, organizationId);

  if (!revoked) {
    throw new AppError('Connected app not found', ErrorCodes.OAUTH_CONNECTED_APP_NOT_FOUND, 404);
  }

  await refreshOrgHasWebhookEndpoints(organizationId);
}
```

`authenticateOAuthAccessTokenService` returns the client with the key:

```ts
export async function authenticateOAuthAccessTokenService(
  token: string,
  resource: OAuthResourceKind
): Promise<TOAuthGrant> {
  // …existing verification, admin, consent and plan checks unchanged…

  return { key: { ...grantKey, scopes: claims.scopes }, clientId: claims.clientId };
}
```

`selectOAuthOrganizationService` stays as is: the plan is enforced on every request regardless of what the picker showed.

### R6.7 Zapier tab data (`apps/api/src/services/organization/zapier.ts`, new)

```ts
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { listOAuthConnectedApps } from '@cio/db/queries/auth';
import { getCourseTitlesByIds } from '@cio/db/queries/course/course';
import { listManagedWebhookSubscriptions, type TWebhookEndpointWithEvents } from '@cio/db/queries/webhook';
import { getWebhookSubscriptionLimit } from '@cio/utils/plans';

import { getConnectedAppKind } from '@api/services/oauth/clients';
import { resolveWebhookHealth } from '@api/services/webhook/webhook';

function toZapierTriggerView(subscription: TWebhookEndpointWithEvents, courseTitles: Map<string, string | null>) {
  return {
    id: subscription.id,
    eventType: subscription.eventTypes[0],
    courseId: subscription.filterCourseId,
    courseTitle: subscription.filterCourseId ? (courseTitles.get(subscription.filterCourseId) ?? null) : null,
    cohortId: subscription.filterCohortId,
    health: resolveWebhookHealth(subscription),
    isActive: subscription.isActive,
    lastDeliveryStatus: subscription.lastDeliveryStatus,
    lastDeliveryAt: subscription.lastDeliveryAt,
    createdAt: subscription.createdAt
  };
}

/**
 * The organization's Zapier connections, each with its active trigger subscriptions, plus the plan's trigger cap.
 */
export async function getZapierConnectionsService(organizationId: string) {
  const [apps, subscriptions, activePlan] = await Promise.all([
    listOAuthConnectedApps(organizationId),
    listManagedWebhookSubscriptions(organizationId),
    getActiveOrganizationPlan(organizationId)
  ]);

  const zapierApps = apps.filter((app) => getConnectedAppKind(app.clientId) === 'zapier');
  const zapierConsentIds = new Set(zapierApps.map((app) => app.consentId));
  const zapierSubscriptions = subscriptions.filter(
    (subscription) => subscription.oauthConsentId && zapierConsentIds.has(subscription.oauthConsentId)
  );
  const courseIds = zapierSubscriptions.flatMap((subscription) =>
    subscription.filterCourseId ? [subscription.filterCourseId] : []
  );
  const courseTitles = await getCourseTitlesByIds([...new Set(courseIds)]);

  const connections = zapierApps.map((app) => {
    const triggers = zapierSubscriptions
      .filter((subscription) => subscription.oauthConsentId === app.consentId)
      .map((subscription) => toZapierTriggerView(subscription, courseTitles));

    return {
      consentId: app.consentId,
      authorizedBy: { profileId: app.userId, fullname: app.userFullname },
      scopes: app.scopes,
      connectedAt: app.createdAt.toISOString(),
      lastUsedAt: app.lastUsedAt ? new Date(app.lastUsedAt).toISOString() : null,
      triggers
    };
  });

  const maxTriggerSubscriptions = getWebhookSubscriptionLimit(activePlan?.planName);
  const limits = { maxTriggerSubscriptions, activeTriggerSubscriptions: subscriptions.length };

  return { connections, limits };
}
```

In `apps/api/src/services/webhook/webhook.ts`, rename `resolveHealth` to `resolveWebhookHealth`, export it, and type its parameter as `Pick<TWebhookEndpoint, 'isActive' | 'autoDisabledAt' | 'consecutiveFailures'>`.

### R6.8 Enroll by email (`apps/api/src/services/v1/courses/enrollments.ts`, new)

Change `addCourseMemberService` (`services/v1/courses/members.ts`) to take `oauthClientId: string | null = null` after `apiKeyId` and pass `buildMemberSource(apiKeyId ? 'api' : 'admin', { apiKeyId, oauthClientId })`.

```ts
import { ROLE } from '@cio/utils/constants';
import { getOrganizationMembersByNormalizedEmails } from '@cio/db/queries/organization';
import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import { findActiveCourseInviteIdForEmail } from '@cio/db/queries/course/invite';
import type { TEventSource } from '@cio/core/services/posthog';
import type {
  TPublicApiCourseParam,
  TPublicApiCreateCourseInvite,
  TPublicApiEnrollCourseStudent
} from '@cio/utils/validation/public-api';

import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { createCourseInviteService } from './invites';
import { addCourseMemberService } from './members';
import { assertAutomationActor, assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '../shared';

const ENROLLMENT_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function buildEnrollmentInvite(email: string, sendEmail: boolean): TPublicApiCreateCourseInvite {
  const expiresAt = new Date(Date.now() + ENROLLMENT_INVITE_TTL_MS).toISOString();

  return { preset: 'CUSTOM', expiresAt, maxUses: 1, allowedEmails: [email], recipientEmails: [email], sendEmail };
}

/**
 * Enrolls `email` as a student: an existing organization student is added directly, someone new gets a single-use
 * invite. Repeating the call changes nothing and reports `already_enrolled` or `already_invited`.
 */
export async function enrollCourseStudentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiEnrollCourseStudent,
  principal: TAutomationPrincipal,
  source: TEventSource = 'public_api'
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  const email = payload.email.trim().toLowerCase();
  const existingMemberId = await getCourseMemberIdByEmail(params.courseId, email);

  if (existingMemberId) {
    return { status: 'already_enrolled' as const, memberId: existingMemberId, inviteId: null, email };
  }

  const [organizationMember] = await getOrganizationMembersByNormalizedEmails(orgId, [email]);

  if (organizationMember && organizationMember.roleId !== ROLE.STUDENT) {
    throw new AppError(
      'This email belongs to an admin or tutor. Add them to the course from the dashboard',
      ErrorCodes.STAFF_CANNOT_ENROLL,
      409,
      'email'
    );
  }

  if (organizationMember) {
    const member = await addCourseMemberService(
      orgId,
      actorId,
      params,
      { email, roleId: ROLE.STUDENT },
      source,
      principal.automationKey.id,
      principal.oauthClientId
    );

    return { status: 'enrolled' as const, memberId: member.id, inviteId: null, email };
  }

  const pendingInviteId = await findActiveCourseInviteIdForEmail(params.courseId, email);

  if (pendingInviteId) {
    return { status: 'already_invited' as const, memberId: null, inviteId: pendingInviteId, email };
  }

  await createCourseInviteService(orgId, actorId, params, buildEnrollmentInvite(email, payload.sendEmail), source);
  const inviteId = await findActiveCourseInviteIdForEmail(params.courseId, email);

  return { status: 'invited' as const, memberId: null, inviteId, email };
}
```

A concurrent duplicate add hits the `(group_id, email)` unique constraint and surfaces as `409 CONFLICT` through `handlePublicApiError`; the Zapier app maps it to a retry-safe success by calling the endpoint again (R11.7).

### R6.9 Product events (`apps/api/src/services/product-events.ts`)

```ts
export function captureZapierTriggerSubscribed(input: {
  organizationId: string;
  profileId: string;
  eventType: string;
}): void {
  captureServerEvent({
    event: 'zapier_trigger_subscribed',
    distinctId: input.profileId,
    orgId: input.organizationId,
    properties: { org_id: input.organizationId, event_type: input.eventType }
  });
}
```

It is called from `createWebhookSubscriptionService` (R6.3). Mirror the dashboard events (`zapier_connect_clicked`, `zapier_connection_removed`) through the dashboard's existing analytics wrapper.

---

## R7. API middleware

### R7.1 Carry the OAuth client (`apps/api/src/middlewares/oauth-token.ts`, [#1435](https://github.com/classroomio/classroomio/pull/1435))

`apps/api/src/types/auth.ts`: add `oauthClientId: string` to the context variables.

```ts
export const oauthTokenMiddleware = async (c: Context, next: Next) => {
  let grant: TOAuthGrant;

  try {
    grant = await authenticateOAuthRequest(c);
  } catch (error) {
    if (!(error instanceof AppError)) throw error;

    if (error.statusCode === 403) {
      return c.json({ success: false, error: error.message, code: error.code }, 403);
    }

    c.header('WWW-Authenticate', 'Bearer error="invalid_token"');

    return c.json({ success: false, error: error.message, code: ErrorCodes.UNAUTHORIZED }, 401);
  }

  c.set('automationKey', grant.key);
  c.set('oauthClientId', grant.clientId);
  c.set('orgId', grant.key.organizationId);
  c.set('actorId', grant.key.createdByProfileId);

  await touchOrganizationApiKeyLastUsedService(grant.key);
  await next();
};
```

`WWW-Authenticate` on 401 is what Zapier's `autoRefresh` and RFC 6750 clients expect.

### R7.2 Route scopes (`apps/api/src/middlewares/public-api-scopes.ts`)

```ts
const COURSE_MEMBER_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/(?:members|invites|enrollments)(?:\/|$)/;
const WEBHOOK_SUBSCRIPTION_PATH = /^(?:\/public-api\/v1)?\/webhooks(?:\/|$)/;
const IDENTITY_PATH = /^(?:\/public-api\/v1)?\/me\/?$/;

export function isPublicApiIdentityPath(path: string): boolean {
  return IDENTITY_PATH.test(path);
}
```

In `getPublicApiRouteScope`, before the final `return null`:

```ts
  if (WEBHOOK_SUBSCRIPTION_PATH.test(path)) {
    return isRead ? 'webhook:subscription:read' : 'webhook:subscription:write';
  }
```

In `publicApiScopesMiddleware`, after the `automationKey` check:

```ts
  if (isPublicApiIdentityPath(c.req.path)) return next();
```

---

## R8. API routes

### R8.1 `/me` (`apps/api/src/routes/v1/me/`)

`docs.ts`:

```ts
export const CONNECTION_TAG = 'Connection';
```

`me.ts`:

```ts
import { ZPublicApiMeResponse } from '@cio/utils/validation/public-api';
import { describeRoute } from 'hono-openapi';

import { getMeService } from '@api/services/v1/me/me';
import { toAutomationPrincipal } from '@api/utils/automation-principal';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { CONNECTION_TAG } from './docs';

export const v1MeRouter = new Hono().get(
  '/',
  describeRoute({
    description: 'Get the organization, connection and acting admin behind the credential; any valid key or OAuth token can call it.',
    tags: [CONNECTION_TAG],
    responses: {
      200: jsonResponse('The credential is valid', itemResponse(ZPublicApiMeResponse)),
      401: errorResponses.unauthorized,
      429: mcpRateLimitResponse
    }
  }),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
      const me = await getMeService(orgId, actorId, principal);

      return c.json({ success: true, data: me }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to load the connection');
    }
  }
);
```

`index.ts`: `export * from './me';`

### R8.2 Webhook subscriptions (`apps/api/src/routes/v1/webhooks/`)

`docs.ts`:

```ts
export const WEBHOOK_SUBSCRIPTIONS_TAG = 'Webhook Subscriptions';

export const CONNECTED_APP_RULE =
  'only apps connected through OAuth can call it, and the admin who connected the app must still be an org admin';

export const webhookSubscriptionForbidden = (scope: 'webhook:subscription:read' | 'webhook:subscription:write') => ({
  description: `The token lacks the ${scope} scope, the credential is an automation key (code OAUTH_CONNECTION_REQUIRED), the plan does not include webhooks (code UPGRADE_REQUIRED), or the plan's trigger subscription cap is reached (code WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED)`
});
```

`subscriptions.ts`:

```ts
import {
  ZPublicApiCreateWebhookSubscription,
  ZPublicApiDeleteWebhookSubscriptionResponse,
  ZPublicApiWebhookSubscriptionParam,
  ZPublicApiWebhookSubscriptionResponse
} from '@cio/utils/validation/public-api';
import { describeRoute, validator } from 'hono-openapi';

import {
  createWebhookSubscriptionService,
  deleteWebhookSubscriptionService
} from '@api/services/v1/webhooks/subscriptions';
import { toAutomationPrincipal } from '@api/utils/automation-principal';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { CONNECTED_APP_RULE, WEBHOOK_SUBSCRIPTIONS_TAG, webhookSubscriptionForbidden } from './docs';

export const v1WebhookSubscriptionsRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: `Subscribe a URL to one event so the connected app receives it as it happens; ${CONNECTED_APP_RULE}.`,
      tags: [WEBHOOK_SUBSCRIPTIONS_TAG],
      responses: {
        200: jsonResponse(
          'The app already subscribed this URL; the existing subscription is returned',
          itemResponse(ZPublicApiWebhookSubscriptionResponse)
        ),
        201: jsonResponse('Subscription created', itemResponse(ZPublicApiWebhookSubscriptionResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: webhookSubscriptionForbidden('webhook:subscription:write'),
        404: { description: 'courseId or cohortId is not in your organization' },
        409: { description: 'targetUrl is already subscribed to a different event' },
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiCreateWebhookSubscription),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
        const { subscription, created } = await createWebhookSubscriptionService(orgId, actorId, principal, payload);

        return c.json({ success: true, data: subscription }, created ? 201 : 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create webhook subscription');
      }
    }
  )
  .delete(
    '/:subscriptionId',
    describeRoute({
      description: `Delete one of the connected app's webhook subscriptions so its URL stops receiving events; ${CONNECTED_APP_RULE}.`,
      tags: [WEBHOOK_SUBSCRIPTIONS_TAG],
      responses: {
        200: jsonResponse('Subscription deleted', itemResponse(ZPublicApiDeleteWebhookSubscriptionResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: webhookSubscriptionForbidden('webhook:subscription:write'),
        404: { description: 'The connected app has no subscription with this id' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiWebhookSubscriptionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
        const deleted = await deleteWebhookSubscriptionService(orgId, principal, params);

        return c.json({ success: true, data: deleted }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete webhook subscription');
      }
    }
  );
```

`samples.ts`:

```ts
import * as z from 'zod';
import { ZPublicApiWebhookSampleResponse, ZPublicApiWebhookSamplesQuery } from '@cio/utils/validation/public-api';
import { describeRoute, validator } from 'hono-openapi';

import { listWebhookSamplesService } from '@api/services/v1/webhooks/samples';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { ORG_ADMIN_RULE } from '../team/docs';
import { mcpRateLimitResponse } from '../courses/docs';
import { WEBHOOK_SUBSCRIPTIONS_TAG, webhookSubscriptionForbidden } from './docs';

export const v1WebhookSamplesRouter = new Hono().get(
  '/',
  describeRoute({
    description: `List up to three recent events of one type, or a documented example when there are none yet, shaped exactly like deliveries; ${ORG_ADMIN_RULE}.`,
    tags: [WEBHOOK_SUBSCRIPTIONS_TAG],
    responses: {
      200: jsonResponse('Sample events, newest first', itemResponse(z.array(ZPublicApiWebhookSampleResponse))),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: webhookSubscriptionForbidden('webhook:subscription:read'),
      429: mcpRateLimitResponse
    }
  }),
  validator('query', ZPublicApiWebhookSamplesQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const query = c.req.valid('query');
      const samples = await listWebhookSamplesService(orgId, actorId, query);

      return c.json({ success: true, data: samples }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to list webhook samples');
    }
  }
);
```

`index.ts`:

```ts
import { Hono } from '@api/utils/hono';
import { v1WebhookSamplesRouter } from './samples';
import { v1WebhookSubscriptionsRouter } from './subscriptions';

export const v1WebhooksRouter = new Hono()
  .route('/subscriptions', v1WebhookSubscriptionsRouter)
  .route('/samples', v1WebhookSamplesRouter);
```

### R8.3 Enrollments (`apps/api/src/routes/v1/courses/enrollments.ts`, new)

```ts
import {
  ZPublicApiCourseParam,
  ZPublicApiEnrollCourseStudent,
  ZPublicApiEnrollCourseStudentResponse
} from '@cio/utils/validation/public-api';
import { describeRoute, validator } from 'hono-openapi';

import { enrollCourseStudentService } from '@api/services/v1/courses/enrollments';
import { toAutomationPrincipal } from '@api/utils/automation-principal';
import { getEventSource } from '@api/utils/event-source';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, mcpRateLimitResponse } from './docs';

export const v1CourseEnrollmentsRouter = new Hono().post(
  '/',
  describeRoute({
    description: `Enroll a student by email, inviting them first when they are new, and change nothing on repeat calls; ${COURSE_TEAM_RULE}.`,
    tags: ['Course Members'],
    responses: {
      200: jsonResponse(
        'status says whether the student was enrolled, invited, or already was',
        itemResponse(ZPublicApiEnrollCourseStudentResponse)
      ),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: { description: 'The token lacks the course:member:write scope, or the actor cannot manage this course' },
      404: { description: 'Course not found' },
      409: { description: 'The email belongs to an admin or tutor (code STAFF_CANNOT_ENROLL)' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseParam),
  validator('json', ZPublicApiEnrollCourseStudent),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const params = c.req.valid('param');
      const payload = c.req.valid('json');
      const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
      const enrollment = await enrollCourseStudentService(
        orgId,
        actorId,
        params,
        payload,
        principal,
        getEventSource(c)
      );

      return c.json({ success: true, data: enrollment }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to enroll student');
    }
  }
);
```

Mount it in `routes/v1/courses/index.ts` next to the members router: `.route('/:courseId/enrollments', v1CourseEnrollmentsRouter)`.

### R8.4 Mount (`apps/api/src/routes/v1/index.ts`)

```ts
import { v1MeRouter } from './me';
import { v1WebhooksRouter } from './webhooks';

  // …existing chain…
  .route('/me', v1MeRouter)
  .route('/webhooks', v1WebhooksRouter)
```

### R8.5 Session routes

`apps/api/src/routes/oauth/oauth.ts` ([#1435](https://github.com/classroomio/classroomio/pull/1435)), workspace list takes the resource:

```ts
  .get('/organizations', authMiddleware, zValidator('query', ZListOAuthOrganizationsQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const { resource } = c.req.valid('query');
      const organizations = await listOAuthOrganizationsService(user.id, resource);

      return c.json({ success: true, data: organizations }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list organizations');
    }
  })
```

`apps/api/src/routes/organization/automation.ts`, Zapier tab data:

```ts
  .get('/zapier', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const zapier = await getZapierConnectionsService(orgId);

      return c.json({ success: true, data: zapier }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load Zapier connections');
    }
  })
```

Revoking a Zapier connection reuses [#1435](https://github.com/classroomio/classroomio/pull/1435)'s `DELETE /organization/automation/connected-apps/:consentId`.

---

## R9. OpenAPI and API docs placement

`packages/utils/src/openapi/public-api.ts`:

```ts
const OPERATION_SUMMARIES: Record<string, string> = {
  // …existing entries…
  'GET /public-api/v1/me': 'Get the current connection',
  'POST /public-api/v1/webhooks/subscriptions': 'Create a webhook subscription',
  'DELETE /public-api/v1/webhooks/subscriptions/{subscriptionId}': 'Delete a webhook subscription',
  'GET /public-api/v1/webhooks/samples': 'List sample events',
  'POST /public-api/v1/courses/{courseId}/enrollments': 'Enroll a student by email'
};

const OPERATION_TAGS = [
  // …existing tags…
  { name: 'Connection', description: 'Check which organization, connection and admin a credential acts for.' },
  {
    name: 'Webhook Subscriptions',
    description: 'Let a connected app subscribe to events and receive them as they happen.'
  }
];
```

In `enrichPublicApiOpenApiSpec`, add an `oauth2` security scheme next to `bearerAuth` with the authorization-code flow (`authorizationUrl` and `tokenUrl` under `https://app.classroomio.com/api/auth/oauth2/`, scopes = `OAUTH_API_SCOPES` with one-line descriptions), so generated clients can discover OAuth.

`apps/docs/blume.config.ts`, a new section after Organization:

```ts
  {
    label: 'Automation',
    tags: [{ tag: 'Connection', flat: true }, { tag: 'Webhook Subscriptions', label: 'Webhook Subscriptions' }]
  },
```

Update the tag assertions in `apps/api/src/routes/v1/index.test.ts` and the matching `__tests__/routes-v1-*` files. The PR description includes the resulting sidebar tree:

```text
AUTOMATION
├─ GET    /me                                   Get the current connection
└─ Webhook Subscriptions
   ├─ POST   /webhooks/subscriptions             Create a webhook subscription
   ├─ DELETE /webhooks/subscriptions/{id}        Delete a webhook subscription
   └─ GET    /webhooks/samples                   List sample events
COURSES › Members
└─ POST   /courses/{courseId}/enrollments        Enroll a student by email
```

---

## R10. Dashboard

All paths below are under `apps/dashboard/src/`. Styling follows the dashboard rule: `ui:` prefix only for theme tokens (`ui:text-muted-foreground`, `ui:border-border`, `ui:bg-muted`), plain Tailwind for layout and spacing.

### R10.1 Types (`lib/features/automation/utils/types.ts`)

```ts
import type { TZapierActionKey, TZapierTriggerKey } from '@cio/utils/constants/zapier';
import type { ZAPIER_APP_CATEGORIES } from './zapier-apps';

export type GetZapierOverviewRequest = (typeof classroomio.organization)['automation']['zapier']['$get'];
export type GetZapierOverviewSuccess = Extract<InferResponseType<GetZapierOverviewRequest>, { success: true }>;
export type ZapierOverview = GetZapierOverviewSuccess['data'];
export type ZapierConnection = ZapierOverview['connections'][number];
export type ZapierTrigger = ZapierConnection['triggers'][number];

export type ZapierAppCategory = (typeof ZAPIER_APP_CATEGORIES)[number];
export type ZapierCatalogCategory = ZapierAppCategory | 'all';

export type ZapierApp = {
  slug: string;
  name: string;
  category: ZapierAppCategory;
  color: string;
  isPopular: boolean;
  hasLogo: boolean;
  triggerKey: TZapierTriggerKey;
  actionKey: TZapierActionKey;
};

export type ZapierAccess = 'read_write' | 'read_only';
```

`ConnectedApp` (from [#1435](https://github.com/classroomio/classroomio/pull/1435)'s `ListConnectedAppsSuccess`) now carries `kind`, inferred from the API.

### R10.2 API class (`lib/features/automation/api/zapier.svelte.ts`, new)

```ts
import type {
  GetZapierOverviewRequest,
  RevokeConnectedAppRequest,
  ZapierOverview
} from '$features/automation/utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { snackbar } from '$features/ui/snackbar/store';

const EMPTY_OVERVIEW: ZapierOverview = {
  connections: [],
  limits: { maxTriggerSubscriptions: 0, activeTriggerSubscriptions: 0 }
};

class ZapierApi extends BaseApiWithErrors {
  overview = $state<ZapierOverview | null>(null);
  private loadRequestSeq = 0;

  async load() {
    const requestSeq = ++this.loadRequestSeq;

    return this.execute<GetZapierOverviewRequest>({
      requestFn: () => classroomio.organization.automation.zapier.$get(),
      logContext: 'loading Zapier connections',
      onSuccess: (response) => {
        if (requestSeq !== this.loadRequestSeq) return;

        this.overview = response.data;
      },
      onError: () => {
        if (requestSeq !== this.loadRequestSeq) return;

        this.overview ??= EMPTY_OVERVIEW;
      }
    });
  }

  async removeConnection(consentId: string) {
    return this.execute<RevokeConnectedAppRequest>({
      requestFn: () =>
        classroomio.organization.automation['connected-apps'][':consentId'].$delete({ param: { consentId } }),
      logContext: 'removing Zapier connection',
      onSuccess: () => {
        if (!this.overview) return;

        const removed = this.overview.connections.find((connection) => connection.consentId === consentId);

        this.overview.connections = this.overview.connections.filter(
          (connection) => connection.consentId !== consentId
        );
        this.overview.limits.activeTriggerSubscriptions -= removed?.triggers.length ?? 0;
        snackbar.success('snackbar.zapier.removed');
      }
    });
  }

  resetOrganizationState() {
    this.loadRequestSeq += 1;
    this.overview = null;
  }
}

export const zapierApi = new ZapierApi();
```

### R10.3 Catalog (`lib/features/automation/utils/zapier-apps.ts`, new)

Copy and logos live in translations and `static/images/integrations/`; this file holds data only. `hasLogo` stays `false` until each brand's asset is cleared (D15); the card then shows a monogram in the brand color.

```ts
import type { ZapierApp } from './types';

export const ZAPIER_APP_CATEGORIES = [
  'crm',
  'marketing',
  'communication',
  'customer-support',
  'sales',
  'productivity',
  'forms',
  'analytics',
  'community'
] as const;

export const ZAPIER_APPS = [
  { slug: 'hubspot', name: 'HubSpot', category: 'crm', color: '#FF7A59', isPopular: true, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'salesforce', name: 'Salesforce', category: 'crm', color: '#00A1E0', isPopular: true, hasLogo: false, triggerKey: 'new_certificate', actionKey: 'enroll_student' },
  { slug: 'mailchimp', name: 'Mailchimp', category: 'marketing', color: '#FFE01B', isPopular: false, hasLogo: false, triggerKey: 'new_course_enrollment', actionKey: 'add_student' },
  { slug: 'customerio', name: 'Customer.io', category: 'marketing', color: '#5B3DF5', isPopular: true, hasLogo: false, triggerKey: 'lesson_completed', actionKey: 'enroll_student' },
  { slug: 'slack', name: 'Slack', category: 'communication', color: '#4A154B', isPopular: true, hasLogo: false, triggerKey: 'new_submission', actionKey: 'post_cohort_announcement' },
  { slug: 'teams', name: 'Microsoft Teams', category: 'communication', color: '#5059C9', isPopular: false, hasLogo: false, triggerKey: 'course_completed', actionKey: 'post_cohort_announcement' },
  { slug: 'google_meet', name: 'Google Meet', category: 'communication', color: '#00AC47', isPopular: false, hasLogo: false, triggerKey: 'live_session_scheduled', actionKey: 'mark_lesson_complete' },
  { slug: 'zoom', name: 'Zoom', category: 'communication', color: '#2D8CFF', isPopular: true, hasLogo: false, triggerKey: 'new_course_enrollment', actionKey: 'mark_lesson_complete' },
  { slug: 'zendesk', name: 'Zendesk', category: 'customer-support', color: '#03363D', isPopular: true, hasLogo: false, triggerKey: 'compliance_status_changed', actionKey: 'enroll_student' },
  { slug: 'intercom', name: 'Intercom', category: 'customer-support', color: '#1F8DED', isPopular: true, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'calendly', name: 'Calendly', category: 'sales', color: '#006BFF', isPopular: true, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'calcom', name: 'Cal.com', category: 'sales', color: '#000000', isPopular: false, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'sheets', name: 'Google Sheets', category: 'productivity', color: '#188038', isPopular: true, hasLogo: false, triggerKey: 'new_certificate', actionKey: 'add_student' },
  { slug: 'notion', name: 'Notion', category: 'productivity', color: '#1A1A1A', isPopular: false, hasLogo: false, triggerKey: 'course_published', actionKey: 'send_course_invite' },
  { slug: 'confluence', name: 'Confluence', category: 'productivity', color: '#2684FF', isPopular: false, hasLogo: false, triggerKey: 'course_published', actionKey: 'send_course_invite' },
  { slug: 'typeform', name: 'Typeform', category: 'forms', color: '#262627', isPopular: true, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'jotform', name: 'Jotform', category: 'forms', color: '#FF6100', isPopular: false, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'pendo', name: 'Pendo', category: 'analytics', color: '#00A99D', isPopular: false, hasLogo: false, triggerKey: 'course_completed', actionKey: 'enroll_student' },
  { slug: 'mixpanel', name: 'Mixpanel', category: 'analytics', color: '#7856FF', isPopular: false, hasLogo: false, triggerKey: 'lesson_completed', actionKey: 'enroll_student' },
  { slug: 'circle', name: 'Circle', category: 'community', color: '#5B4FE9', isPopular: false, hasLogo: false, triggerKey: 'new_course_enrollment', actionKey: 'add_cohort_member' }
] as const satisfies readonly ZapierApp[];
```

Format this file with the repo formatter; the long rows above are compressed for the plan.

### R10.4 Pure helpers (`lib/features/automation/utils/zapier-utils.ts`, new)

```ts
import { env } from '$env/dynamic/public';
import { ZAPIER_TRIGGERS, type TZapierTriggerKey } from '@cio/utils/constants/zapier';

import { ZAPIER_APP_CATEGORIES } from './zapier-apps';
import type { ZapierAccess, ZapierApp, ZapierCatalogCategory } from './types';

export const ZAPIER_URLS = {
  editor: 'https://zapier.com/app/editor',
  connections: 'https://zapier.com/app/assets/connections'
} as const;

export const ZAPIER_CATALOG_PREVIEW_COUNT = 8;

export function parseZapierCategory(value: string | null): ZapierCatalogCategory {
  return ZAPIER_APP_CATEGORIES.find((category) => category === value) ?? 'all';
}

export function filterZapierApps(
  apps: readonly ZapierApp[],
  query: string,
  category: ZapierCatalogCategory,
  describe: (app: ZapierApp) => string
): ZapierApp[] {
  const normalizedQuery = query.trim().toLowerCase();

  return apps.filter((app) => {
    const matchesCategory = category === 'all' || app.category === category;
    const matchesQuery =
      !normalizedQuery ||
      app.name.toLowerCase().includes(normalizedQuery) ||
      describe(app).toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export function countZapierAppsByCategory(apps: readonly ZapierApp[]): Map<ZapierCatalogCategory, number> {
  const counts = new Map<ZapierCatalogCategory, number>([['all', apps.length]]);

  for (const app of apps) {
    counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
  }

  return counts;
}

export function sortZapierApps(apps: readonly ZapierApp[]): ZapierApp[] {
  return [...apps].sort((first, second) => {
    if (first.isPopular !== second.isPopular) return first.isPopular ? -1 : 1;

    return first.name.localeCompare(second.name);
  });
}

export function getZapierAccess(scopes: string[]): ZapierAccess {
  return scopes.some((scope) => scope.endsWith(':write')) ? 'read_write' : 'read_only';
}

export function getZapierTriggerKey(eventType: string): TZapierTriggerKey | null {
  return ZAPIER_TRIGGERS.find((trigger) => trigger.eventType === eventType)?.key ?? null;
}

export function getZapierAppMonogram(app: ZapierApp): string {
  return app.name.slice(0, 2);
}

/**
 * Where "Create a Zap" sends the admin: a pre-filled Zap for `app` once the integration is public, else the editor.
 */
export function buildZapierCreateUrl(app: ZapierApp | null): string {
  const appKey = env.PUBLIC_ZAPIER_APP_KEY;

  if (env.PUBLIC_ZAPIER_LISTING !== 'public' || !appKey || !app) return ZAPIER_URLS.editor;

  const url = new URL(`https://api.zapier.com/v1/embed/${encodeURIComponent(app.slug)}/create`);
  url.searchParams.set('steps[0][app]', `${appKey}@latest`);
  url.searchParams.set('steps[0][action]', app.triggerKey);

  return url.toString();
}

export function formatZapierDate(value: string | null): string | null {
  return value ? new Date(value).toLocaleDateString() : null;
}

export function getZapierConnectUrl(): string {
  return env.PUBLIC_ZAPIER_CONNECT_URL ?? '';
}
```

The Zapier variables are optional and differ per deployment, so they are read from `$env/dynamic/public`; `$env/static/public` would fail the build wherever one is unset.

Add `PUBLIC_ZAPIER_CONNECT_URL=`, `PUBLIC_ZAPIER_LISTING=private` and `PUBLIC_ZAPIER_APP_KEY=` to `apps/dashboard/.env.example`, and `ZAPIER_HELP_URL` to `utils/automation-utils.ts` next to the other docs URLs.

### R10.5 Components (`lib/features/automation/components/`)

`zapier-app-mark.svelte`:

```svelte
<script lang="ts">
  import type { ZapierApp } from '$features/automation/utils/types';
  import { getZapierAppMonogram } from '$features/automation/utils/zapier-utils';

  interface Props {
    app: ZapierApp;
    size?: 'sm' | 'md';
  }

  let { app, size = 'md' }: Props = $props();

  const sizeClass = $derived(size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm');
</script>

{#if app.hasLogo}
  <img src="/images/integrations/{app.slug}.svg" alt={app.name} class="{sizeClass} rounded-lg object-contain" />
{:else}
  <span
    class="{sizeClass} flex shrink-0 items-center justify-center rounded-lg font-semibold text-white"
    style="background-color: {app.color}"
    aria-hidden="true"
  >
    {getZapierAppMonogram(app)}
  </span>
{/if}
```

`zapier-connect-card.svelte`:

```svelte
<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';

  import { t } from '$lib/utils/functions/translations';

  interface Props {
    connectUrl: string;
    canConnect: boolean;
    onBrowseApps: () => void;
  }

  let { connectUrl, canConnect, onBrowseApps }: Props = $props();
</script>

<Empty
  title={$t('automation.zapier.empty.title')}
  description={$t('automation.zapier.empty.description')}
  icon={ZapIcon}
  variant="page"
>
  <div class="flex flex-wrap justify-center gap-2">
    <Button
      href={connectUrl}
      target="_blank"
      rel="noopener noreferrer"
      disabled={!canConnect}
      testId="zapier-connect"
    >
      {$t('automation.zapier.connect')}
      <ArrowUpRightIcon size={16} />
    </Button>
    <Button variant="outline" onclick={onBrowseApps} testId="zapier-browse-apps">
      {$t('automation.zapier.browse_apps')}
    </Button>
  </div>
</Empty>
```

`zapier-connections-table.svelte`:

```svelte
<script lang="ts">
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { Badge } from '@cio/ui/base/badge';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Table from '@cio/ui/base/table';
  import { IconButton } from '@cio/ui/custom/icon-button';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { formatZapierDate, getZapierAccess } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.connections';

  interface Props {
    connections: ZapierConnection[];
    canManage: boolean;
    onViewTriggers: (connection: ZapierConnection) => void;
    onRemove: (connection: ZapierConnection) => void;
  }

  let { connections, canManage, onViewTriggers, onRemove }: Props = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t(`${T}.authorized_by`)}</Table.Head>
      <Table.Head>{$t(`${T}.access`)}</Table.Head>
      <Table.Head>{$t(`${T}.triggers`)}</Table.Head>
      <Table.Head>{$t(`${T}.last_used`)}</Table.Head>
      <Table.Head>{$t(`${T}.connected`)}</Table.Head>
      <Table.Head class="w-10"></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each connections as connection (connection.consentId)}
      <Table.Row>
        <Table.Cell class="font-medium">{connection.authorizedBy.fullname ?? $t(`${T}.unknown_admin`)}</Table.Cell>
        <Table.Cell>
          <Badge variant="secondary">{$t(`${T}.access_${getZapierAccess(connection.scopes)}`)}</Badge>
        </Table.Cell>
        <Table.Cell>{connection.triggers.length}</Table.Cell>
        <Table.Cell class="ui:text-muted-foreground text-sm">
          {formatZapierDate(connection.lastUsedAt) ?? $t('automation.keys.never_used')}
        </Table.Cell>
        <Table.Cell class="ui:text-muted-foreground text-sm">{formatZapierDate(connection.connectedAt)}</Table.Cell>
        <Table.Cell>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <IconButton
                  {...props}
                  variant="secondary"
                  aria-label={$t(`${T}.actions`)}
                  testId="zapier-connection-actions-{connection.consentId}"
                >
                  <EllipsisVerticalIcon size={16} />
                </IconButton>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={() => onViewTriggers(connection)}>
                {$t(`${T}.view_triggers`)}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={!canManage}
                onclick={() => onRemove(connection)}
                data-testid="zapier-connection-remove"
              >
                {$t(`${T}.remove`)}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

`zapier-remove-dialog.svelte` (dialog hierarchy per CLAUDE.md: `size="sm"`, Cancel outline, main action on the right):

```svelte
<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.remove';

  interface Props {
    connection: ZapierConnection | null;
    isRemoving: boolean;
    onConfirm: (connection: ZapierConnection) => void;
    onClose: () => void;
  }

  let { connection, isRemoving, onConfirm, onClose }: Props = $props();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Dialog.Root open={connection !== null} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t(`${T}.title`)}</Dialog.Title>
      <Dialog.Description>
        {$t(`${T}.description`, { count: connection?.triggers.length ?? 0 })}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={onClose}>{$t('common.cancel')}</Button>
      <Button
        size="sm"
        variant="destructive"
        loading={isRemoving}
        onclick={() => connection && onConfirm(connection)}
        testId="zapier-remove-confirm"
      >
        {$t(`${T}.confirm`)}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

`zapier-triggers-sheet.svelte`:

```svelte
<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Empty } from '@cio/ui/custom/empty';
  import ZapIcon from '@lucide/svelte/icons/zap';

  import type { ZapierConnection } from '$features/automation/utils/types';
  import { formatZapierDate, getZapierTriggerKey } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.triggers';

  interface Props {
    connection: ZapierConnection | null;
    onClose: () => void;
  }

  let { connection, onClose }: Props = $props();

  function getTriggerLabel(eventType: string): string {
    const key = getZapierTriggerKey(eventType);

    return key ? t.get(`automation.zapier.catalog_triggers.${key}.label`) : eventType;
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Sheet.Root open={connection !== null} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-lg" data-testid="zapier-triggers-sheet">
    <Sheet.Header>
      <Sheet.Title>{$t(`${T}.title`)}</Sheet.Title>
      <Sheet.Description>{$t(`${T}.description`)}</Sheet.Description>
    </Sheet.Header>

    <div class="space-y-3 px-4 pb-6">
      {#if connection && connection.triggers.length === 0}
        <Empty title={$t(`${T}.empty_title`)} description={$t(`${T}.empty_description`)} icon={ZapIcon} />
      {:else if connection}
        {#each connection.triggers as trigger (trigger.id)}
          <div class="ui:border-border space-y-1 rounded-lg border p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium">{getTriggerLabel(trigger.eventType)}</p>
              <Badge variant={trigger.health === 'healthy' ? 'secondary' : 'destructive'}>
                {$t(`${T}.health_${trigger.health}`)}
              </Badge>
            </div>
            {#if trigger.courseTitle}
              <p class="ui:text-muted-foreground text-sm">{$t(`${T}.course_filter`, { course: trigger.courseTitle })}</p>
            {/if}
            <p class="ui:text-muted-foreground text-xs">
              {trigger.lastDeliveryAt
                ? $t(`${T}.last_delivery`, { date: formatZapierDate(trigger.lastDeliveryAt) ?? '' })
                : $t(`${T}.no_deliveries`)}
            </p>
          </div>
        {/each}
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
```

`zapier-app-catalog.svelte`:

```svelte
<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import * as ToggleGroup from '@cio/ui/base/toggle-group';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import type { ZapierApp, ZapierCatalogCategory } from '$features/automation/utils/types';
  import { ZAPIER_APP_CATEGORIES, ZAPIER_APPS } from '$features/automation/utils/zapier-apps';
  import {
    countZapierAppsByCategory,
    filterZapierApps,
    parseZapierCategory,
    sortZapierApps,
    ZAPIER_CATALOG_PREVIEW_COUNT
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.catalog';
  const CATEGORY_OPTIONS: ZapierCatalogCategory[] = ['all', ...ZAPIER_APP_CATEGORIES];

  interface Props {
    query: string;
    category: ZapierCatalogCategory;
    showAll: boolean;
    onQueryChange: (query: string) => void;
    onCategoryChange: (category: ZapierCatalogCategory) => void;
    onShowAll: () => void;
    onSelectApp: (app: ZapierApp) => void;
  }

  let { query, category, showAll, onQueryChange, onCategoryChange, onShowAll, onSelectApp }: Props = $props();

  const describeApp = (app: ZapierApp) => t.get(`automation.zapier.apps.${app.slug}.description`);
  const counts = countZapierAppsByCategory(ZAPIER_APPS);
  const matchingApps = $derived(sortZapierApps(filterZapierApps(ZAPIER_APPS, query, category, describeApp)));
  const visibleApps = $derived(showAll ? matchingApps : matchingApps.slice(0, ZAPIER_CATALOG_PREVIEW_COUNT));
  const hasMore = $derived(visibleApps.length < matchingApps.length);
</script>

<Field.Set id="zapier-apps" class="gap-4">
  <Field.Legend>{$t(`${T}.title`)}</Field.Legend>
  <Field.Description>{$t(`${T}.description`)}</Field.Description>

  <div class="relative">
    <SearchIcon class="ui:text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
    <Input
      class="pl-9"
      value={query}
      placeholder={$t(`${T}.search_placeholder`)}
      aria-label={$t(`${T}.search_placeholder`)}
      oninput={(event) => onQueryChange(event.currentTarget.value)}
      data-testid="zapier-catalog-search"
    />
  </div>

  <ToggleGroup.Root
    type="single"
    value={category}
    onValueChange={(value) => onCategoryChange(parseZapierCategory(value ?? null))}
    class="flex flex-wrap justify-start gap-2"
  >
    {#each CATEGORY_OPTIONS as option (option)}
      <ToggleGroup.Item value={option} class="h-8 rounded-full px-3 text-sm">
        {$t(`${T}.categories.${option}`)} · {counts.get(option) ?? 0}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>

  {#if matchingApps.length === 0}
    <p class="ui:text-muted-foreground py-6 text-center text-sm">{$t(`${T}.no_results`)}</p>
  {:else}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each visibleApps as app (app.slug)}
        <button
          type="button"
          class="ui:border-border ui:hover:bg-muted flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
          onclick={() => onSelectApp(app)}
          data-testid="zapier-catalog-app-{app.slug}"
        >
          <ZapierAppMark {app} />
          <span class="min-w-0 space-y-1">
            <span class="block font-medium">{app.name}</span>
            <span class="ui:text-muted-foreground block text-sm">{describeApp(app)}</span>
          </span>
        </button>
      {/each}
    </div>

    {#if hasMore}
      <Button variant="outline" class="self-center" onclick={onShowAll}>{$t(`${T}.show_all`)}</Button>
    {:else}
      <p class="ui:text-muted-foreground text-center text-sm">{$t(`${T}.end_note`)}</p>
    {/if}
  {/if}
</Field.Set>
```

`zapier-app-sheet.svelte`:

```svelte
<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Sheet from '@cio/ui/base/sheet';
  import { ZAPIER_ACTIONS, ZAPIER_TRIGGERS } from '@cio/utils/constants/zapier';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import type { ZapierApp } from '$features/automation/utils/types';
  import { buildZapierCreateUrl } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  const T = 'automation.zapier.app_sheet';

  interface Props {
    app: ZapierApp | null;
    isConnected: boolean;
    canConnect: boolean;
    connectUrl: string;
    onClose: () => void;
  }

  let { app, isConnected, canConnect, connectUrl, onClose }: Props = $props();

  const ctaUrl = $derived(isConnected ? buildZapierCreateUrl(app) : connectUrl);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Sheet.Root open={app !== null} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-lg" data-testid="zapier-app-sheet">
    {#if app}
      <Sheet.Header>
        <div class="flex items-center gap-2">
          <img src="/logo-192.png" alt="ClassroomIO" class="size-10 rounded-lg" />
          <span class="ui:text-muted-foreground">+</span>
          <ZapierAppMark {app} />
        </div>
        <Sheet.Title>{$t(`${T}.title`, { app: app.name })}</Sheet.Title>
        <Sheet.Description>{$t(`automation.zapier.apps.${app.slug}.description`)}</Sheet.Description>
      </Sheet.Header>

      <div class="space-y-6 px-4 pb-6">
        <section class="space-y-2">
          <h3 class="text-sm font-medium">{$t(`${T}.examples`)}</h3>
          <p class="ui:border-border rounded-lg border p-3 text-sm">
            {$t(`automation.zapier.apps.${app.slug}.trigger_example`)}
          </p>
          <p class="ui:border-border rounded-lg border p-3 text-sm">
            {$t(`automation.zapier.apps.${app.slug}.action_example`)}
          </p>
        </section>

        <section class="space-y-2">
          <h3 class="text-sm font-medium">{$t(`${T}.triggers`)}</h3>
          <ul class="ui:text-muted-foreground space-y-1 text-sm">
            {#each ZAPIER_TRIGGERS as trigger (trigger.key)}
              <li>{$t(`automation.zapier.catalog_triggers.${trigger.key}.label`)}</li>
            {/each}
          </ul>
        </section>

        <section class="space-y-2">
          <h3 class="text-sm font-medium">{$t(`${T}.actions`)}</h3>
          <ul class="ui:text-muted-foreground space-y-1 text-sm">
            {#each ZAPIER_ACTIONS as action (action.key)}
              <li>{$t(`automation.zapier.catalog_actions.${action.key}.label`)}</li>
            {/each}
          </ul>
        </section>

        {#if canConnect}
          <Button href={ctaUrl} target="_blank" rel="noopener noreferrer" class="w-full" testId="zapier-app-cta">
            {isConnected ? $t(`${T}.create_zap`, { app: app.name }) : $t('automation.zapier.connect')}
            {#if isConnected}<ArrowRightIcon size={16} />{:else}<ArrowUpRightIcon size={16} />{/if}
          </Button>
        {/if}
      </div>
    {/if}
  </Sheet.Content>
</Sheet.Root>
```

### R10.6 Page (`lib/features/automation/pages/zapier.svelte`, rewrite)

```svelte
<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierAppCatalog from '$features/automation/components/zapier-app-catalog.svelte';
  import ZapierAppSheet from '$features/automation/components/zapier-app-sheet.svelte';
  import ZapierConnectCard from '$features/automation/components/zapier-connect-card.svelte';
  import ZapierConnectionsTable from '$features/automation/components/zapier-connections-table.svelte';
  import ZapierRemoveDialog from '$features/automation/components/zapier-remove-dialog.svelte';
  import ZapierTriggersSheet from '$features/automation/components/zapier-triggers-sheet.svelte';
  import type { ZapierApp, ZapierCatalogCategory, ZapierConnection } from '$features/automation/utils/types';
  import { ZAPIER_APPS } from '$features/automation/utils/zapier-apps';
  import {
    buildZapierCreateUrl,
    getZapierConnectUrl,
    parseZapierCategory,
    ZAPIER_URLS
  } from '$features/automation/utils/zapier-utils';
  import { UpgradeBanner } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const connectUrl = getZapierConnectUrl();
  const isAvailable = Boolean(connectUrl) && !isSelfHosted;

  let loadedOrgId = '';
  let triggersConnection = $state<ZapierConnection | null>(null);
  let removingConnection = $state<ZapierConnection | null>(null);

  const canView = $derived(Boolean($isOrgAdmin) && isAvailable);
  const canConnect = $derived(canView && $hasPublicApiAccess);
  const overview = $derived(zapierApi.overview);
  const connections = $derived(overview?.connections ?? []);
  const isConnected = $derived(connections.length > 0);
  const isPausedByPlan = $derived(isConnected && !$hasPublicApiAccess);

  const catalogQuery = $derived(page.url.searchParams.get('q') ?? '');
  const catalogCategory = $derived(parseZapierCategory(page.url.searchParams.get('category')));
  const showAllApps = $derived(page.url.searchParams.get('view') === 'all');
  const selectedApp = $derived(ZAPIER_APPS.find((app) => app.slug === page.url.searchParams.get('app')) ?? null);

  $effect(() => {
    const organizationId = $currentOrg.id;

    if (!organizationId || organizationId === loadedOrgId) return;

    if (loadedOrgId) {
      resetOrganizationView();
    }

    if (!canView) return;

    loadedOrgId = organizationId;
    void zapierApi.load();
  });

  function resetOrganizationView() {
    triggersConnection = null;
    removingConnection = null;
    zapierApi.resetOrganizationState();
  }

  function updateSearchParams(changes: Record<string, string | null>) {
    const url = new URL(page.url);

    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }

    void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
  }

  function scrollToCatalog() {
    document.getElementById('zapier-apps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function confirmRemove(connection: ZapierConnection) {
    await zapierApi.removeConnection(connection.consentId);
    removingConnection = null;
  }
</script>

<Field.Group class="mx-auto w-full space-y-6">
  {#if isSelfHosted}
    <Alert.Callout
      variant="information"
      title={$t(`${T}.selfhosted.title`)}
      description={$t(`${T}.selfhosted.description`)}
      class="w-full"
    />
  {:else if !isAvailable}
    <Alert.Callout
      variant="information"
      title={$t('automation.tabs.zapier')}
      description={$t('automation.coming_soon')}
      class="w-full"
    />
  {:else}
    <UpgradeBanner visible={!$hasPublicApiAccess}>{$t('upgrade.zapier_required')}</UpgradeBanner>

    {#if !$isOrgAdmin}
      <Alert.Callout
        variant="information"
        title={$t('automation.permissions.disabled_title')}
        description={$t(`${T}.permissions_description`)}
        class="w-full"
      />
    {:else if !overview}
      <div class="space-y-2">
        {#each [0, 1, 2] as index (index)}
          <Skeleton class="h-12 w-full" />
        {/each}
      </div>
    {:else if !isConnected}
      <ZapierConnectCard {connectUrl} {canConnect} onBrowseApps={scrollToCatalog} />

      <Field.Set class="gap-3">
        <Field.Legend>{$t(`${T}.setup.title`)}</Field.Legend>
        <ol class="ui:text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
          <li>{$t(`${T}.setup.step_1`)}</li>
          <li>{$t(`${T}.setup.step_2`)}</li>
          <li>{$t(`${T}.setup.step_3`)}</li>
          <li>{$t(`${T}.setup.step_4`)}</li>
        </ol>
      </Field.Set>
    {:else}
      {#if isPausedByPlan}
        <Alert.Callout
          variant="warning"
          title={$t(`${T}.paused.title`)}
          description={$t(`${T}.paused.description`)}
          class="w-full"
        />
      {:else}
        <Alert.Callout
          variant="success"
          title={$t(`${T}.status.connected_title`)}
          description={$t(`${T}.status.connected_description`, {
            used: overview.limits.activeTriggerSubscriptions,
            max: overview.limits.maxTriggerSubscriptions
          })}
          class="w-full"
        />
      {/if}

      <div class="flex flex-wrap gap-2">
        <Button href={buildZapierCreateUrl(null)} target="_blank" rel="noopener noreferrer" testId="zapier-create-zap">
          {$t(`${T}.create_zap`)}
          <ArrowUpRightIcon size={16} />
        </Button>
        <Button variant="outline" href={ZAPIER_URLS.connections} target="_blank" rel="noopener noreferrer">
          {$t(`${T}.manage_on_zapier`)}
          <ArrowUpRightIcon size={16} />
        </Button>
      </div>

      <Field.Set class="gap-3">
        <Field.Legend>{$t(`${T}.connections.title`)}</Field.Legend>
        <Field.Description>{$t(`${T}.connections.description`)}</Field.Description>
        <ZapierConnectionsTable
          {connections}
          canManage={Boolean($isOrgAdmin)}
          onViewTriggers={(connection) => (triggersConnection = connection)}
          onRemove={(connection) => (removingConnection = connection)}
        />
      </Field.Set>
    {/if}
  {/if}

  {#if !isSelfHosted}
    <ZapierAppCatalog
      query={catalogQuery}
      category={catalogCategory}
      showAll={showAllApps}
      onQueryChange={(query) => updateSearchParams({ q: query || null })}
      onCategoryChange={(category: ZapierCatalogCategory) =>
        updateSearchParams({ category: category === 'all' ? null : category })}
      onShowAll={() => updateSearchParams({ view: 'all' })}
      onSelectApp={(app: ZapierApp) => updateSearchParams({ app: app.slug })}
    />
  {/if}
</Field.Group>

<ZapierTriggersSheet connection={triggersConnection} onClose={() => (triggersConnection = null)} />
<ZapierRemoveDialog
  connection={removingConnection}
  isRemoving={zapierApi.isLoading}
  onConfirm={confirmRemove}
  onClose={() => (removingConnection = null)}
/>
<ZapierAppSheet
  app={selectedApp}
  {isConnected}
  {canConnect}
  {connectUrl}
  onClose={() => updateSearchParams({ app: null })}
/>
```

Check `Alert.Callout`'s supported variants in `packages/ui` and use the nearest ones if `success` or `warning` are named differently.

### R10.7 Route wrapper (`routes/(app)/org/[slug]/automation/zapier/+page.svelte`)

```svelte
<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  import { ZapierAutomationPage } from '$features/automation/pages';
  import { ZAPIER_HELP_URL } from '$features/automation/utils/automation-utils';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head><title>{t.get('automation.tabs.zapier')} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('automation.tabs.zapier')}</Page.Title>
    <Page.Subtitle>{$t('automation.zapier.page_subtitle')}</Page.Subtitle>
  </Page.HeaderContent>
  <Page.Action>
    <Button
      variant="secondary"
      href={ZAPIER_HELP_URL}
      target="_blank"
      rel="noopener noreferrer"
      testId="automation-zapier-read-docs"
    >
      <ArrowUpRightIcon size={16} />
      {$t('automation.read_docs')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>{#snippet child()}<ZapierAutomationPage />{/snippet}</Page.Body>
```

### R10.8 Deltas to [#1435](https://github.com/classroomio/classroomio/pull/1435)'s OAuth screens

API side, in `apps/api/src/routes/oauth/oauth.ts`:

```ts
  .get('/clients/:clientId', authMiddleware, zValidator('param', ZOAuthClientParam), (c) => {
    const { clientId } = c.req.valid('param');

    return c.json({ success: true, data: getOAuthClientTrustService(clientId) }, 200);
  })
```

with `ZOAuthClientParam = z.object({ clientId: z.string().min(1).max(255) })` in `validation/organization/oauth.ts` and, in `services/oauth/oauth.ts`:

```ts
export function getOAuthClientTrustService(clientId: string) {
  return { clientId, trusted: isTrustedOAuthClient(clientId), kind: getConnectedAppKind(clientId) };
}
```

`lib/features/oauth/utils/types.ts`: add `GetOAuthClientTrustRequest = (typeof classroomio.oauth)['clients'][':clientId']['$get']`, its success and data types, and `'webhooks'` to `OAuthScopeGroupKey`.

`lib/features/oauth/utils/oauth-scopes.ts`: add `['webhook:', 'webhooks']` to `SCOPE_GROUP_PREFIXES`, and:

```ts
export const OAUTH_RESOURCE_PARAM = 'resource';

export function getOAuthResource(searchParams: URLSearchParams): string | undefined {
  return searchParams.get(OAUTH_RESOURCE_PARAM) ?? undefined;
}
```

`lib/features/oauth/api/oauth.svelte.ts`:

```ts
  clientTrust = $state<OAuthClientTrust | null>(null);

  async listOrganizations(resource?: string) {
    return this.execute<ListOAuthOrganizationsRequest>({
      requestFn: () => classroomio.oauth.organizations.$get({ query: resource ? { resource } : {} }),
      logContext: 'listing OAuth organizations',
      onSuccess: (response) => {
        this.organizations = response.data;
      }
    });
  }

  async loadClientTrust(clientId: string) {
    return this.execute<GetOAuthClientTrustRequest>({
      requestFn: () => classroomio.oauth.clients[':clientId'].$get({ param: { clientId } }),
      logContext: 'loading OAuth client trust',
      onSuccess: (response) => {
        this.clientTrust = response.data;
      }
    });
  }
```

`routes/(auth)/oauth/select-organization/+page.svelte`, the changed parts:

```svelte
<script lang="ts">
  // …existing imports, plus:
  import { getOAuthResource } from '$features/oauth/utils/oauth-scopes';

  const eligibleOrganizations = $derived((oauthApi.organizations ?? []).filter((organization) => organization.eligible));

  onMount(async () => {
    const clientId = page.url.searchParams.get('client_id');
    if (clientId) await oauthApi.loadClient(clientId);

    await oauthApi.listOrganizations(getOAuthResource(page.url.searchParams));

    if (!oauthApi.organizations) {
      oauthApi.error = 'oauth.error.generic';

      return;
    }

    if (oauthApi.organizations.length === 1 && eligibleOrganizations.length === 1) {
      await chooseOrganization(eligibleOrganizations[0].id);
    }
  });
</script>

<!-- inside the organization list -->
<Button
  type="button"
  variant="outline"
  class="h-auto justify-start gap-3 py-3"
  disabled={oauthApi.isLoading || !organization.eligible}
  onclick={() => chooseOrganization(organization.id)}
  testId="oauth-select-organization-{organization.id}"
>
  <Avatar.Root>
    <Avatar.Image src={organization.avatarUrl ?? '/logo-192.png'} alt={organization.name} />
    <Avatar.Fallback>{organization.name.slice(0, 2)}</Avatar.Fallback>
  </Avatar.Root>
  <span class="flex flex-col items-start">
    <span class="font-medium">{organization.name}</span>
    {#if organization.reason === 'plan'}
      <span class="ui:text-muted-foreground text-xs">{$t('oauth.select_organization.plan_required')}</span>
    {/if}
  </span>
</Button>
```

The `// …` and `<!-- -->` lines mark where the snippet goes; they are not code to commit.

`routes/(auth)/oauth/consent/+page.svelte`: load trust next to the client (`oauthApi.loadClientTrust(clientId)` inside the existing `Promise.all`), and under the title:

```svelte
{#if oauthApi.clientTrust?.trusted}
  <Badge variant="secondary" class="mx-auto">{$t('oauth.consent.verified')}</Badge>
{/if}
```

### R10.9 MCP tab excludes Zapier

In `lib/features/automation/pages/mcp.svelte` (or [#1436](https://github.com/classroomio/classroomio/pull/1436)'s Connections tab), list only generic apps:

```ts
const connectedApps = $derived(automationApi.connectedApps.filter((app) => app.kind === 'app'));
```

and render `connectedApps` wherever the page used `automationApi.connectedApps`.

### R10.10 Translations (`lib/utils/translations/en.json`)

Then run `cd apps/dashboard && pnpm translate` and check every `{placeholder}` in the other locales.

```json
{
  "automation": {
    "subtitle": "Connect AI tools, your own code and thousands of apps to your academy.",
    "zapier": {
      "page_subtitle": "Automate ClassroomIO with thousands of apps through Zapier.",
      "permissions_description": "Only organization admins can connect Zapier and manage its connections.",
      "connect": "Connect on Zapier",
      "browse_apps": "Browse apps",
      "create_zap": "Create a Zap",
      "manage_on_zapier": "Manage on Zapier",
      "empty": {
        "title": "Connect ClassroomIO to Zapier",
        "description": "Approve access once, then build Zaps on Zapier that react to your courses and students in seconds."
      },
      "setup": {
        "title": "How connecting works",
        "step_1": "Open Zapier and add ClassroomIO to a Zap.",
        "step_2": "Sign in to ClassroomIO when Zapier asks.",
        "step_3": "Choose this organization and allow access.",
        "step_4": "Pick a trigger or action and turn your Zap on."
      },
      "status": {
        "connected_title": "Connected to Zapier",
        "connected_description": "{used} of {max} trigger subscriptions in use. Events reach Zapier within seconds."
      },
      "paused": {
        "title": "Zapier is paused",
        "description": "Your plan no longer includes Zapier. Zaps fail until you upgrade; your connections stay in place."
      },
      "selfhosted": {
        "title": "Zapier is available on ClassroomIO Cloud",
        "description": "On a self-hosted install, use Webhooks with Zapier's Webhooks by Zapier trigger, and API keys for actions."
      },
      "connections": {
        "title": "Connections",
        "description": "Each row is an admin who connected a Zapier account to this organization.",
        "authorized_by": "Connected by",
        "unknown_admin": "Former admin",
        "access": "Access",
        "access_read_write": "Read and write",
        "access_read_only": "Read only",
        "triggers": "Active triggers",
        "last_used": "Last used",
        "connected": "Connected",
        "actions": "Connection actions",
        "view_triggers": "View triggers",
        "remove": "Remove access"
      },
      "remove": {
        "title": "Remove Zapier access?",
        "description": "Zaps using this connection stop right away and {count} trigger subscriptions are deleted. Reconnect in Zapier to use them again.",
        "confirm": "Remove access"
      },
      "triggers": {
        "title": "Active triggers",
        "description": "Zaps that are on and listening for ClassroomIO events.",
        "empty_title": "No active triggers",
        "empty_description": "Triggers appear here when a Zap that starts in ClassroomIO is turned on.",
        "course_filter": "Only for {course}",
        "last_delivery": "Last event sent {date}",
        "no_deliveries": "No events sent yet",
        "health_healthy": "Healthy",
        "health_degraded": "Failing",
        "health_disabled": "Disabled"
      },
      "catalog": {
        "title": "Apps that work with ClassroomIO",
        "description": "Popular ways teams connect ClassroomIO through Zapier.",
        "search_placeholder": "Search apps",
        "no_results": "No apps match. Zapier connects ClassroomIO to 6,000+ apps; search for any of them on Zapier.",
        "show_all": "Show all apps",
        "end_note": "These are popular picks. Zapier connects ClassroomIO to 6,000+ apps.",
        "categories": {
          "all": "All",
          "crm": "CRM",
          "marketing": "Marketing",
          "communication": "Communication",
          "customer-support": "Customer support",
          "sales": "Scheduling",
          "productivity": "Productivity",
          "forms": "Forms",
          "analytics": "Analytics",
          "community": "Community"
        }
      },
      "app_sheet": {
        "title": "ClassroomIO + {app}",
        "examples": "Popular automations",
        "triggers": "ClassroomIO triggers",
        "actions": "ClassroomIO actions",
        "create_zap": "Create a {app} Zap"
      },
      "catalog_triggers": {
        "new_course_enrollment": { "label": "New course enrollment" },
        "course_member_removed": { "label": "Student removed from course" },
        "course_completed": { "label": "Course completed" },
        "new_certificate": { "label": "New certificate" },
        "new_submission": { "label": "New exercise submission" },
        "submission_status_changed": { "label": "Submission status changed" },
        "lesson_completed": { "label": "Lesson completed" },
        "course_invite_accepted": { "label": "Course invite accepted" },
        "new_payment_request": { "label": "New payment request" },
        "new_organization_member": { "label": "New organization member" },
        "compliance_status_changed": { "label": "Compliance status changed" },
        "course_published": { "label": "Course published" },
        "live_session_scheduled": { "label": "Live session scheduled" },
        "new_cohort_member": { "label": "New cohort member" }
      },
      "catalog_actions": {
        "enroll_student": { "label": "Enroll student in course" },
        "add_student": { "label": "Add student to organization" },
        "update_student": { "label": "Update student" },
        "remove_student": { "label": "Remove student from organization" },
        "remove_course_member": { "label": "Remove student from course" },
        "send_course_invite": { "label": "Send course invite" },
        "revoke_course_invite": { "label": "Revoke course invite" },
        "reset_course_progress": { "label": "Reset student course progress" },
        "mark_lesson_complete": { "label": "Mark lesson complete" },
        "add_cohort_member": { "label": "Add student to cohort" },
        "post_cohort_announcement": { "label": "Post to cohort feed" }
      },
      "apps": {
        "hubspot": {
          "description": "CRM and customer platform",
          "trigger_example": "When a customer completes onboarding, update their HubSpot contact.",
          "action_example": "When a HubSpot deal closes, enroll the buyer in your onboarding course."
        },
        "salesforce": {
          "description": "CRM for sales and service teams",
          "trigger_example": "When a certificate is issued, log it on the Salesforce contact.",
          "action_example": "When an opportunity is won, enroll the account's users in product training."
        },
        "mailchimp": {
          "description": "Email marketing and audiences",
          "trigger_example": "When a student enrolls, add them to a Mailchimp audience.",
          "action_example": "When someone joins a Mailchimp list, invite them to your academy."
        },
        "customerio": {
          "description": "Messaging and lifecycle campaigns",
          "trigger_example": "When a student completes a lesson, send a Customer.io event to nudge the next one.",
          "action_example": "When a Customer.io segment changes, enroll its people in a course."
        },
        "slack": {
          "description": "Team communication and collaboration",
          "trigger_example": "When an exercise is submitted, message the tutor in Slack.",
          "action_example": "When a message is posted in a Slack channel, share it on a cohort feed."
        },
        "teams": {
          "description": "Chat and channels for your organization",
          "trigger_example": "When someone completes a course, celebrate it in a Teams channel.",
          "action_example": "When a Teams message is flagged, post it to a cohort feed."
        },
        "google_meet": {
          "description": "Video meetings in Google Workspace",
          "trigger_example": "When a live session is scheduled, create a Google Meet link and calendar invite.",
          "action_example": "When a Meet session ends, mark the lesson complete for attendees."
        },
        "zoom": {
          "description": "Video meetings and webinars",
          "trigger_example": "When a student enrolls, register them for your Zoom webinar.",
          "action_example": "When someone attends a Zoom webinar, mark the lesson complete."
        },
        "zendesk": {
          "description": "Customer support and ticketing",
          "trigger_example": "When a compliance record becomes overdue, open a Zendesk ticket.",
          "action_example": "When a ticket is tagged training, enroll the requester in a help course."
        },
        "intercom": {
          "description": "Customer messaging platform",
          "trigger_example": "When a customer completes a course, tag them in Intercom.",
          "action_example": "When an Intercom user signs up, enroll them in getting-started training."
        },
        "calendly": {
          "description": "Scheduling and booking links",
          "trigger_example": "When a student completes a course, send a Calendly link to book a review.",
          "action_example": "When a Calendly meeting is booked, enroll the invitee in a prep course."
        },
        "calcom": {
          "description": "Open-source scheduling and booking links",
          "trigger_example": "When a student completes a course, offer a Cal.com booking for a follow-up.",
          "action_example": "When a Cal.com booking is created, enroll the attendee in a prep course."
        },
        "sheets": {
          "description": "Spreadsheets and data management",
          "trigger_example": "When a certificate is issued, add a row to your training log in Google Sheets.",
          "action_example": "When a row is added to a sheet, invite that person to your academy."
        },
        "notion": {
          "description": "Docs, wikis and project notes",
          "trigger_example": "When a course is published, add it to your Notion training catalog.",
          "action_example": "When a Notion database item is added, send a course invite."
        },
        "confluence": {
          "description": "Docs and wikis for technical teams",
          "trigger_example": "When a course is published, create a Confluence page linking to it.",
          "action_example": "When a Confluence page is created, invite its watchers to the related course."
        },
        "typeform": {
          "description": "Forms and surveys",
          "trigger_example": "When a student completes a course, send them a Typeform survey.",
          "action_example": "When a Typeform is submitted, enroll the respondent in a course."
        },
        "jotform": {
          "description": "Forms and surveys",
          "trigger_example": "When a student completes a course, send a Jotform feedback form.",
          "action_example": "When a Jotform is submitted, enroll the respondent in a course."
        },
        "pendo": {
          "description": "Digital adoption and product usage",
          "trigger_example": "When a customer completes training, record it in Pendo.",
          "action_example": "When Pendo flags low feature adoption, enroll the user in a course."
        },
        "mixpanel": {
          "description": "Product analytics and funnels",
          "trigger_example": "When a student completes a lesson, send an event to Mixpanel.",
          "action_example": "When a Mixpanel cohort changes, enroll its users in a course."
        },
        "circle": {
          "description": "Community spaces and discussion",
          "trigger_example": "When a student enrolls, add them to your Circle community.",
          "action_example": "When someone joins a Circle space, add them to a cohort."
        }
      }
    }
  },
  "oauth": {
    "consent": { "verified": "Verified" },
    "select_organization": { "plan_required": "Upgrade to Early Adopter to connect this app" },
    "scope_group": {
      "webhooks": {
        "read": "See recent events in your workspace",
        "write": "Receive events as they happen in your workspace"
      }
    }
  },
  "upgrade": {
    "zapier_required": "Zapier requires the Early Adopter or Enterprise plan."
  },
  "snackbar": {
    "zapier": { "removed": "Zapier access removed" }
  }
}
```

Merge these keys into the existing objects; don't replace them.

---

## R11. Zapier app

All paths below are under `apps/zapier/`. The app talks only to the public API and [#1435](https://github.com/classroomio/classroomio/pull/1435)'s OAuth endpoints; it imports `@cio/utils` for the catalog, event types and examples, and esbuild bundles them in.

### R11.1 Package (`package.json`)

```json
{
  "name": "@cio/zapier",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "node scripts/build.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "validate": "pnpm build && zapier-platform validate",
    "use:staging": "node scripts/use-integration.mjs staging",
    "use:production": "node scripts/use-integration.mjs production",
    "zapier:push": "pnpm build && zapier-platform push",
    "zapier:promote": "zapier-platform promote"
  },
  "dependencies": {
    "zapier-platform-core": "19.2.1"
  },
  "devDependencies": {
    "@cio/utils": "workspace:*",
    "esbuild": "<repo version>",
    "nock": "<current>",
    "typescript": "<repo version>",
    "vitest": "<repo version>",
    "zapier-platform-cli": "19.2.1"
  }
}
```

Pin `zapier-platform-core` and `zapier-platform-cli` to the same release, the newest one older than the pnpm cooldown when the PR is opened (19.2.1 on 2026-10-30). Reuse the repo's existing versions of esbuild, typescript and vitest. The spike (§16.8) confirms Zapier loads an ESM bundle; if it doesn't, switch `format` to `cjs` and drop `"type": "module"`.

Add `apps/zapier/.zapierapprc` and `apps/zapier/dist/` to `.gitignore`.

### R11.2 Build and integration selection (`scripts/`)

`scripts/build.mjs`:

```js
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  sourcemap: false,
  external: ['zapier-platform-core']
});
```

`scripts/use-integration.mjs` writes the `.zapierapprc` the CLI reads, from `ZAPIER_INTEGRATION_ID_STAGING` or `ZAPIER_INTEGRATION_ID_PRODUCTION`:

```js
import { writeFileSync } from 'node:fs';

const ENVIRONMENTS = { staging: 'ZAPIER_INTEGRATION_ID_STAGING', production: 'ZAPIER_INTEGRATION_ID_PRODUCTION' };
const environment = process.argv[2];
const variable = ENVIRONMENTS[environment];

if (!variable) {
  throw new Error(`Usage: use-integration.mjs <${Object.keys(ENVIRONMENTS).join('|')}>`);
}

const id = Number(process.env[variable]);

if (!Number.isInteger(id)) {
  throw new Error(`Set ${variable} to the integration id from the Zapier developer platform`);
}

writeFileSync(new URL('../.zapierapprc', import.meta.url), JSON.stringify({ id, key: `App${id}` }, null, 2));
console.log(`Using the ${environment} Zapier integration (App${id})`);
```

### R11.3 App definition (`src/index.ts`)

```ts
import { defineApp, version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };
import { authentication } from './authentication';
import { creates } from './creates';
import { hydrators } from './hydrators';
import { addRequestHeaders, handleApiErrors } from './lib/http';
import { searches } from './searches';
import { dropdownTriggers } from './triggers/dropdowns';
import { eventTriggers } from './triggers/events';

const byKey = <T extends { key: string }>(items: readonly T[]) =>
  Object.fromEntries(items.map((item) => [item.key, item]));

export default defineApp({
  version: packageJson.version,
  platformVersion,
  authentication,
  beforeRequest: [addRequestHeaders],
  afterResponse: [handleApiErrors],
  hydrators,
  triggers: byKey([...eventTriggers, ...dropdownTriggers]),
  creates: byKey(creates),
  searches: byKey(searches),
  searchOrCreates: {
    find_student: {
      key: 'find_student',
      display: {
        label: 'Find or Create Student',
        description: 'Finds a student by email, or invites them to your organization if they are new.'
      },
      search: 'find_student',
      create: 'add_student'
    }
  }
});
```

### R11.4 Configuration and authentication

`src/lib/config.ts` (Zapier env vars are set per version with `zapier-platform env:set <version> KEY=value`):

```ts
import { PUBLIC_API_PATH } from './paths';

function readOrigin(name: 'CIO_APP_ORIGIN' | 'CIO_API_ORIGIN'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set for this integration version`);
  }

  return value.replace(/\/$/, '');
}

export const appOrigin = () => readOrigin('CIO_APP_ORIGIN');
export const apiOrigin = () => readOrigin('CIO_API_ORIGIN');
export const publicApiResource = () => `${apiOrigin()}${PUBLIC_API_PATH}`;
export const oauthUrl = (endpoint: 'authorize' | 'token') => `${appOrigin()}/api/auth/oauth2/${endpoint}`;
export const apiUrl = (path: string) => `${publicApiResource()}${path}`;
```

`src/lib/paths.ts`:

```ts
export const PUBLIC_API_PATH = '/public-api/v1';
```

`src/authentication.ts`:

```ts
import type { Authentication } from 'zapier-platform-core';
import { ZAPIER_OAUTH_SCOPES } from '@cio/utils/constants/zapier';

import { apiUrl, oauthUrl, publicApiResource } from './lib/config';

const SCOPE = ZAPIER_OAUTH_SCOPES.join(' ');

export const authentication: Authentication = {
  type: 'oauth2',
  oauth2Config: {
    authorizeUrl: {
      url: '{{process.env.CIO_APP_ORIGIN}}/api/auth/oauth2/authorize',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
        state: '{{bundle.inputData.state}}',
        scope: SCOPE,
        resource: '{{process.env.CIO_API_ORIGIN}}/public-api/v1'
      }
    },
    getAccessToken: async (z, bundle) => {
      const response = await z.request({
        url: oauthUrl('token'),
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: {
          grant_type: 'authorization_code',
          code: bundle.inputData.code,
          redirect_uri: bundle.inputData.redirect_uri,
          code_verifier: bundle.inputData.code_verifier,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          resource: publicApiResource()
        }
      });

      return { access_token: response.data.access_token, refresh_token: response.data.refresh_token };
    },
    refreshAccessToken: async (z, bundle) => {
      const response = await z.request({
        url: oauthUrl('token'),
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: {
          grant_type: 'refresh_token',
          refresh_token: bundle.authData.refresh_token,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          resource: publicApiResource()
        }
      });

      return { access_token: response.data.access_token, refresh_token: response.data.refresh_token };
    },
    scope: SCOPE,
    autoRefresh: true,
    enablePkce: true
  },
  test: { url: apiUrl('/me') },
  connectionLabel: '{{json.data.organization.name}}'
};
```

`authorizeUrl` uses Zapier's `{{process.env.…}}` templating because Zapier renders it before any app code runs. The spike (§16.1) confirms the PKCE input name Zapier passes to `getAccessToken`; `code_verifier` is the expected one.

### R11.5 HTTP middleware (`src/lib/http.ts`)

```ts
import type { Bundle, HttpRequestOptions, HttpResponse, ZObject } from 'zapier-platform-core';

import packageJson from '../../package.json' with { type: 'json' };

const USER_AGENT = `ClassroomIO-Zapier/${packageJson.version}`;
const PLAN_REQUIRED_MESSAGE =
  "This ClassroomIO organization's plan doesn't include Zapier. Upgrade to Early Adopter or Enterprise to resume your Zaps.";
const DEFAULT_RETRY_AFTER_SECONDS = 60;

type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  field?: string;
  retryAfter?: number;
};

export function addRequestHeaders(request: HttpRequestOptions, _z: ZObject, bundle: Bundle) {
  request.headers = {
    ...request.headers,
    Accept: 'application/json',
    'User-Agent': USER_AGENT
  };

  if (bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }

  return request;
}

function readErrorBody(response: HttpResponse): ApiErrorBody {
  try {
    return (response.data ?? {}) as ApiErrorBody;
  } catch {
    return {};
  }
}

function readRetryAfterSeconds(response: HttpResponse, body: ApiErrorBody): number {
  const header = Number(response.getHeader('retry-after'));

  if (Number.isFinite(header) && header > 0) return header;

  return body.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS;
}

export function handleApiErrors(response: HttpResponse, z: ZObject) {
  if (response.status < 400 || response.skipThrowForStatus) return response;

  const body = readErrorBody(response);
  const message = body.error ?? body.message ?? `ClassroomIO responded with HTTP ${response.status}`;

  if (response.status === 401) {
    throw new z.errors.RefreshAuthError(message);
  }

  if (response.status === 403 && body.code === 'UPGRADE_REQUIRED') {
    throw new z.errors.Error(PLAN_REQUIRED_MESSAGE, 'PlanRequired', 403);
  }

  if (response.status === 429) {
    throw new z.errors.ThrottledError(message, readRetryAfterSeconds(response, body));
  }

  if (response.status === 400 && body.field) {
    throw new z.errors.Error(`${body.field}: ${message}`, body.code ?? 'InvalidInput', 400);
  }

  throw new z.errors.Error(message, body.code ?? `Http${response.status}`, response.status);
}
```

Check the exact names `Authentication`, `HttpRequestOptions`, `HttpResponse`, `response.skipThrowForStatus` and `getHeader` against the installed `zapier-platform-core` types; they exist in v19's `types/custom.d.ts` and `types/functions.d.ts` under these or near-identical names.

### R11.6 Event triggers

`src/lib/records.ts`:

```ts
export type EventEnvelope = {
  id: string;
  type: string;
  createdAt: string;
  apiVersion: string;
  organization: { id: string; name: string | null; siteName: string | null };
  data: Record<string, unknown>;
};

export type EventRecord = Record<string, unknown> & { id: string };

export function toEventRecord(envelope: EventEnvelope): EventRecord {
  return {
    ...envelope.data,
    id: envelope.id,
    event_type: envelope.type,
    occurred_at: envelope.createdAt,
    organization: envelope.organization
  };
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0);

  const single = readString(value);

  return single ? [single] : [];
}
```

`src/lib/signature.ts` (Standard Webhooks, matching `packages/core/src/services/webhook/signature.ts`):

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET_PREFIX = 'whsec_';
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

function readHeader(headers: Record<string, string>, name: string): string | undefined {
  const wanted = [name, `http-${name}`];
  const entry = Object.entries(headers).find(([key]) => wanted.includes(key.toLowerCase()));

  return entry?.[1];
}

function toSigningKey(secret: string): Buffer {
  return secret.startsWith(SECRET_PREFIX)
    ? Buffer.from(secret.slice(SECRET_PREFIX.length), 'base64')
    : Buffer.from(secret, 'utf8');
}

/**
 * True when one `webhook-signature` entry is a valid v1 HMAC of the raw body and the timestamp is fresh.
 */
export function isValidWebhookSignature(
  secret: string,
  headers: Record<string, string>,
  body: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean {
  const id = readHeader(headers, 'webhook-id');
  const timestamp = readHeader(headers, 'webhook-timestamp');
  const signatures = readHeader(headers, 'webhook-signature');

  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_TIMESTAMP_SKEW_SECONDS) return false;

  const expected = createHmac('sha256', toSigningKey(secret)).update(`${id}.${timestamp}.${body}`).digest();

  return signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',');

    if (version !== 'v1' || !value) return false;

    const candidate = Buffer.from(value, 'base64');

    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}
```

Zapier may prefix raw request headers with `Http-`, hence the two names in `readHeader`; the spike (§16.6) confirms the exact form.

`src/lib/fields.ts`:

```ts
import { defineInputField } from 'zapier-platform-core';

export const courseFilterField = defineInputField({
  key: 'courseId',
  label: 'Course',
  dynamic: 'course_list.id.title',
  required: false,
  helpText: 'Only trigger for this course. Leave empty to trigger for every course.'
});

export const cohortFilterField = defineInputField({
  key: 'cohortId',
  label: 'Cohort',
  dynamic: 'cohort_list.id.name',
  required: false,
  helpText: 'Only trigger for this cohort. Leave empty to trigger for every cohort.'
});

export const sourceFilterField = defineInputField({
  key: 'source',
  label: 'How They Joined',
  required: false,
  list: true,
  choices: {
    invite: 'Course invite',
    invite_link: 'Invite link',
    self_enroll: 'Self-enrollment',
    admin: 'Added by an admin or tutor',
    api: 'API or Zapier'
  },
  helpText: 'Only trigger for these ways of joining. Leave empty to trigger for all of them.'
});

export const roleFilterField = defineInputField({
  key: 'role',
  label: 'Role',
  required: false,
  choices: { student: 'Student', tutor: 'Tutor', admin: 'Admin' },
  helpText: 'Only trigger for this role. Leave empty to trigger for everyone.'
});

export const courseField = defineInputField({
  key: 'courseId',
  label: 'Course',
  dynamic: 'course_list.id.title',
  required: true,
  altersDynamicFields: true
});

export const cohortField = defineInputField({
  key: 'cohortId',
  label: 'Cohort',
  dynamic: 'cohort_list.id.name',
  required: true
});

export const studentEmailField = defineInputField({
  key: 'email',
  label: 'Student Email',
  type: 'string',
  required: true
});

export const sendEmailField = defineInputField({
  key: 'sendEmail',
  label: 'Send Email',
  type: 'boolean',
  default: 'true',
  required: false,
  helpText: 'Email the student about this change.'
});
```

`src/lib/event-trigger.ts`:

```ts
import { defineInputFields, defineTrigger, type Bundle, type ZObject } from 'zapier-platform-core';
import type { TZapierTrigger } from '@cio/utils/constants/zapier';
import { buildWebhookExampleEnvelope } from '@cio/utils/validation/webhook';

import { apiUrl } from './config';
import { readString, toEventRecord, type EventEnvelope, type EventRecord } from './records';
import { isValidWebhookSignature } from './signature';

type SubscribeData = { id: string; secret: string };
type InputFields = ReturnType<typeof defineInputFields>;

export type EventMatcher = (data: Record<string, unknown>, inputData: Record<string, unknown>) => boolean;
export type EventTransform = (z: ZObject, record: EventRecord) => EventRecord;

export type EventTriggerOptions = {
  trigger: TZapierTrigger;
  important?: boolean;
  inputFields?: InputFields;
  matches?: EventMatcher;
  transform?: EventTransform;
};

const SAMPLE_ORGANIZATION = { id: '000000a1-0000-4000-8000-0000000000a1', name: 'Acme Academy', siteName: 'acme' };
const keepRecord: EventTransform = (_z, record) => record;
const matchesAll: EventMatcher = () => true;

function isAuthenticDelivery(bundle: Bundle): boolean {
  const subscribeData = bundle.subscribeData as SubscribeData | undefined;
  const headers = bundle.rawRequest?.headers;
  const body = bundle.rawRequest?.content;

  if (!subscribeData?.secret || !headers || body === undefined) return false;

  return isValidWebhookSignature(subscribeData.secret, headers, body);
}

export function createEventTrigger(options: EventTriggerOptions) {
  const { trigger } = options;
  const matches = options.matches ?? matchesAll;
  const transform = options.transform ?? keepRecord;
  const sample = toEventRecord(buildWebhookExampleEnvelope(trigger.eventType, SAMPLE_ORGANIZATION));

  return defineTrigger({
    key: trigger.key,
    noun: trigger.noun,
    display: { label: trigger.label, description: trigger.description, important: options.important ?? false },
    operation: {
      type: 'hook',
      inputFields: options.inputFields ?? [],
      performSubscribe: async (z, bundle) => {
        const response = await z.request({
          url: apiUrl('/webhooks/subscriptions'),
          method: 'POST',
          body: {
            targetUrl: bundle.targetUrl,
            eventType: trigger.eventType,
            courseId: readString(bundle.inputData.courseId),
            cohortId: readString(bundle.inputData.cohortId)
          }
        });
        const subscription = response.data.data as SubscribeData;

        return { id: subscription.id, secret: subscription.secret };
      },
      performUnsubscribe: async (z, bundle) => {
        const response = await z.request({
          url: apiUrl(`/webhooks/subscriptions/${bundle.subscribeData?.id}`),
          method: 'DELETE',
          skipThrowForStatus: true
        });

        if (response.status !== 404) response.throwForStatus();

        return {};
      },
      perform: async (z, bundle) => {
        const envelope = bundle.cleanedRequest as EventEnvelope | undefined;

        if (!envelope || envelope.type !== trigger.eventType || !isAuthenticDelivery(bundle)) return [];
        if (!matches(envelope.data, bundle.inputData)) return [];

        return [transform(z, toEventRecord(envelope))];
      },
      performList: async (z, bundle) => {
        const response = await z.request({
          url: apiUrl('/webhooks/samples'),
          params: {
            eventType: trigger.eventType,
            ...(readString(bundle.inputData.courseId) ? { courseId: String(bundle.inputData.courseId) } : {}),
            ...(readString(bundle.inputData.cohortId) ? { cohortId: String(bundle.inputData.cohortId) } : {})
          }
        });
        const envelopes = response.data.data as EventEnvelope[];

        return envelopes
          .filter((envelope) => matches(envelope.data, bundle.inputData))
          .map((envelope) => transform(z, toEventRecord(envelope)));
      },
      sample
    }
  });
}
```

`src/triggers/events.ts`:

```ts
import { ZAPIER_TRIGGERS, type TZapierTriggerKey } from '@cio/utils/constants/zapier';

import { attachCertificateFile } from '../hydrators';
import { createEventTrigger, type EventMatcher, type EventTriggerOptions } from '../lib/event-trigger';
import { cohortFilterField, courseFilterField, roleFilterField, sourceFilterField } from '../lib/fields';
import { readString, readStringList } from '../lib/records';

const matchesSource: EventMatcher = (data, inputData) => {
  const wanted = readStringList(inputData.source);
  const source = data.source as { method?: string } | undefined;

  return wanted.length === 0 || wanted.includes(source?.method ?? '');
};

const matchesRole: EventMatcher = (data, inputData) => {
  const wanted = readString(inputData.role);

  return !wanted || data.role === wanted;
};

const matchesCompletedLesson: EventMatcher = (data) => data.isComplete === true;

const TRIGGER_OPTIONS: Record<TZapierTriggerKey, Omit<EventTriggerOptions, 'trigger'>> = {
  new_course_enrollment: { important: true, inputFields: [courseFilterField, sourceFilterField], matches: matchesSource },
  course_member_removed: { inputFields: [courseFilterField] },
  course_completed: { important: true, inputFields: [courseFilterField] },
  new_certificate: { important: true, inputFields: [courseFilterField], transform: attachCertificateFile },
  new_submission: { important: true, inputFields: [courseFilterField] },
  submission_status_changed: { inputFields: [courseFilterField] },
  lesson_completed: { inputFields: [courseFilterField], matches: matchesCompletedLesson },
  course_invite_accepted: { inputFields: [courseFilterField] },
  new_payment_request: { inputFields: [courseFilterField] },
  new_organization_member: { inputFields: [roleFilterField], matches: matchesRole },
  compliance_status_changed: { inputFields: [courseFilterField] },
  course_published: {},
  live_session_scheduled: { inputFields: [courseFilterField] },
  new_cohort_member: { inputFields: [cohortFilterField] }
};

export const eventTriggers = ZAPIER_TRIGGERS.map((trigger) =>
  createEventTrigger({ trigger, ...TRIGGER_OPTIONS[trigger.key] })
);
```

Course and cohort filters are applied by the server at fan-out (R4.2), so `matches` only handles the filters the server doesn't know.

`src/triggers/dropdowns.ts`:

```ts
import { defineTrigger } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';

const PAGE_SIZE = 100;

type Option = { id: string; label: string };

export const courseListTrigger = defineTrigger({
  key: 'course_list',
  noun: 'Course',
  display: { label: 'List Courses', description: 'Lists courses for dropdowns.', hidden: true },
  operation: {
    canPaginate: true,
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl('/courses'),
        params: { page: String(bundle.meta.page + 1), limit: String(PAGE_SIZE) }
      });

      return (response.data.data as Array<{ id: string; title: string }>).map(({ id, title }) => ({ id, title }));
    }
  }
});

export const cohortListTrigger = defineTrigger({
  key: 'cohort_list',
  noun: 'Cohort',
  display: { label: 'List Cohorts', description: 'Lists cohorts for dropdowns.', hidden: true },
  operation: {
    canPaginate: true,
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl('/cohorts'),
        params: { page: String(bundle.meta.page + 1), limit: String(PAGE_SIZE) }
      });

      return (response.data.data as Array<{ id: string; name: string }>).map(({ id, name }) => ({ id, name }));
    }
  }
});

export const lessonListTrigger = defineTrigger({
  key: 'lesson_list',
  noun: 'Lesson',
  display: { label: 'List Lessons', description: 'Lists the lessons of the selected course.', hidden: true },
  operation: {
    perform: async (z, bundle) => {
      if (!bundle.inputData.courseId) return [];

      const response = await z.request({ url: apiUrl(`/courses/${bundle.inputData.courseId}/lessons`) });

      return (response.data.data as Array<{ id: string; title: string }>).map(({ id, title }) => ({ id, title }));
    }
  }
});

export const courseInviteListTrigger = defineTrigger({
  key: 'course_invite_list',
  noun: 'Invite',
  display: { label: 'List Course Invites', description: 'Lists pending invites of the selected course.', hidden: true },
  operation: {
    perform: async (z, bundle) => {
      if (!bundle.inputData.courseId) return [];

      const response = await z.request({ url: apiUrl(`/courses/${bundle.inputData.courseId}/invites`) });
      const invites = response.data.data as Array<{ id: string; status: string; allowedEmails: string[] | null }>;

      return invites
        .filter((invite) => invite.status === 'active')
        .map<Option>((invite) => ({ id: invite.id, label: invite.allowedEmails?.join(', ') || invite.id }));
    }
  }
});

export const dropdownTriggers = [courseListTrigger, cohortListTrigger, lessonListTrigger, courseInviteListTrigger];
```

Match each list's field names (`title`, `name`, `status`, `allowedEmails`) to the response schemas in `packages/utils/src/validation/public-api/*-responses.ts` when implementing; the invite dropdown uses `dynamic: 'course_invite_list.id.label'`.

### R11.7 Actions (`src/creates/`)

`src/lib/lookups.ts`:

```ts
import type { ZObject } from 'zapier-platform-core';

import { apiUrl } from './config';

export type AudienceMember = { id: number; profileId: string | null; name: string; email: string };

export async function findStudentByEmail(z: ZObject, email: string): Promise<AudienceMember | null> {
  const response = await z.request({ url: apiUrl('/audience'), params: { email } });
  const members = response.data.data as AudienceMember[];

  return members[0] ?? null;
}

export async function requireStudentByEmail(z: ZObject, email: string): Promise<AudienceMember> {
  const member = await findStudentByEmail(z, email);

  if (!member) {
    throw new z.errors.Error(`No student in your organization has the email ${email}`, 'NotFound', 404);
  }

  return member;
}

export async function requireCourseMemberId(z: ZObject, courseId: string, email: string): Promise<string> {
  const response = await z.request({ url: apiUrl(`/courses/${courseId}/members`), params: { email } });
  const [member] = response.data.data as Array<{ id: string }>;

  if (!member) {
    throw new z.errors.Error(`${email} is not enrolled in this course`, 'NotFound', 404);
  }

  return member.id;
}
```

`src/creates/students.ts`:

```ts
import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { courseField, sendEmailField, studentEmailField } from '../lib/fields';
import { requireStudentByEmail } from '../lib/lookups';

const CONFLICT_STATUS = 409;

export const enrollStudent = defineCreate({
  key: 'enroll_student',
  noun: 'Enrollment',
  display: {
    label: 'Enroll Student in Course',
    description: 'Enrolls a student in a course by email, inviting them first if they are new.',
    important: true
  },
  operation: {
    inputFields: defineInputFields([courseField, studentEmailField, sendEmailField]),
    perform: async (z, bundle) => {
      const request = {
        url: apiUrl(`/courses/${bundle.inputData.courseId}/enrollments`),
        method: 'POST' as const,
        body: { email: bundle.inputData.email, sendEmail: bundle.inputData.sendEmail !== false }
      };
      const response = await z.request({ ...request, skipThrowForStatus: true });

      if (response.status === CONFLICT_STATUS && (response.data as { code?: string }).code === 'CONFLICT') {
        const retry = await z.request(request);

        return retry.data.data;
      }

      response.throwForStatus();

      return response.data.data;
    },
    sample: {
      status: 'enrolled',
      memberId: '000000d1-0000-4000-8000-0000000000d1',
      inviteId: null,
      email: 'student@example.com'
    },
    outputFields: [
      { key: 'status', label: 'Result' },
      { key: 'memberId', label: 'Course Member ID' },
      { key: 'inviteId', label: 'Invite ID' },
      { key: 'email', label: 'Email' }
    ]
  }
});

export const addStudent = defineCreate({
  key: 'add_student',
  noun: 'Student',
  display: {
    label: 'Add Student to Organization',
    description: 'Invites a student to your organization without enrolling them in a course.'
  },
  operation: {
    inputFields: defineInputFields([studentEmailField, sendEmailField]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl('/audience'),
        method: 'POST',
        body: { email: bundle.inputData.email, sendEmail: bundle.inputData.sendEmail !== false }
      });

      return response.data.data;
    },
    sample: { rows: [{ email: 'student@example.com', status: 'invited' }] }
  }
});

export const updateStudent = defineCreate({
  key: 'update_student',
  noun: 'Student',
  display: {
    label: 'Update Student',
    description: "Updates a student's name, or the email of an invite that hasn't been accepted."
  },
  operation: {
    inputFields: defineInputFields([
      { ...studentEmailField, label: 'Current Email' },
      { key: 'name', label: 'New Name', required: false, helpText: 'Applies to students who have joined.' },
      { key: 'newEmail', label: 'New Email', required: false, helpText: "Applies to invites that haven't been accepted." }
    ]),
    perform: async (z, bundle) => {
      const member = await requireStudentByEmail(z, String(bundle.inputData.email));
      const body = member.profileId ? { name: bundle.inputData.name } : { email: bundle.inputData.newEmail };

      if (!Object.values(body).some(Boolean)) {
        throw new z.errors.Error(
          member.profileId
            ? 'This student has joined, so only their name can be changed. Fill in New Name.'
            : "This student hasn't joined yet, so only the invite email can be changed. Fill in New Email.",
          'InvalidInput',
          400
        );
      }

      const response = await z.request({ url: apiUrl(`/audience/${member.id}`), method: 'PUT', body });

      return response.data.data;
    },
    sample: { id: 1042, name: 'Alex Johnson', email: 'student@example.com' }
  }
});

export const removeStudent = defineCreate({
  key: 'remove_student',
  noun: 'Student',
  display: {
    label: 'Remove Student from Organization',
    description: 'Removes a student from your organization and all of its courses.'
  },
  operation: {
    inputFields: defineInputFields([studentEmailField]),
    perform: async (z, bundle) => {
      const member = await requireStudentByEmail(z, String(bundle.inputData.email));
      const response = await z.request({ url: apiUrl(`/audience/${member.id}`), method: 'DELETE' });

      return response.data.data;
    },
    sample: { id: 1042, email: 'student@example.com', status: 'ARCHIVED' }
  }
});
```

`src/creates/courses.ts`:

```ts
import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { courseField, studentEmailField } from '../lib/fields';
import { requireCourseMemberId } from '../lib/lookups';

const SINGLE_INVITE_PRESET = 'MULTI_USE_7D';

export const removeCourseMember = defineCreate({
  key: 'remove_course_member',
  noun: 'Enrollment',
  display: {
    label: 'Remove Student from Course',
    description: 'Removes a student from one course and keeps them in your organization.'
  },
  operation: {
    inputFields: defineInputFields([courseField, studentEmailField]),
    perform: async (z, bundle) => {
      const courseId = String(bundle.inputData.courseId);
      const memberId = await requireCourseMemberId(z, courseId, String(bundle.inputData.email));
      const response = await z.request({ url: apiUrl(`/courses/${courseId}/members/${memberId}`), method: 'DELETE' });

      return response.data.data;
    },
    sample: { id: '000000d1-0000-4000-8000-0000000000d1' }
  }
});

export const sendCourseInvite = defineCreate({
  key: 'send_course_invite',
  noun: 'Invite',
  display: { label: 'Send Course Invite', description: 'Emails an invite to join a course.' },
  operation: {
    inputFields: defineInputFields([
      courseField,
      { key: 'emails', label: 'Emails', list: true, required: true, helpText: 'Each address gets its own invite.' }
    ]),
    perform: async (z, bundle) => {
      const emails = (bundle.inputData.emails as string[]).map((email) => email.trim()).filter(Boolean);
      const response = await z.request({
        url: apiUrl(`/courses/${bundle.inputData.courseId}/invites`),
        method: 'POST',
        body: { preset: SINGLE_INVITE_PRESET, recipientEmails: emails, allowedEmails: emails, sendEmail: true }
      });

      return response.data.data;
    },
    sample: { mode: 'bulk', invites: [{ id: '000000e1-0000-4000-8000-0000000000e1', email: 'student@example.com' }] }
  }
});

export const revokeCourseInvite = defineCreate({
  key: 'revoke_course_invite',
  noun: 'Invite',
  display: { label: 'Revoke Course Invite', description: 'Cancels a pending course invite so its link stops working.' },
  operation: {
    inputFields: defineInputFields([
      courseField,
      { key: 'inviteId', label: 'Invite', dynamic: 'course_invite_list.id.label', required: true }
    ]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl(`/courses/${bundle.inputData.courseId}/invites/${bundle.inputData.inviteId}/revoke`),
        method: 'POST'
      });

      return response.data.data;
    },
    sample: { id: '000000e1-0000-4000-8000-0000000000e1', isRevoked: true }
  }
});

export const resetCourseProgress = defineCreate({
  key: 'reset_course_progress',
  noun: 'Progress',
  display: {
    label: 'Reset Student Course Progress',
    description: "Clears a student's progress in a course and keeps them enrolled. This can't be undone."
  },
  operation: {
    inputFields: defineInputFields([courseField, studentEmailField]),
    perform: async (z, bundle) => {
      const courseId = String(bundle.inputData.courseId);
      const memberId = await requireCourseMemberId(z, courseId, String(bundle.inputData.email));
      const response = await z.request({
        url: apiUrl(`/courses/${courseId}/members/${memberId}/reset-progress`),
        method: 'POST'
      });

      return response.data.data;
    },
    sample: { memberId: '000000d1-0000-4000-8000-0000000000d1', reset: true }
  }
});

export const markLessonComplete = defineCreate({
  key: 'mark_lesson_complete',
  noun: 'Lesson Completion',
  display: { label: 'Mark Lesson Complete', description: 'Marks a lesson complete for a student.' },
  operation: {
    inputFields: defineInputFields([
      courseField,
      { key: 'lessonId', label: 'Lesson', dynamic: 'lesson_list.id.title', required: true },
      studentEmailField
    ]),
    perform: async (z, bundle) => {
      const courseId = String(bundle.inputData.courseId);
      const memberId = await requireCourseMemberId(z, courseId, String(bundle.inputData.email));
      const response = await z.request({
        url: apiUrl(`/courses/${courseId}/members/${memberId}/lessons/${bundle.inputData.lessonId}/completion`),
        method: 'PUT',
        body: { isComplete: true }
      });

      return response.data.data;
    },
    sample: { lessonId: '000000f1-0000-4000-8000-0000000000f1', isComplete: true }
  }
});
```

`src/creates/cohorts.ts`:

```ts
import { defineCreate, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { cohortField, studentEmailField } from '../lib/fields';

const STUDENT_ROLE_ID = 3;

export const addCohortMember = defineCreate({
  key: 'add_cohort_member',
  noun: 'Cohort Member',
  display: { label: 'Add Student to Cohort', description: 'Adds a student to a cohort.' },
  operation: {
    inputFields: defineInputFields([
      cohortField,
      studentEmailField,
      { key: 'name', label: 'Name', required: false }
    ]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl(`/cohorts/${bundle.inputData.cohortId}/members`),
        method: 'POST',
        body: {
          members: [{ email: bundle.inputData.email, name: bundle.inputData.name, roleId: STUDENT_ROLE_ID }]
        }
      });
      const result = response.data.data as { added: unknown[]; errors: Array<{ message?: string }> };

      if (result.added.length === 0 && result.errors.length > 0) {
        throw new z.errors.Error(result.errors[0]?.message ?? 'The student could not be added', 'InvalidInput', 400);
      }

      return result;
    },
    sample: { added: [{ id: '000000c2-0000-4000-8000-0000000000c2', email: 'student@example.com' }], errors: [] }
  }
});

export const postCohortAnnouncement = defineCreate({
  key: 'post_cohort_announcement',
  noun: 'Announcement',
  display: { label: 'Post to Cohort Feed', description: "Posts an announcement to a cohort's feed." },
  operation: {
    inputFields: defineInputFields([
      cohortField,
      { key: 'content', label: 'Message', type: 'text', required: true },
      { key: 'isPinned', label: 'Pin Post', type: 'boolean', required: false }
    ]),
    perform: async (z, bundle) => {
      const response = await z.request({
        url: apiUrl(`/cohorts/${bundle.inputData.cohortId}/newsfeed`),
        method: 'POST',
        body: { content: bundle.inputData.content, isPinned: bundle.inputData.isPinned === true }
      });

      return response.data.data;
    },
    sample: { id: '000000f2-0000-4000-8000-0000000000f2', content: 'Welcome to the cohort!', isPinned: false }
  }
});
```

`src/creates/index.ts`:

```ts
import { addCohortMember, postCohortAnnouncement } from './cohorts';
import { markLessonComplete, removeCourseMember, resetCourseProgress, revokeCourseInvite, sendCourseInvite } from './courses';
import { addStudent, enrollStudent, removeStudent, updateStudent } from './students';

export const creates = [
  enrollStudent,
  addStudent,
  updateStudent,
  removeStudent,
  removeCourseMember,
  sendCourseInvite,
  revokeCourseInvite,
  resetCourseProgress,
  markLessonComplete,
  addCohortMember,
  postCohortAnnouncement
];
```

Replace every `sample` with a value that parses against the matching response schema in `packages/utils/src/validation/public-api/*-responses.ts`; the tests in R13.5 enforce it.

### R11.8 Searches (`src/searches/index.ts`)

```ts
import { defineSearch, defineInputFields } from 'zapier-platform-core';

import { apiUrl } from '../lib/config';
import { findStudentByEmail } from '../lib/lookups';
import { readString } from '../lib/records';

export const findStudent = defineSearch({
  key: 'find_student',
  noun: 'Student',
  display: { label: 'Find Student', description: 'Finds a student in your organization by email.' },
  operation: {
    inputFields: defineInputFields([{ key: 'email', label: 'Email', required: true }]),
    perform: async (z, bundle) => {
      const member = await findStudentByEmail(z, String(bundle.inputData.email));

      return member ? [member] : [];
    },
    sample: { id: 1042, profileId: '000000b1-0000-4000-8000-0000000000b1', name: 'Alex Johnson', email: 'student@example.com' }
  }
});

export const findCourse = defineSearch({
  key: 'find_course',
  noun: 'Course',
  display: { label: 'Find Course', description: 'Finds a course by its slug or exact title.' },
  operation: {
    inputFields: defineInputFields([
      { key: 'slug', label: 'Slug', required: false },
      { key: 'title', label: 'Title', required: false, helpText: 'Exact title. Used when Slug is empty.' }
    ]),
    perform: async (z, bundle) => {
      const slug = readString(bundle.inputData.slug);
      const title = readString(bundle.inputData.title);

      if (!slug && !title) {
        throw new z.errors.Error('Fill in Slug or Title', 'InvalidInput', 400);
      }

      const response = await z.request({ url: apiUrl('/courses'), params: slug ? { slug } : { title: title! } });

      return response.data.data;
    },
    sample: { id: '000000c1-0000-4000-8000-0000000000c1', title: 'Intro to Data Science', slug: 'intro-to-data-science' }
  }
});

export const searches = [findStudent, findCourse];
```

### R11.9 Certificate file (`src/hydrators.ts`)

```ts
import type { Bundle, ZObject } from 'zapier-platform-core';

import { apiUrl } from './lib/config';
import { readString, type EventRecord } from './lib/records';

type CertificateFileInput = { courseId: string; memberId: string };

export const hydrators = {
  certificateFile: async (z: ZObject, bundle: Bundle<CertificateFileInput>) => {
    const download = z.request({
      url: apiUrl(`/courses/${bundle.inputData.courseId}/certificates/${bundle.inputData.memberId}/download`),
      params: { format: 'pdf' },
      raw: true
    });

    return z.stashFile(download);
  }
};

export function attachCertificateFile(z: ZObject, record: EventRecord): EventRecord {
  const courseId = readString(record.courseId);
  const memberId = readString(record.memberId);

  if (!courseId || !memberId) return record;

  return { ...record, certificate_file: z.dehydrateFile(hydrators.certificateFile, { courseId, memberId }) };
}
```

Confirm the download route's query parameter name for the format against `routes/v1/courses/certificates.ts` (it returns PDF or PNG).

---

## R12. CI and release workflows

`.github/workflows/zapier-app-check.yml`:

```yaml
name: Zapier app check

on:
  pull_request:
    paths:
      - 'apps/zapier/**'
      - 'packages/utils/src/constants/webhook.ts'
      - 'packages/utils/src/constants/zapier.ts'
      - 'packages/utils/src/validation/webhook/**'
      - 'pnpm-lock.yaml'
      - '.github/workflows/zapier-app-check.yml'
  push:
    branches:
      - main
    paths:
      - 'apps/zapier/**'
      - 'packages/utils/**'

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24.22.1
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared utils
        run: pnpm --filter @cio/utils build

      - name: Typecheck, test and build
        run: |
          pnpm --filter @cio/zapier typecheck
          pnpm --filter @cio/zapier test
          pnpm --filter @cio/zapier build

      - name: Validate the app definition
        working-directory: apps/zapier
        run: pnpm exec zapier-platform validate --without-style
```

`.github/workflows/publish-zapier.yml` (manual, never on push; promotion stays a human step):

```yaml
name: Publish Zapier app

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Which Zapier integration to push to'
        required: true
        type: choice
        options:
          - staging
          - production

permissions:
  contents: read

jobs:
  push:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24.22.1
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared utils
        run: pnpm --filter @cio/utils build

      - name: Select integration
        working-directory: apps/zapier
        env:
          ZAPIER_INTEGRATION_ID_STAGING: ${{ vars.ZAPIER_INTEGRATION_ID_STAGING }}
          ZAPIER_INTEGRATION_ID_PRODUCTION: ${{ vars.ZAPIER_INTEGRATION_ID_PRODUCTION }}
        run: pnpm use:${{ inputs.environment }}

      - name: Push
        working-directory: apps/zapier
        env:
          ZAPIER_DEPLOY_KEY: ${{ secrets.ZAPIER_DEPLOY_KEY }}
        run: pnpm zapier:push
```

Call out the new workflows and the lockfile change in the PR description (PR template checklist).

---

## R13. Tests

### R13.1 Subscriptions service (`apps/api/src/__tests__/webhook-subscriptions.test.ts`)

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TOrganizationApiKey } from '@cio/db/types';

const queries = vi.hoisted(() => ({
  upsertManagedWebhookSubscription: vi.fn(),
  deleteManagedWebhookSubscription: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => queries);
vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn().mockResolvedValue({ planName: 'EARLY_ADOPTER' })
}));
vi.mock('@cio/core/services/webhook/endpoint-cache', () => ({ refreshOrgHasWebhookEndpoints: vi.fn() }));
vi.mock('@cio/core/services/webhook/url-guard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/core/services/webhook/url-guard')>()),
  resolveWebhookTarget: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@api/services/webhook/webhook', () => ({ assertWebhooksAllowed: vi.fn() }));
vi.mock('@api/services/product-events', () => ({ captureZapierTriggerSubscribed: vi.fn() }));
vi.mock('@api/services/v1/shared', () => ({
  assertAutomationActor: vi.fn(),
  assertOrgAdmin: vi.fn(),
  assertCourseBelongsToOrganization: vi.fn(),
  assertCohortBelongsToOrganization: vi.fn()
}));
vi.mock('@cio/core/config/env', () => ({ env: { ZAPIER_OAUTH_CLIENT_ID: 'zapier-client' } }));

const { createWebhookSubscriptionService, deleteWebhookSubscriptionService } = await import(
  '@api/services/v1/webhooks/subscriptions'
);

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ACTOR_ID = '00000000-0000-4000-8000-000000000002';
const CONSENT_ID = '00000000-0000-4000-8000-000000000003';
const TARGET_URL = 'https://hooks.zapier.com/hooks/standard/1/abc/';

function oauthPrincipal(clientId = 'zapier-client') {
  return {
    automationKey: { id: 'key-1', oauthConsentId: CONSENT_ID, scopes: [] } as unknown as TOrganizationApiKey,
    oauthClientId: clientId
  };
}

function storedSubscription(eventType = 'course.member.added') {
  return {
    id: '00000000-0000-4000-8000-000000000004',
    eventTypes: [eventType],
    payloadUrl: TARGET_URL,
    filterCourseId: null,
    filterCohortId: null,
    secretCiphertext: null,
    createdAt: '2026-10-30T00:00:00.000Z'
  };
}

describe('createWebhookSubscriptionService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects automation keys', async () => {
    const principal = { automationKey: { id: 'key-1', oauthConsentId: null } as unknown as TOrganizationApiKey, oauthClientId: null };

    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, principal, { targetUrl: TARGET_URL, eventType: 'course.completed' })
    ).rejects.toMatchObject({ code: 'OAUTH_CONNECTION_REQUIRED', statusCode: 403 });
  });

  it('rejects hosts that are not registered for the client', async () => {
    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal(), {
        targetUrl: 'https://example.com/hook',
        eventType: 'course.completed'
      })
    ).rejects.toMatchObject({ code: 'WEBHOOK_URL_INVALID', field: 'targetUrl' });
  });

  it('rejects clients that may not subscribe at all', async () => {
    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal('other-client'), {
        targetUrl: TARGET_URL,
        eventType: 'course.completed'
      })
    ).rejects.toMatchObject({ code: 'WEBHOOK_URL_INVALID' });
  });

  it('returns 403 at the plan cap', async () => {
    queries.upsertManagedWebhookSubscription.mockResolvedValue(null);

    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal(), { targetUrl: TARGET_URL, eventType: 'course.completed' })
    ).rejects.toMatchObject({ code: 'WEBHOOK_SUBSCRIPTION_LIMIT_EXCEEDED', statusCode: 403 });
    expect(queries.upsertManagedWebhookSubscription).toHaveBeenCalledWith(expect.anything(), 'course.completed', 50);
  });

  it('refuses to reuse a target URL for a different event', async () => {
    queries.upsertManagedWebhookSubscription.mockResolvedValue({
      subscription: storedSubscription('course.member.added'),
      created: false
    });

    await expect(
      createWebhookSubscriptionService(ORG_ID, ACTOR_ID, oauthPrincipal(), { targetUrl: TARGET_URL, eventType: 'course.completed' })
    ).rejects.toMatchObject({ code: 'WEBHOOK_SUBSCRIPTION_CONFLICT', statusCode: 409 });
  });
});

describe('deleteWebhookSubscriptionService', () => {
  it('returns 404 for a subscription the grant does not own', async () => {
    queries.deleteManagedWebhookSubscription.mockResolvedValue(false);

    await expect(
      deleteWebhookSubscriptionService(ORG_ID, oauthPrincipal(), { subscriptionId: storedSubscription().id })
    ).rejects.toMatchObject({ code: 'WEBHOOK_SUBSCRIPTION_NOT_FOUND', statusCode: 404 });
    expect(queries.deleteManagedWebhookSubscription).toHaveBeenCalledWith(CONSENT_ID, storedSubscription().id);
  });
});
```

Add the success path (created subscription returns the decrypted secret and refreshes the cache) with a real `encryptWebhookSecret` round trip, as `webhook-service.test.ts` does.

### R13.2 Zapier reachability (`apps/api/src/__tests__/oauth-zapier-reachability.test.ts`)

```ts
import { describe, expect, it } from 'vitest';

import { ZAPIER_OAUTH_SCOPES } from '@cio/utils/constants/zapier';

import { getPublicApiRouteScope, isPublicApiIdentityPath } from '@api/middlewares/public-api-scopes';
import { v1Router } from '@api/routes/v1';

const ZAPIER_SCOPES = new Set<string>(ZAPIER_OAUTH_SCOPES);

function toConcretePath(routePath: string): string {
  return `/public-api/v1${routePath.replace(/:[A-Za-z]+/g, 'id')}`;
}

describe('Zapier OAuth scope reachability', () => {
  it('opens exactly the public API routes the Zapier app is meant to reach', () => {
    const reachable = v1Router.routes
      .filter((route) => route.method !== 'ALL')
      .filter((route) => {
        const path = toConcretePath(route.path);
        const scope = getPublicApiRouteScope(route.method, path);

        return isPublicApiIdentityPath(path) || (scope !== null && ZAPIER_SCOPES.has(scope));
      })
      .map((route) => `${route.method} ${route.path}`)
      .sort();

    expect(reachable).toMatchSnapshot();
  });
});
```

Review the snapshot line by line in PR 1; a later route that widens Zapier's access then shows up as a snapshot diff.

### R13.3 Delivery: 410 ends a managed subscription (`apps/api/src/__tests__/webhook-delivery-managed.test.ts`)

Build on `webhook-delivery.test.ts`'s local HTTP server: a managed endpoint (`oauthConsentId` set) whose server answers `410` must call `deleteManagedWebhookSubscriptionById` and `refreshOrgHasWebhookEndpoints` and stop draining; a customer endpoint answering `410` keeps today's retry behavior; `notifyWebhookHealthChange` sends nothing for a managed endpoint.

### R13.4 Contract (`apps/api/src/__tests__/webhook-contract.test.ts`)

```ts
import { WEBHOOK_EVENT_DATA_EXAMPLES } from '@cio/utils/validation/webhook';

  it.each([...WEBHOOK_EVENT_TYPES])('ships a %s example that matches its schema and the docs', (eventType) => {
    const example = WEBHOOK_EVENT_DATA_EXAMPLES[eventType];

    expect(() => ZWebhookEventData[eventType].parse(example)).not.toThrow();
    expect(extractExample(eventType)).toEqual(example);
  });
```

### R13.5 Zapier app (`apps/zapier/test/`)

`test/triggers.test.ts`:

```ts
import { createHmac } from 'node:crypto';

import nock from 'nock';
import { createAppTester } from 'zapier-platform-core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WEBHOOK_EVENT_DATA_EXAMPLES, ZWebhookEventData } from '@cio/utils/validation/webhook';
import { ZAPIER_TRIGGERS } from '@cio/utils/constants/zapier';

import App from '../src/index';

const API_ORIGIN = 'https://api.example.test';
const SECRET = `whsec_${Buffer.from('test-secret-test-secret!').toString('base64')}`;
const appTester = createAppTester(App);

beforeAll(() => {
  process.env.CIO_API_ORIGIN = API_ORIGIN;
  process.env.CIO_APP_ORIGIN = 'https://app.example.test';
});

afterEach(() => nock.cleanAll());

function signedDelivery(body: string, timestamp = Math.floor(Date.now() / 1000)) {
  const id = 'evt_test';
  const key = Buffer.from(SECRET.slice('whsec_'.length), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');

  return {
    headers: { 'webhook-id': id, 'webhook-timestamp': String(timestamp), 'webhook-signature': `v1,${signature}` },
    content: body
  };
}

describe('event triggers', () => {
  it('subscribes with the target URL, event type and course filter', async () => {
    const scope = nock(API_ORIGIN)
      .post('/public-api/v1/webhooks/subscriptions', {
        targetUrl: 'https://hooks.zapier.com/x',
        eventType: 'course.member.added',
        courseId: 'course-1'
      })
      .reply(201, { success: true, data: { id: 'sub-1', secret: SECRET } });

    const result = await appTester(App.triggers.new_course_enrollment.operation.performSubscribe, {
      authData: { access_token: 'token' },
      targetUrl: 'https://hooks.zapier.com/x',
      inputData: { courseId: 'course-1' }
    });

    expect(result).toEqual({ id: 'sub-1', secret: SECRET });
    expect(scope.isDone()).toBe(true);
  });

  it('treats an already deleted subscription as unsubscribed', async () => {
    nock(API_ORIGIN).delete('/public-api/v1/webhooks/subscriptions/sub-1').reply(404, { success: false });

    await expect(
      appTester(App.triggers.new_course_enrollment.operation.performUnsubscribe, {
        authData: { access_token: 'token' },
        subscribeData: { id: 'sub-1', secret: SECRET }
      })
    ).resolves.toEqual({});
  });

  it('returns a signed delivery and drops a forged one', async () => {
    const envelope = {
      id: 'evt_test',
      type: 'course.member.added',
      createdAt: '2026-10-30T00:00:00.000Z',
      apiVersion: '2026-10-21',
      organization: { id: 'org-1', name: 'Acme', siteName: 'acme' },
      data: WEBHOOK_EVENT_DATA_EXAMPLES['course.member.added']
    };
    const body = JSON.stringify(envelope);
    const perform = App.triggers.new_course_enrollment.operation.perform;

    const accepted = await appTester(perform, {
      cleanedRequest: envelope,
      rawRequest: signedDelivery(body),
      subscribeData: { id: 'sub-1', secret: SECRET },
      inputData: {}
    });
    const forged = await appTester(perform, {
      cleanedRequest: envelope,
      rawRequest: { ...signedDelivery(body), content: body.replace('Alex', 'Eve') },
      subscribeData: { id: 'sub-1', secret: SECRET },
      inputData: {}
    });

    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toMatchObject({ id: 'evt_test', event_type: 'course.member.added' });
    expect(forged).toEqual([]);
  });

  it.each(ZAPIER_TRIGGERS.map((trigger) => [trigger.key, trigger.eventType] as const))(
    '%s ships a sample that matches the %s schema',
    (key, eventType) => {
      const { id, event_type, occurred_at, organization, ...data } = App.triggers[key].operation.sample;

      expect(() => ZWebhookEventData[eventType].parse(data)).not.toThrow();
    }
  );
});
```

`test/creates.test.ts` covers, with `nock`: `enroll_student` maps each status and retries once on `409 CONFLICT`; `update_student` sends `name` for joined members and `email` for pending ones and errors when the matching field is empty; lookups throw `NotFound` for unknown emails; `add_cohort_member` turns an all-error response into an error. `test/http.test.ts` covers `handleApiErrors`: 401 → `RefreshAuthError`, 403 `UPGRADE_REQUIRED` → plan message, 429 → `ThrottledError` with `Retry-After`, 400 with `field`. `test/authentication.test.ts` covers the token exchange body (including `resource` and `code_verifier`), refresh, and the test call.

### R13.6 Dashboard (`apps/dashboard/src/lib/features/automation/utils/zapier-utils.test.ts`)

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/public', () => ({ PUBLIC_ZAPIER_APP_KEY: '', PUBLIC_ZAPIER_LISTING: 'private' }));

const { countZapierAppsByCategory, filterZapierApps, getZapierAccess, parseZapierCategory, sortZapierApps } =
  await import('./zapier-utils');
const { ZAPIER_APPS } = await import('./zapier-apps');

const describeApp = () => '';

describe('zapier catalog helpers', () => {
  it('counts every app once and per category', () => {
    const counts = countZapierAppsByCategory(ZAPIER_APPS);

    expect(counts.get('all')).toBe(ZAPIER_APPS.length);
    expect(counts.get('crm')).toBe(2);
  });

  it('filters by category and by name, case-insensitively', () => {
    expect(filterZapierApps(ZAPIER_APPS, 'HUB', 'all', describeApp).map((app) => app.slug)).toEqual(['hubspot']);
    expect(filterZapierApps(ZAPIER_APPS, '', 'forms', describeApp)).toHaveLength(2);
  });

  it('puts popular apps first, then sorts by name', () => {
    const sorted = sortZapierApps(ZAPIER_APPS);

    expect(sorted[0]?.isPopular).toBe(true);
    expect(sorted.at(-1)?.isPopular).toBe(false);
  });

  it('falls back to all for an unknown category', () => {
    expect(parseZapierCategory('nope')).toBe('all');
  });

  it('reads access from the granted scopes', () => {
    expect(getZapierAccess(['audience:read', 'audience:write'])).toBe('read_write');
    expect(getZapierAccess(['audience:read'])).toBe('read_only');
  });
});
```

---

## R14. Help-center article skeletons

`apps/help/content/help/integrations-and-automation/connect-classroomio-to-zapier.mdx`:

```mdx
---
title: 'Connect ClassroomIO to Zapier'
description: 'Connect your organization to Zapier so Zaps can react to your courses and update your students.'
last_reviewed: '<date of the PR>'
---

Connect ClassroomIO to Zapier to start Zaps when something happens in your organization, such as a student finishing a course, and to let Zaps enroll, update or remove students. Only organization administrators can connect Zapier.

![Zapier tab showing a connected Zapier account and its active triggers](./images/connect-classroomio-to-zapier/overview.webp)

:::info[Plan requirement]
Zapier uses the same entitlement as the public API: Early Adopter or Enterprise on ClassroomIO cloud. It isn't available on self-hosted installations.
:::

## Connect from Zapier
### 1. Add ClassroomIO to a Zap
### 2. Sign in and choose your organization
### 3. Review the permissions and allow access

## Connect from ClassroomIO
Open **Automation**, select the **Zapier** tab, then **Connect on Zapier**.

## What Zapier can do
A short table of the permission areas the consent screen lists, in plain language.

## Next steps
Links to "Manage Zapier connections" and "Zapier triggers and actions".
```

`manage-zapier-connections.mdx`: the connections table and what each column means; viewing active triggers; removing access (what stops, how to reconnect); what happens on a plan downgrade (Zaps pause, connections stay, upgrade resumes); what happens when the admin who connected loses admin access; troubleshooting (reconnect prompts, "plan doesn't include Zapier", rate limits, missing events and the Webhooks-style delivery health).

`zapier-triggers-and-actions.mdx`: one section per trigger (when it fires, its filters, key fields), action (required fields, what happens on repeat) and search, generated from `ZAPIER_TRIGGERS`, `ZAPIER_ACTIONS` and `ZAPIER_SEARCHES` so names match the app exactly.

Every screenshot follows `skills/add-docs-image` (1350×830, device scale 1, framed with `pnpm --filter @cio/help frame-screenshot`).
