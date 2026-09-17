---
name: Self-Serve Account Deletion
overview: Let any user permanently delete their own account from Profile settings — a Danger zone section with a confirmation modal that lists exactly what will be wiped, an API that tears down all user data in dependency order (leaf tables first, profile/user last), deletion of the user's data in external services (PostHog, UserJot, avatar storage), a confirmation email after deletion completes, and an automatic logout with a 5-second countdown. The email address is freed so the same email can sign up again, but nothing carries over.
todos:
  - id: prototype
    content: Build clickable HTML prototype of the Danger zone, confirmation modal, and logout countdown under prototypes/account-deletion/ (house convention — prototype becomes the UX source of truth)
    status: pending
  - id: confirmation-email
    content: Add accountDeleted system email (ClassroomIO-branded, no org branding) to packages/email and register it
    status: pending
  - id: validation-schema
    content: Add ZDeleteAccount schema to packages/utils/src/validation/account/account.ts
    status: pending
  - id: teardown-queries
    content: Create packages/db/src/queries/account-deletion/ module with one pure query file per teardown phase
    status: pending
  - id: preview-endpoint
    content: Add GET /account/deletion-preview (live counts + blockers for the modal)
    status: pending
  - id: delete-endpoint
    content: Add DELETE /account route + deleteAccount service running the ordered teardown in one transaction
    status: pending
  - id: external-cleanup
    content: Add BullMQ job for external cleanup (PostHog bulk_delete, avatar object, UserJot best-effort) with POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID env vars, delivered via the transactional outbox
    status: pending
  - id: outbox-table
    content: Add transactional_outbox table (the only v1 migration) + post-commit relay + maintenance-worker reconciler so the confirmation email and external cleanup survive crashes/Redis outages
    status: pending
  - id: danger-zone-ui
    content: Add Danger zone section + delete-account modal + countdown logout state to profile settings
    status: pending
  - id: translations
    content: Add en.json keys (settings.profile.danger_zone.*, delete_account_modal.*, snackbar.account.*) and run pnpm translate
    status: pending
  - id: e2e-verification
    content: Manual verification on seeded VM — delete account via UI, verify all tables clean, sessions revoked, email sent, re-signup with same email works, blocker path works
    status: pending
isProject: true
---

# Self-Serve Account Deletion PRD

## Status

- Draft (2026-08-16)
- Owner: TBD

## Prototypes — the UX source of truth

Not built yet. When they exist they live under `prototypes/account-deletion/` (start page `prototypes/account-deletion/index.html`) and become the UX source of truth — when prose and prototype disagree on a UI detail, the prototype wins. Until then, the Functional Requirements section below is the reference.

| Surface | Planned prototype file |
|---|---|
| Profile settings Danger zone | `prototypes/account-deletion/settings-danger-zone.html` |
| Confirmation modal (preview + type-email) | `prototypes/account-deletion/delete-modal.html` |
| Blocked state (sole-admin org with members) | `prototypes/account-deletion/delete-modal-blocked.html` |
| Post-delete logout countdown | `prototypes/account-deletion/logout-countdown.html` |
| Confirmation email | `prototypes/account-deletion/email.html` |

## Purpose

Give users a self-serve, irreversible "delete my account" flow — no support ticket required. Reference experience: GitHub's account deletion (danger zone → confirmation modal → typed confirmation → immediate effect).

## Problem Statement

- Today there is **no way** for a user to delete their own account. The only teardown that exists is workspace deletion (`DELETE /account/workspaces/:workspaceId`), which removes a secondary org, not the user.
- Privacy-conscious users and GDPR "right to be forgotten" requests currently require manual support intervention and ad-hoc SQL.
- User data is spread across ~40 Postgres tables plus external services (PostHog, UserJot, object storage), so manual deletion is error-prone and almost never complete.

## Confirmed Decisions

1. The entry point is a **Danger zone section on the Profile settings page** with a single destructive action: **Delete account**.
2. Clicking it opens a **confirmation modal that tells the user everything that is going to be deleted**.
3. Deletion is a **full wipe**: profile, all organization memberships, course enrollments and progress, submissions, comments/posts, certificates, AI chats, login history, and all sessions/logins on all devices.
4. The user **cannot log into the deleted account again**, but **can create a new account with the same email** — nothing carries over.
5. The backend deletes **sequentially from tables with the fewest relations up to the most depended-upon tables** — `profile` and the better-auth `user`/`account` rows are deleted **last**.
6. After deletion is confirmed, the UI tells the user **"account deletion is in progress / we're logging you out"** and shows a **~5 second countdown on the logout button** — the user can click to log out immediately or the countdown logs them out automatically.
7. That same message tells the user **"once your account has been deleted, we will send you an email"** — and the platform actually sends that confirmation email after deletion completes.
8. Deletion also targets the user's data in **external services where we store user data** — at minimum **PostHog** and **UserJot** — in addition to our own database. Database deletion is the guaranteed, synchronous outcome; external cleanup is durable and retried, but completes asynchronously (PostHog batches event deletion; UserJot may need a manual step until their API supports it; Sentry/Umami/email-provider data expires per provider retention).

## Current-State Audit

| Capability | Current state | Notes |
|---|---|---|
| Self-serve account deletion | **Does not exist** | Only `deleteWorkspace` (secondary org) exists — `apps/api/src/services/account/workspaces.ts`, dashboard `features/account/api/account.svelte.ts` |
| Auth stack | better-auth v1.4 + Drizzle adapter | `packages/db/src/auth.ts`; tables `user` (email `unique`), `account`, `session`, `sso_provider` (all cascade from `user`), `verification` (keyed by email string) |
| App profile | `profile` table, 1:1 with `user`, **same UUID**, FK `profile_id_fkey` is **NO ACTION** | Created by `packages/db/src/auth/hooks/create-profile.ts`; `profile.email` also unique — both rows must go for email reuse |
| DB cascades for user data | **Mostly absent** | Memberships, submissions, newsfeeds, comments, community, invites are `NO ACTION`; `widget.created_by_user_id` / `widget_version.published_by_user_id` are `RESTRICT`; only `account`/`session`/`sso_provider` and some AI/compliance tables cascade |
| Existing teardown helpers | Partial | `resetStudentCourseProgress` (best per-course template), `deleteCourseMember`, `deleteOrganizationMember`, `deleteOrganizationById`, `deleteChatHistory`, `deidentifyPageEventsForUser` (**unused**) |
| Workspace deletion | `deleteSecondaryWorkspace` does a bare `DELETE FROM organization` | Only safe for empty orgs — `organizationmember`/`group`/`course` → `organization` FKs are `NO ACTION`. Account deletion needs an ordered org teardown |
| Org-level FK coverage | **Incomplete for org teardown** (audited from migration SQL) | 11 org children are `NO ACTION` and must be deleted explicitly: `group`, `organizationmember`, `organization_plan`, `organization_contacts`, `organization_emaillist`, `organization_automation_usage`, `quiz`, `community_question`, `ai_credit_balance`, `ai_credit_purchase`, `ai_token_usage`. ~18 others cascade (`cohort`, `program`, `widget`, `tag`, org configs, invites, assets, media jobs, …). Also: `organization.parent_organization_id` is `SET NULL` — deleting a primary org would silently promote its secondary workspaces |
| Durable job handoff | **No outbox today** | Emails/jobs are enqueued to BullMQ (Redis) outside the DB transaction — a crash between commit and enqueue loses the work. Account deletion adds a `transactional_outbox` table |
| Shared-content parents | Author columns nullable; dependents are `NO ACTION` | `course_newsfeed.author_id`, `apps_poll.authorId`, `community_question.author_id` are all nullable; but comments/answers/votes on a user's post are `NO ACTION` children, so deleting a user's post forces deleting others' replies first — the PRD makes this thread rule explicit (see Shared-content rule) |
| Profile settings page | `apps/dashboard/src/lib/features/settings/pages/profile.svelte` | Rendered by both `/org/[slug]/settings` and `/lms/settings` — one change covers both surfaces |
| Destructive-action precedent | Course settings Danger zone + shared `DeleteModal` (`features/ui/delete-modal.svelte`); typed-confirm dialogs in workspaces/audience | Our modal needs a live data summary, so it's a custom `Dialog.Root`, not the generic `DeleteModal` |
| Countdown precedent | `features/onboarding/components/verify-email-modal.svelte` (`setInterval` countdown) | Reuse pattern for the 5s logout countdown |
| Logout | `apps/dashboard/src/lib/utils/functions/logout.ts` → better-auth `signOut()` → `/login` | Reused as-is |
| Transactional email | `packages/email` — `defineEmail` + `getDefaultTemplate`, enqueued via `enqueueTransactionalEmail` → BullMQ `emails` queue → `apps/jobs/src/workers/emails.ts` | New email follows the system-email rules in AGENTS.md (no org branding, default `EMAIL_FROM`) |
| PostHog | **Client-side only** (`apps/dashboard/.../services/posthog`), distinct id = profile/user id, EU project | No server client or deletion code today; deletion via PostHog Persons API |
| UserJot | Browser SDK (`apps/dashboard/.../services/userjot`), identifies with id/email/name/avatar | Public REST API exists (`api.userjot.com/v1`) but **no documented per-user/GDPR deletion endpoint** — verify at implementation time |
| Sentry / Umami / ZeptoMail | Event/retention-based, no per-user deletion API | No action needed; document only |
| Avatar storage | Flat keys in media bucket (`{nanoid}-{filename}`), URL on `profile.avatar_url` | Delete object by key parsed from the URL |
| Polar billing | Org-scoped; `customerId` on `organization_plan.payload` | Account deletion blocked while an owned org has an active subscription |

## Product Goals

1. Any authenticated user can permanently delete their account in under a minute, without contacting support.
2. Database deletion is complete and atomic: every row tied to the user is removed in one transaction, not just access revoked. External-service erasure is durable and retried, and completes asynchronously within provider limits (see External-service cleanup) — we never promise instant third-party deletion.
3. The flow is honest and safe: the user sees exactly what will be deleted before confirming — including the fact that threads they started are removed with others' replies — and cannot destroy an organization other people still depend on.
4. The email address is freed immediately so the same email can register a fresh account.

## Non-Goals (v1)

- Soft-delete / grace-period / "restore my account" flows.
- Anonymize-in-place option for authored content (delete, don't anonymize — see Open Questions).
- Self-serve cancellation of active Polar subscriptions inside the delete flow (blocked with instructions instead).
- Admin-initiated deletion of other users (this PRD is self-serve only).
- Data export before deletion (GDPR portability is a separate feature).

## Users & Jobs

| Persona | Job |
|---|---|
| **Account owner (any authenticated user)** | "I want to leave the platform and know that every trace of me is gone — without emailing support." |
| **Solo org founder** | "I created an org to try the product; delete my org along with me." |
| **Member of a shared org** | "Delete my data and membership, but leave my organization intact for everyone else." |
| **Platform/support team** | "GDPR erasure requests should be handled by the product, not by hand." |

## User Stories

### Happy path

- As a user, I open **Settings → Profile**, scroll to the **Danger zone**, and click **Delete account**.
- I see a modal listing exactly what will be erased (built from live counts: my orgs, course enrollments, submissions, comments, certificates, AI chats, login history, sessions) and telling me: everything is wiped, I won't be able to log in with this account again, I *can* sign up again with the same email but nothing carries over, discussions I started are removed entirely (including others' replies to them), external-service data (analytics, feedback identity) is erased asynchronously over the following days, and I'll receive a confirmation email when deletion is done.
- I confirm by typing my account email and clicking **Delete my account**.
- The modal switches to "Your account deletion is in progress. We're logging you out." with a **Log out now (5)** button counting down; clicking it or waiting 5 seconds logs me out to `/login`.
- I receive an email confirming my account and all associated data have been permanently deleted.

### Sole founder of an empty org

- As the only person in my organization, my org, its courses, and all their content are deleted along with my account.

### Blocked paths

- As the **sole admin of an org that still has other members/students**, deletion is blocked; the modal tells me which orgs block deletion and why (transfer admin or remove all members first).
- As the owner of an org with an **active paid subscription**, deletion is blocked until I cancel the subscription via the billing portal.

### After deletion

- I cannot log in — all sessions were revoked and the credentials no longer exist.
- I can sign up again with the same email; the new account is empty (no orgs, courses, or history).

## Functional Requirements

### Surface 1 — Profile settings Danger zone

- New `Field.Set` appended to `features/settings/pages/profile.svelte` (renders on both org settings and LMS settings pages automatically).
- Destructive-styled section (precedent: course settings danger zone) with a single **Delete account** button.
- Independent of the profile form's `Page.SettingsActions` save bar — no unsaved-changes interaction.

### Surface 2 — Confirmation modal

- Custom `Dialog.Root` (not the generic `DeleteModal` — it must render live data).
- On open, fetches `GET /account/deletion-preview` and renders:
  - The list of everything that will be deleted, with real counts (orgs, memberships, enrollments, submissions, comments/posts, certificates, AI chats, login events, active sessions).
  - The consequences copy: irreversible; can't log in again; same email *can* register a new empty account; confirmation email will be sent.
  - A disclosure that **discussions started by the user are removed entirely** — newsfeed posts, community questions, and polls, including other members' replies and votes on them (see Shared-content rule). Other members' own content is never touched.
  - A note that external-service data (PostHog analytics, UserJot feedback identity) is erased **asynchronously** after the account is gone — typically within a few days — and that some providers (Sentry, Umami, email delivery logs) hold data only until their standard retention expires.
  - **Blockers**, if any (sole-admin orgs with members, active subscription) — delete button disabled, each blocker explained with its remedy.
- Confirmation requires **typing the account email**; mismatch keeps the button disabled.
- Confirm shows a loading state while `DELETE /account` runs; failure shows a snackbar error and keeps the modal open.

### Surface 3 — Logout countdown

- On success the modal content switches to: "Your account deletion is in progress. We're logging you out. Once your account has been fully deleted, we'll send a confirmation email to {email}."
- Primary button **"Log out now (5)"** decrements every second (`setInterval` pattern from `verify-email-modal.svelte`); at 0 it calls the existing `logout()`; clicking early does the same.
- Sessions are already revoked server-side, so this is UX affordance, not security mechanism.

### Surface 4 — Confirmation email

- System email (ClassroomIO-branded, **no** org branding, default `EMAIL_FROM`) per the email rules in AGENTS.md.
- Guaranteed by the transactional outbox: the send intent is committed in the same transaction as the deletion (address captured beforehand — the row is gone afterwards) and relayed after commit.
- States what was deleted from the platform, that external-service erasure (PostHog, UserJot) is in progress and completes asynchronously over the following days, that some providers' data expires per their standard retention, and that the email address is free to register again.

## Technical Design

### Data model

**One migration: a `transactional_outbox` table** (see External-service cleanup and durable post-commit work). The teardown itself is ordered delete statements in one transaction — no changes to existing tables. (If a future v2 moves to async deletion with a `pending_deletion` flag, that becomes a second migration.)

### Why ordered teardown is required

DB-level cascades cover only `account` / `session` / `sso_provider` (from `user`) and a few AI/compliance tables (from `profile`). Everything else is `NO ACTION` or `RESTRICT`, so a naive `DELETE FROM "user"` fails. The order below deletes leaves first and the identity roots (`profile`, then `user`) last.

### Deletion order (single `db.transaction`)

**Phase 0 — pre-transaction (input validation only)**

- Load profile; verify typed email matches `profile.email` (case-insensitive) → `400` on mismatch.
- The modal's blockers come from `GET /account/deletion-preview`, which runs the same policy evaluation read-only. A passing preview is **not** a guarantee — policy is enforced again under lock inside the transaction.

**Phase 1 — lock, policy evaluation, classification (first step inside the transaction)**

- `SELECT … FOR UPDATE` the user's `organizationmember` rows, every `organization` row they belong to, and those orgs' `organization_plan` rows, so membership and billing state cannot change between preview and teardown (a member joining or a subscription activating mid-request must not slip through).
- Under that lock, evaluate the org policy (see Org policy). Any blocker → throw `ACCOUNT_DELETION_BLOCKED` (`409`); the transaction rolls back with nothing deleted.
- Capture the transaction inputs later phases need: `solePersonOrgIds` (orgs to tear down in Phase 6), `survivingOrgIds` with their reassignment-target admin (earliest remaining admin by `created_at`), plus `userEmail`, `fullname`, `avatarUrl`, `userId`.
- Classification must complete **before any membership row is deleted** — once Phase 5 removes the user's `organizationmember` rows, the "sole member" evidence is gone.

**Phase 2 — pure user leaf data**

1. `analytics_page_event`, `analytics_login_events` (by `user_id`)
2. `ai_token_usage` (by `user_id`)
3. `ai_tutor_cap_event`, `ai_tutor_message_count`, `ai_agent_run` (cascades steps/events), `ai_chat_conversation` (cascades documents/context)
4. `verification` rows where `identifier` = user email; `waitinglist` rows where `email` = user email
5. Scrub the user's groupmember ids from `reaction` JSONB arrays on `course_newsfeed` / `cohort_newsfeed` / `program_newsfeed`

**Phase 3 — course memberships** (per `groupmember` row; mirror `resetStudentCourseProgress` ordering)

1. `question_answer` → `submission`
2. `group_attendance`, `lesson_comment`
3. Newsfeed: delete **all** `course_newsfeed_comment` rows on the user's posts (any author — shared-content rule), the user's own comments on others' posts, then the user's `course_newsfeed` posts
4. Polls: delete all `apps_poll_submission` and `apps_poll_option` rows on the user's polls (any voter), the user's votes on others' polls, then `apps_poll` rows authored by the user
5. `lesson_video_progress`, `lesson_completion` (by `profile_id`)
6. `course_completion_record` (cascades notification events + `course_certificate_issue`)
7. Delete `groupmember`

**Phase 4 — cohort / program memberships**

1. `cohort_newsfeed_comment` / `program_newsfeed_comment` on the user's posts (any author), then the user's own comments, then the user's authored `cohort_newsfeed` / `program_newsfeed` posts
2. Delete `cohort_member` / `program_member` (goal assignments cascade)
3. Null `cohort.created_by_profile_id`, `program.created_by_profile_id`

**Phase 5 — org memberships**

1. Community: delete all `community_answer` rows on the user's questions (any author), the user's own answers on others' questions, then `community_question` rows authored by the user (by member id and `author_profile_id`)
2. Null `organization_plan.triggered_by`; null invite `accepted_by` / `revoked_by` references
3. Delete `course_invite` and `organization_invite` rows **created by** the user (audit tables cascade)
4. For orgs that **survive**: reassign NOT NULL creator columns (`organization_sso_config`, `organization_token_auth`, `organization_api_key`) to the reassignment-target admin captured in Phase 1
5. Delete `course_import_draft` rows created by the user; null `lesson.teacher_id`
6. Delete `organizationmember` (email-notification prefs cascade)

**Phase 6 — sole-person orgs (full org teardown)**

For each org in `solePersonOrgIds` from Phase 1. If the user owns secondary workspaces, tear those down **before** the primary org — `organization.parent_organization_id` is `SET NULL` on org delete, which would otherwise silently promote surviving secondaries.

Per org, delete in order:

1. Remaining group subtrees: for each `group` in the org, delete remaining `course` rows (course-tree children — sections, lessons, exercises — cascade from `course` where cascades exist; verify each course/group child against the migration SQL at implementation time), then the `group` rows
2. Org-scoped `NO ACTION` children: `quiz`, `community_question` (any remaining, + their answers), `organization_contacts`, `organization_emaillist`, `organization_automation_usage`, `organization_plan`, `ai_credit_balance`, `ai_credit_purchase`, `ai_token_usage`
3. `widget` rows (also satisfies the `RESTRICT` creator/publisher FKs ahead of identity teardown)
4. The `organization` row — remaining children cascade: `cohort`, `program`, org configs (`organization_sso_config`, `organization_token_auth`, `organization_api_key`, `organization_auth_policy`), `organization_invite` (+ audit), `course_import_draft`, `assets` / `asset_usages`, `media_job`, `media_transcript`, `tag` / `tag_group`, `ai_agent_run`, `ai_tutor_*`

Implementation-time guard: regenerate the full list of FKs referencing `organization.id` from the migration SQL and assert every `NO ACTION` child is covered — new org-scoped tables appear often, and a missed one rolls back the entire account deletion.

**Phase 7 — identity**

1. `widget` / `widget_version` rows created or published by the user in surviving orgs — reassign to the Phase 1 target admin or delete (`RESTRICT` blocks `user` deletion otherwise)
2. Delete `profile`
3. Delete `user` → cascades `account`, `session`, `sso_provider`
4. Insert the two outbox rows (confirmation email + external cleanup) **in the same transaction** — see below

Deleting both unique email holders (`user.email`, `profile.email`) is what makes re-registration with the same email work.

### Shared-content rule (threads started by the user)

`course_newsfeed_comment`, `community_answer`, `apps_poll_option`, and `apps_poll_submission` are `NO ACTION` children of the user's authored posts/questions/polls — Postgres rejects deleting a post while any reply exists, whoever wrote it. The contract:

- **The user's own content is always deleted** — their comments, answers, votes, and submissions, regardless of whose thread they're on.
- **Threads the user started are deleted entirely**, including other members' replies/votes on them (newsfeed posts + their comments, community questions + their answers, polls + their options/votes). The modal discloses this before confirmation.
- **Other members' own content is never touched** — their posts, progress, certificates, and their replies on threads the user did *not* start.

This hard-delete rule is the **recommended default, pending product confirmation** (Open Question 2). Anonymize-in-place is technically possible — all three author columns are nullable — but it would either leave the user's words on the platform or require tombstone copy in content columns, which violates the repo's persisted-column rule.

### Org policy

Evaluated under lock in Phase 1, in this order — the subscription blocker always takes precedence over teardown:

| Situation | Behavior |
|---|---|
| User is sole admin of the org **and** the org has an active Polar subscription | **Block** — remedy: cancel the subscription in the billing portal first. Applies even when the user is the only person in the org (an org must never be torn down out from under an active subscription) |
| User is sole admin and other members/students exist anywhere in the org (members, course enrollees, invite participants) | **Block** — error lists the orgs; remedy: transfer admin or remove all members |
| Org has other admins | Remove only the user's data/membership; org and its subscription survive untouched |
| User is the only person in the org, no active subscription | Delete the entire org (Phase 6) |

"Owned" for the subscription blocker means **the user is the org's sole admin** — the sole admin is the de-facto billing owner (only they can cancel or transfer). When other admins exist, no billing check applies because the org survives with its subscription.

### External-service cleanup and durable post-commit work

Database deletion is the guaranteed outcome of the request. Everything in this section happens **after** commit, is **durable** (survives crashes), and completes **asynchronously** — the UI and email copy must say so.

The confirmation email and the external cleanup must survive an API crash or Redis outage between the database commit and the enqueue — BullMQ lives in Redis and today's `enqueueTransactionalEmail` is not transactional with Postgres. Account deletion therefore introduces a minimal **transactional outbox**:

- New table `transactional_outbox` (`id`, `kind`, `payload jsonb`, `status`, `attempts`, `created_at`, `processed_at`) — the only migration in v1. Generic on purpose so other post-commit work can reuse it.
- Phase 7 inserts two outbox rows inside the deletion transaction: `account_deletion_email` (`{ to, name, idempotencyKey }`) and `external_user_cleanup` (`{ userId, email, avatarKey }`). Committing the transaction commits the intents.
- Immediately after commit, a relay enqueues both to BullMQ and marks the rows processed. If the process crashes first, a reconciler sweep on the existing `maintenance` worker (which already runs scheduled jobs) picks up unprocessed rows and enqueues them. Idempotency keys make re-enqueue safe.

The cleanup itself is a new job (e.g. `external-user-data-cleanup`) on the existing `maintenance` queue (`packages/jobs/src/queues/names.ts`, `apps/jobs/src/workers/maintenance.ts`). It never fails the original request; failures are logged and retried.

| Service | Action |
|---|---|
| **PostHog** | `POST https://eu.posthog.com/api/projects/{project_id}/persons/bulk_delete/` with `{ distinct_ids: [userId], delete_events: true, delete_recordings: true }`, Bearer personal API key. New env: `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`. No-op when unset (self-hosted/dev). Event/recording deletion is queued by PostHog and completes asynchronously |
| **UserJot** | Verify against their OpenAPI (`api.userjot.com/v1`) at implementation time; delete what the API supports (comments/votes/requests/member). No documented GDPR endpoint for identified visitor data exists today — if still absent, document the manual step (workspace dashboard / privacy request) and automate the rest |
| **Avatar** | Delete the media-bucket object whose key is parsed from `profile.avatar_url` |
| **Sentry / Umami / ZeptoMail** | No per-user deletion API; data expires with provider retention — document only |

### API surface

| Method | Route | Body | Returns |
|---|---|---|---|
| `GET` | `/account/deletion-preview` | — | `{ success, data: { counts: {...}, blockers: [...] } }` |
| `DELETE` | `/account` | `{ email: string }` | `{ success, data: { email } }` or `409` with blockers |

Both live in `apps/api/src/routes/account/account.ts` (`authMiddleware`; `zValidator('json', ZDeleteAccount)` on the DELETE; `handleError` in catch blocks). `/account` is already mounted in `app.ts` — the single-root-segment rule is preserved. Each route returns a single type.

### Frontend plan (repo layering)

- **Validation**: `ZDeleteAccount` in `packages/utils/src/validation/account/account.ts`.
- **Types**: `features/account/utils/types.ts` — `GetAccountDeletionPreviewRequest = typeof classroomio.account['deletion-preview'].$get`, `DeleteAccountRequest = typeof classroomio.account.$delete`, success/data extraction per conventions. No types in `.svelte.ts` files.
- **API class**: `features/account/api/account.svelte.ts` — `getDeletionPreview()` and `deleteAccount(email)` via `this.execute<...>()`.
- **Components**: `features/settings/pages/profile.svelte` (Danger zone) + new `features/settings/components/delete-account-modal.svelte` (preview, blockers, type-email confirm, countdown state). Components stay thin.
- **Translations**: `settings.profile.danger_zone.*`, `delete_account_modal.*`, `snackbar.account.*` in `en.json`; run `pnpm translate`, verify `{placeholders}` survive, then `pnpm format:changed`.

## Implementation Order

1. **Email** — `packages/email/src/emails/account-deleted.ts` (`defineEmail`, schema `{ name }`, `getDefaultTemplate(content)` without branding); register in `emails/index.ts` + `EMAIL_IDS`. Verify: `pnpm --filter @cio/email build`.
2. **Validation + routes skeleton + outbox migration** — `ZDeleteAccount`; `transactional_outbox` table migration; `GET /account/deletion-preview` (real counts/blockers) and `DELETE /account` wired to a service shell. Verify: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`.
3. **Teardown queries + service** — `packages/db/src/queries/account-deletion/` (one file per phase), in-transaction policy evaluation under lock, single-transaction orchestration, outbox inserts + post-commit relay. Verify: api build + manual `psql` spot-checks on a seeded throwaway account.
4. **External cleanup job** — BullMQ job + worker registration + reconciler sweep + env vars + avatar object deletion + UserJot verification. Verify: job logs on the seeded VM, incl. a killed-between-commit-and-relay recovery test.
5. **Dashboard UI** — Danger zone, modal (preview/blocked/countdown states), translations. Verify: `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`, `pnpm format:check`.
6. **Prototype** (house convention) — `prototypes/account-deletion/` HTML screens; reconcile any drift with this PRD.
7. **End-to-end verification** — acceptance criteria below on the seeded VM.

All `pnpm` commands with Node 20: `export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"`.

## Acceptance Criteria

1. A user with memberships, enrollments, submissions, comments, certificates, and AI chats can delete their account from Profile settings; afterwards **zero rows** reference their `user_id`/`profile_id`/member ids in any table listed in the deletion order, and `psql` spot-checks confirm it.
2. `user`, `profile`, `account`, `session`, `sso_provider`, and `verification` rows for the user are gone; `verification`/`waitinglist` rows keyed by the email are gone.
3. The user **cannot log in** with the deleted credentials (all sessions revoked).
4. The user **can sign up again with the same email**; the new account has no orgs, courses, or history.
5. The confirmation modal shows live counts matching reality and blocks with a clear, per-org explanation when the user is sole admin of a non-empty org or of an org with an active subscription; the modal copy discloses thread removal and asynchronous external erasure.
6. A sole founder's org is fully deleted with the account — `psql` confirms zero rows referencing the org id anywhere, including `organization_contacts`, `organization_emaillist`, `quiz`, `organization_automation_usage`, `organization_plan`, `ai_credit_balance` / `ai_credit_purchase` / `ai_token_usage`, groups, courses, widgets, invites, and configs. Secondary workspaces owned by the user are torn down before the primary.
7. A member of a shared org is deleted **without** affecting other members' **own** content, progress, certificates, or org settings (NOT NULL creator columns reassigned, not deleted). Threads the deleted user started (newsfeed posts, community questions, polls) are removed entirely, including others' replies/votes on them — and the modal disclosed this.
8. After confirming, the countdown state appears; clicking the button or reaching 0 logs the user out to `/login`.
9. The `accountDeleted` email intent is committed in the same transaction (outbox row) and the email is received (email worker log in dev). Killing the API process between commit and relay still results in delivery via the maintenance reconciler — same for the external-cleanup job.
10. With `POSTHOG_PERSONAL_API_KEY`/`POSTHOG_PROJECT_ID` set, a `bulk_delete` call fires with the user's distinct id; without them, cleanup no-ops cleanly (self-hosted safe). Request success never depends on an external service.
11. The avatar object is removed from the media bucket.
12. Policy is enforced inside the transaction: if membership or billing state changes between preview and confirm (simulated by a concurrent write), deletion aborts with `409` and rolls back completely — no partial deletes.
13. Zero regressions on existing features (profile update, workspace deletion, logout, signup, login all still work).
14. All user-facing copy uses translation keys; other locales generated via `pnpm translate` with placeholders intact.
15. `pnpm --filter @cio/api build`, `pnpm --filter @cio/dashboard build`, and `pnpm format:check` pass.

## Success Metrics

- **Support deflection:** "please delete my account" tickets trend to ~0 within a month of launch.
- **Completion rate:** % of users who open the modal and complete deletion (expect low — the preview should make the consequences clear enough that unsure users back out).
- **Error rate:** deletion requests failing with 5xx ≈ 0; any `409` blocker is a product success, not a failure.
- **Re-signup:** same-email re-registration works 100% of the time (guarded by criterion 4).

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Partial deletion leaves FK violations or orphaned rows | Single transaction = all-or-nothing; ordered phases derived from the actual FK graph; Phase 6 includes a migration-SQL audit guard so new org-scoped tables can't be missed; acceptance criteria 1 and 6 verify completeness |
| Membership/billing state changes between preview and teardown | Policy is re-evaluated under `FOR UPDATE` locks inside the transaction; mismatch aborts with `409` and rolls back (criterion 12) |
| Crash between DB commit and job enqueue loses the confirmation email / external cleanup | Transactional outbox: intents committed with the deletion, relayed after commit, reconciled by the maintenance worker; idempotency keys make re-enqueue safe (criterion 9) |
| Long transaction on accounts with lots of data | Typical single-user data is small; if pathological accounts appear, v2 moves teardown to a background job with a `pending_deletion` flag (requires a migration) |
| better-auth cookie cache (1h) serves a stale session after deletion | Client calls `signOut()` immediately; dashboard already force-logs-out when account load fails; sessions are DB-deleted regardless |
| Sole-admin policy frustrates users who just want out | Modal explains exactly which orgs block and the remedy; support can still force-delete manually |
| UserJot has no per-user deletion API | Verify at implementation time; automate what exists, document a manual step for the rest, revisit when their API adds it |
| PostHog event deletion is asynchronous (their batch window) | Modal and email copy set the expectation ("analytics removal completes within a few days") |
| Thread deletion removes other members' replies on the deleted user's posts | Explicit product rule (Shared-content rule), disclosed in the modal before confirmation; anonymize-in-place remains possible later if product reconsiders — all three author columns are nullable |
| Over-promising external erasure (provider limits) | Copy guarantees database deletion only; external erasure is described as asynchronous/best-effort with provider-retention notes (Confirmed Decision 8) |

## Open Questions

1. **Confirmation strength** — typed email (planned) vs password re-entry. Typed email planned; password re-entry is the stricter alternative.
2. **Shared content** — **recommended default applied throughout this PRD**: hard-delete threads the user started, including others' replies/votes on them; never touch others' own content. The alternative is anonymize-in-place (nullable author columns make it feasible, but tombstone copy in content columns violates the persisted-column rule, and it keeps threads the user started on the platform). Confirm or veto.
3. **Sole-admin-with-members orgs** — block (planned) vs offer "delete the whole organization" inline in the modal.
4. **Active subscriptions** — block until cancelled (planned; blocker takes precedence even for sole-person orgs) vs auto-cancel via the Polar API during teardown.
5. **Self-hosted parity** — feature works in both modes (external calls no-op without keys); confirm we document the PostHog env vars for cloud operators only.

## Out of Scope

- Account recovery / undo.
- Data export (takeout) before deletion.
- Admin dashboard for deleting other users.
- Changes to workspace deletion (remains a separate flow for secondary orgs).
