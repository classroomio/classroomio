# Workshops PRD

## Purpose

Enable organizations to publish one-off video training sessions — webinars, recorded talks, live events — without building a full course. A Workshop is a course with exactly one lesson: one video (YouTube embed or upload) plus optional rich text and a callout CTA. Workshops get their own admin surface, public catalog, landing-page section, and LMS entry, while reusing the entire course machinery underneath.

Reference products:

- Cursor Workshops: <https://cursor.com/workshops> — card grid with title, host ("By AJ Valenty" + headshot), upcoming date or duration; grouped into "Upcoming events" (Luma registration) and "On-demand sessions" (YouTube links, grouped by topic).
- Ona webinar pages: public event detail plus a lead-capture form before an on-demand recording.
- Our differentiation: cards link to an **internal** workshop page (video + text + callout on the org's branded site) instead of sending visitors to YouTube/Luma. Admins can make the recording public or gate it with a native ClassroomIO Form; verified registration grants LMS access.

## Prerequisites

**Workshops is not implemented yet.** Form-gated registration additionally depends on the **Forms product MVP** (`prd/forms-product/README.md`) being shipped first. Do not start workshop delivery until Forms supports standalone form CRUD, public/authenticated runners, the attachment model, response inbox, and the integration loops already defined there (purchase-request pipeline, per-lesson pulse).

Workshops is the first consumer of a **verified-email access-grant** capability that Forms does not ship in its baseline MVP. The extensions below are workshop-driven additions to Forms — specify them here, implement them in the Forms codebase before or alongside workshop form-gating, and keep `prd/forms-product/README.md` free of workshop-specific product scope.

### Required Forms extensions (workshop-driven)

1. **New attachment context** — add `WORKSHOP` to `form_attachment.context_type`, referencing the workshop course via `course_id`. Attachment `settings` carry `accessPolicy: 'public_registration' | 'existing_members_only'`. Enforce with a DB check/enum plus a constraint that `WORKSHOP` rows point at a `course.type = 'WORKSHOP'` row.
2. **Attachment-level settings are authoritative** — lifecycle window, response limit, and one-response-per-respondent are read from the attachment, not conflicting `form` columns. Workshop services must never read timing/limit fields from the reusable form row.
3. **Context overrides on submit** — for `WORKSHOP` attachments, the runner/submission service forces `collect_email = true`, `allow_anonymous = false`, and rejects submissions without a normalized `respondent_email` before creating an access grant.
4. **`form_response_access_grant` table** — recipient-bound, expiring, single-use grants linked to `form_response_id` and `form_attachment_id`. Store only SHA-256 `token_hash`. Enforce at most one **active** (unredeemed, unrevoked, unexpired) grant per `(form_response_id, recipient_email)` with transactional locking on resend/redeem.
5. **Scanner-safe redemption** — `GET /forms/access/:token` renders a confirmation interstitial and must not consume the grant. `POST /forms/access/:token/redeem` performs redemption. Both endpoints use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and a one-time token-to-session exchange so the bearer token does not remain in the URL after the handoff.
6. **PII retention** — define purge/anonymization for `recipient_email` and grant audit events: expired unredeemed grants after 30 days, redeemed grants after 90 days (audit metadata only), revoked grants after 30 days.
7. **Shared attach picker** — extend the Forms "Attach a form" picker so the workshop editor can list/create/attach forms without leaving the page. Workshop owns the editor shell; Forms owns the picker and attachment APIs.

Workshop services own the **consequence** after redemption (identity reconciliation, org membership, workshop enrollment, session start, redirect to `/workshops/[slug]`). Forms owns grant creation, email dispatch hook, and redemption verification.

## Problem Statement

Orgs that run trainings and webinars have single-video content that doesn't fit the course model:

- Creating a course for one video forces them through the full course builder (sections, lessons, exercises, certificates) for content that is "watch once."
- There is no public surface for a webinar library — no host attribution, no upcoming-event registration, no duration-first card layout.
- Teams currently send audiences to YouTube or Luma, losing branding, lead capture, and the conversion callout.

## Confirmed Decisions

1. **A Workshop IS a course** — a new `WORKSHOP` value in the existing `COURSE_TYPE` enum, with exactly one auto-created lesson. No new table. (All three candidate plans — claude/codex/composer — converged on course reuse; the enum-vs-`contentKind`-column debate was settled by evidence: the `type === 'PUBLIC'` anonymous-access audit is 7 occurrences in 3 files, and a second classification axis would need a new column, CHECK constraints, and parallel filter plumbing.)
2. **The lesson row is the event.** Host = `lesson.teacherId` (existing FK → `profile.id`); schedule = `lesson.lessonAt` (nullable — workshop creation writes `null` explicitly for on-demand); meeting link = `lesson.callUrl`; recording = `lesson.videos`. No relational IDs in JSONB.
3. **Lifecycle is derived, never stored**: `draft` (unpublished) → `upcoming` (published, `lessonAt` future) → `live` (inside `lessonAt + durationMinutes`) → `replay-pending` (past, no video) → `on-demand` (published video exists). No status field that can go stale.
4. **Watch gating is the admin's choice per workshop**: public (anyone watches, no login) or form-gated. Public maps to the lesson `public` flag. Form-gated requires one active `WORKSHOP` form attachment and withholds the video and meeting link until registration is verified.
5. **Form submission starts registration; redeeming the email completes enrollment.** The attached ClassroomIO Form collects the admin-configured fields. A successful submission stores a pending response and sends an org-branded access email to the submitted address. ClassroomIO does not enroll or create an account from an unverified address. Redeeming the emailed access grant proves ownership, atomically creates or reconciles the learner identity and org membership, enrolls the learner in the workshop group, starts a session, and redirects to `/workshops/[slug]`. Existing learners are reconciled by normalized email, so the flow never creates a duplicate account.
6. **Topics = existing course tags.** On-demand lists group by tag; untagged fall into "General".
7. **Workshops and courses never mix**: excluded from the courses catalog, admin course list, course-type filters, the course create modal, and LMS My Learning / progress / certificate lists. (A workshop certificate issued by a passed assessment — decision 9 — is delivered by email and downloadable from the workshop page; it does not enroll the workshop into LMS progress/completion surfaces.)
8. **v1 scope is all four surfaces**: admin, public org-site pages, landing-page section (all 10 themes), LMS entry. Form-gated registration is part of v1 but ships only after the Forms prerequisites above are complete.
9. **Post-session assessment (CE mode) is post-v1 (Phase 5)** — an admin can enable exactly one assessment on a workshop — a quiz with a pass percentage (default 80%) — and registrants who pass are automatically issued a certificate. The grading, pass-gate, and certificate machinery already exist on courses. Off by default and **not in the initial workshop launch**; Phase 1 metadata reserves the `assessment` slot so Phase 5 needs no migration.
10. **Calendar invites ship in v1, after verified redemption** — `.ics` generation (`packages/email/src/ics.ts` `buildSessionIcs`) already works for `LIVE_CLASS` courses. For scheduled workshops, the initial "check your email" message must **not** include a calendar attachment or meeting link — that would bypass redemption. After successful grant redemption, send a follow-up org-branded email (or append to the redemption success path) with the `.ics` containing title, time, join link, and default reminders. On-demand workshops skip calendar metadata.
11. **Internal-audience workshops need an explicit form access policy.** A form-gated public registration is intentionally a lead-capture/signup path, even when org-wide signup is disabled. For internal training, the workshop attachment must support `existing_members_only`; redemption then requires the submitted email to match an existing organization member. The admin UI must make this distinction explicit. Public (no-login) playback still bypasses `disableSignup`, so selecting it on a closed org requires a warning.
12. **Zero-friction internal delivery is a real, separate feature — deferred.** Even with the combination above, an existing employee still submits or redeems the registration form once (having an org account ≠ having a `groupmember` row on that specific workshop). True zero-click delivery — the workshop just appears already-registered for every teammate — needs a new `metadata.workshop.audience: 'public' | 'organization'` setting that auto-enrolls every current `organizationmember` (role ≥ STUDENT) into the workshop's group on publish, and auto-enrolls new hires as they join (mirroring the existing `autoJoinOrg` pattern). Out of v1; tracked as a Later item, not built alongside decisions 1–8.

## Current-State Audit

| Workshop concept | Existing storage / code | Notes |
| --- | --- | --- |
| Title, description, cover, slug, publish | `course` table | `type` enum at `packages/db/src/schema.ts:27`, values from `packages/utils/src/constants/course-type.ts` |
| Org linkage + enrollment | `course.groupId` → `group.organizationId`; `groupmember` rows | Registration = student groupmember |
| Video / rich text / documents | `lesson.videos` (jsonb, incl. duration metadata), `lesson.note`, `lesson.documents` | Already the exact workshop content shape |
| Host | `lesson.teacherId` FK → `profile.id` (`lesson_teacher_id_fkey`, schema.ts:1033) | Real constraint; barely used today |
| Schedule | `lesson.lessonAt` (nullable, `defaultNow()` only when omitted) | Session queries, ICS invites (`services/course/session-invite.ts`), and the reminder job (`session-reminder-scan.ts`) already key on it — reminder scan is gated by one `type = 'LIVE_CLASS'` condition |
| Meeting link | `lesson.callUrl` | Must never appear in anonymous API payloads |
| Conversion CTA | `course.callout` + `packages/ui/src/custom/public-course/callout` | Built for PUBLIC courses |
| Anonymous viewing pipeline | `packages/db/src/queries/course/public-course.ts` + `apps/api/src/routes/org-site/public-course.ts` + HLS cookie | Gated `type = 'PUBLIC'` today — widen to include WORKSHOP |
| Student lesson renderer | `packages/ui/src/custom/public-course/lesson-view.svelte` | Video + note + callout; exactly the workshop page |
| Host render pattern | `packages/ui/src/custom/org-landing-page/course-instructor.svelte` | Name + role + image |
| Enrollment flow | `(org-site)/course/[slug]/enroll` + `POST /course/:courseId/enroll` | Handles login redirect, student limits, email verification, invite tokens |
| Landing pages | 10 themes in `packages/ui/src/custom/org-landing-page/<theme>/`; props built in `apps/dashboard/src/lib/features/org/utils/landing-page.ts`; config JSON on `organization.landingpage` | Sections hardcoded per theme's `org.svelte`; shared token-styled components are precedented (callout, links, instructor) |
| Catalog + filters | `(org-site)/courses` + `getPublishedCoursesBySiteName` (accepts `types`) | No default type exclusion today — workshops would leak in without Phase 1 filters |
| Team members (host picker) | `GET /organization/team` → `OrgTeamMember` | Lacks `avatarUrl` — add via profile join |

**Key insight**: `lesson` already holds who (`teacherId`), when (`lessonAt`), where (`callUrl`), and the recording (`videos`) — all relational. The feature is a product layer (type value, routes, simplified admin, catalog), not a new content entity.

## Product Goals

1. An admin can create, edit, and publish a workshop from a dedicated, simple editor — never touching the full course builder.
2. Visitors browse a branded `/workshops` catalog: Upcoming events (date, Register) and On-demand sessions grouped by tag (duration, Watch).
3. Each workshop has a stable public page (`/workshops/[slug]`) through every lifecycle state: registration page before the event, replay page after.
4. Hosts are org team members, shown with name + avatar on cards and detail pages.
5. Registration is native: attached form → access email → verified redemption and enrollment → recording or meeting link.
6. Orgs can showcase workshops on their landing page (all 10 themes) with a section toggle, heading, and item limit.
7. Learners see their registered/available workshops in the LMS, linking to the org-site workshop page.
8. Courses and workshops remain fully separated in every list, filter, count, and progress surface.
9. _(Post-v1 / Phase 5)_ An admin running certified trainings (CE) can enable a post-session assessment: registrants take the quiz on the workshop page after the session, it is auto-graded, and everyone at or above the pass percentage is automatically issued and emailed a certificate.

## Non-Goals (v1)

- Paid workshops (course pricing plumbing exists; deferred).
- Capacity limits, waitlists, and approval.
- Rescheduling/cancellation calendar updates — `buildSessionIcs` supports `method: 'CANCEL'` but no caller wires it today; a rescheduled or cancelled workshop does not yet push an updated/cancelled calendar event to prior registrants.
- Zero-click internal-audience auto-enrollment (`metadata.workshop.audience` — see Confirmed Decision 12).
- Multiple hosts per workshop; replay-available notifications; workshop analytics dashboards; dedicated topic taxonomy (tags suffice); landing-page section reordering (no section-ordering system exists — the section renders after courses).
- Post-session assessment and certificates (Phase 5 CE mode — see Confirmed Decision 9).
- External registration URL / Luma escape hatch (`registrationUrl`).
- Assessment extras beyond one quiz + pass mark + certificate: multiple assessments, retake limits, timed tests, manual grading, attendance verification before the quiz unlocks, accreditation-body reporting.

## Data Model

- Add `'WORKSHOP'` to `COURSE_TYPE_VALUES` (`packages/utils/src/constants/course-type.ts`); the pgEnum, Drizzle types, and Zod mirror follow from that one edit. Schema work stops at a passing `@cio/db` build (migrations handled outside this workflow).
- Course `metadata` gains scalar settings only: `workshop?: { durationMinutes?: number; accessMode?: 'public' | 'form'; assessment?: { enabled: boolean; passPercentage: number } }`. Form-gated workshops resolve the attached form through the active `WORKSHOP` `form_attachment`, not duplicated in course JSON. `accessMode: 'form'` requires a published `WORKSHOP` attachment before publish.
- Workshop creation (one transaction): group + course (`type: 'WORKSHOP'`) + creator tutor member + the single lesson (title = course title, `public` per gating choice, explicit `lessonAt`, `teacherId` = host, slug via the slug service). No welcome newsfeed.
- **Invariants enforced in services, not just UI**: lesson/section create services reject additions to WORKSHOP courses. Exercise creation is likewise rejected, with one controlled exception: the workshop assessment service may create **exactly one** exercise on the single lesson when `assessment.enabled` is turned on (and general exercise routes still reject workshop courses — the assessment service is the only entry point). Publish readiness (extend `go-live-readiness.ts`): title + host required; upcoming needs `lessonAt`; on-demand needs a playable video.
- **Security**: anonymous payloads never contain `callUrl`; an authed membership check returns it for enrolled users (and drives the "Registered ✓ / Join" card state).
- **Form binding**: extend Forms `form_attachment.contextType` with `WORKSHOP`; the attachment references the workshop course, carries `accessPolicy: 'public_registration' | 'existing_members_only'`, and is the source for lifecycle, response-limit, and dedup settings. A form remains reusable; every response records the workshop attachment through which it was submitted.
- **Access grants** (Forms extension — see Prerequisites): submission creates or replaces a recipient-bound, single-use grant linked to the form response and workshop. Workshop redemption handler runs only after Forms verifies the grant via `POST`. Redemption is transactional and idempotent across identity reconciliation, org membership, workshop enrollment, and grant consumption.
- **Calendar invite reuse**: after successful redemption for a scheduled workshop, reuse `buildSessionIcs` from `services/course/session-invite.ts` in a follow-up confirmation email that includes title, time, join link, and reminders (see Confirmed Decision 10). The initial access email contains only the redemption link — no `.ics`, no `callUrl`.
- **Admin footgun guard**: the workshop editor's gating toggle warns (or blocks) selecting "public, no login" when the org has `disableSignup` enabled, since that combination silently exposes the workshop to anyone despite the org's closed-signup intent (see Confirmed Decision 11).

## API

Dedicated thin router delegating to shared course/lesson/group/tag services (single response type per route, per repo conventions):

```text
POST /workshop                     — atomic create, returns course + lesson
GET  /workshop/:id                 — course + lesson + derived state (editor shape)
PUT  /workshop/:id                 — transactional course + lesson update; publish folds in

GET  /org-site/workshops           — public list: course + lesson join (duration, slug)
                                     + profile join on teacherId (host name/avatar),
                                     tags, derived state; callUrl stripped
GET  /org-site/workshops/:slug     — public detail; lesson body/HLS reuses the existing
                                     public-course item endpoint + HLS cookie
```

No `DELETE /workshop` (course delete works). Default course queries (`getPublishedCoursesBySiteName`, counts, admin org-courses) exclude `type = 'WORKSHOP'`; the 3-file `type === 'PUBLIC'` anonymous pipeline is widened to admit WORKSHOP.

## User Experience

### Admin (`/org/[slug]/workshops`)

- New "Workshops" entry in the org sidebar (`content` group, beside Courses).
- List page: cards with title, host, derived-state badge, published status.
- Single-page editor (`/workshops/[id]`) — no course sidebar: title, description, host picker (team members from `GET /organization/team`, which gains `avatarUrl`), schedule (`lessonAt` + `durationMinutes`), video + rich-text note (reusing `features/course/components/lesson/` `video/*` and `note/*` by hydrating the existing lesson store), callout, tags, access toggle, publish.
- Form-gated mode uses the Forms product's "Attach a form" picker (Forms prerequisite). The admin can choose an existing form or create an event-registration form in context, configure public-registration vs existing-members-only access, and preview the gate without leaving the workshop editor.
- Assessment section (**Phase 5 only**): enable toggle, pass percentage (default 80), and the quiz builder (reusing the existing exercise question editor against the single lesson's one exercise). Enabling requires form-gated access — anonymous viewers can't take a graded, certificate-issuing test. Results view lists registrants with score, pass/fail, and certificate status.
- `/courses/[id]` for a workshop-typed course redirects to `/workshops/[id]`.

### Public org site

- `/workshops` — full catalog: **Upcoming events** (date, Register; "Join" while live) then **On-demand sessions grouped by tag** (duration, Watch; "Replay coming soon" for replay-pending). Theme tokens via the same pattern as `/courses`.
- `/workshops/[slug]` — stable URL through every state: host header (`course-instructor.svelte` pattern) + `lesson-view.svelte` (video, note, callout). Public → plays for anyone; form-gated → renders the attached form; verified/enrolled → plays the recording or shows the meeting link. Admin adds the recording after the event and the same page becomes on-demand automatically.
- With an assessment enabled, registered users see a "Take the assessment" section on the same page once the session is past (or on-demand video watched for evergreen enrollees): quiz → auto-grade → pass ≥ threshold → certificate emailed + downloadable there; below threshold → score shown with the org's contact path. Anonymous visitors see that a certificate assessment exists (conversion hook) but must register.
- Org-site nav shows a Workshops link when the org has published workshops.

### Form-gated registration and access flow

1. An anonymous visitor opens `/workshops/[slug]`; public metadata renders, but video playback and `callUrl` do not.
2. The page renders the attached ClassroomIO Form. Email is mandatory for a workshop registration form even if the reusable form otherwise allows anonymous responses.
3. Submit persists a pending form response, applies the attachment's limits/dedup rules, and sends an org-branded "Watch workshop" email containing **only** the redemption link (no meeting link, no calendar attachment). The browser shows a neutral "Check your email" state and must not reveal whether that address already has an account.
4. The email link opens an interstitial without consuming the token. The visitor selects "Watch workshop"; a `POST` redeems the grant, verifies the email, reconciles or creates the learner, adds org/workshop membership idempotently, signs in, and redirects to the stable workshop page. The bearer token is exchanged for a session cookie and cleared from the URL (`no-store`, `no-referrer`).
5. For scheduled workshops, redemption triggers a follow-up confirmation email with the `.ics` calendar attachment (title, time, join link, reminders). On-demand workshops skip calendar metadata.
6. The enrolled learner watches on the org-site workshop page and sees the workshop in `/lms/workshops`. The LMS is the identity/access layer, not a second copy of the recording.
7. Resubmitting the same normalized email returns the same generic success state and sends a replacement grant subject to cooldown/rate limits. It must not create duplicate responses, members, or enrollments.

Use a workshop-specific org-branded template for both the access and post-redemption calendar emails rather than overloading the generic course-welcome wording.

### Landing page (all 10 themes)

Flow mirrors the courses section exactly:

1. Admin enables it in the landing-page editor (new `workshops-section.svelte` panel) → writes `landingpage.workshops = { show, title?, subtitle?, itemLimit? }`.
2. Org root `+page.server.ts` fetches `GET /org-site/workshops` (capped at `itemLimit`) only when `show` is true, in parallel with the courses fetch.
3. `buildOrgLandingPageProps` gains `workshops`; `mapPublicWorkshopsToLandingPageWorkshops` maps API rows → `WorkshopItem[]` (id, slug, title, host name + avatar, precomputed lifecycle state).
4. Each theme's `org.svelte` gets a small conditional block rendering a **shared token-styled** `workshops-section.svelte` + `workshop-card.svelte` (`--landing-*` vars only). The theme loader prefers a theme-local `workshop-card.svelte` when a theme ships one — none required for v1; themes with strong card identity get bespoke variants incrementally.
5. Section renders only when enabled AND workshops exist; "View all" links to `/workshops`. Position is fixed after the courses section.

### LMS

- "Workshops" nav entry → `/lms/workshops`: registered upcoming/live workshops + the org's published on-demand workshops. Cards link to the **org-site** workshop URL (tenant-origin helper) — the LMS does not render workshops through the course lesson shell.
- Workshops are excluded from My Learning, progress totals, completion/certificate lists.

## Open Questions

1. **Do verified workshop registrants count toward the org's plan student limit?** Grant redemption creates a student `groupmember`, and `studentLimitReached` can block access after a person has already submitted the form. Recommendation: workshop-only members should not consume paid LMS seats unless they later enroll in a normal course; enforce separate registration/rate limits to prevent abuse.
2. What should the default access-grant lifetime be? Recommendation: 24 hours with a rate-limited resend; once redeemed, the normal authenticated session and enrollment govern future access.
3. **Assessment certificate template** (Phase 5): reuse the existing course certificate templates as-is, or does a workshop certificate need its own fields (session date, host, duration/credit hours)? CE buyers may need credit hours printed — verify against a real CE customer's certificate before building.
4. Should the "public gating on a signup-disabled org" case (Confirmed Decision 11) hard-block save, or just show a warning the admin can dismiss? Recommendation: warn, don't block — an org might legitimately want one public workshop as a lead magnet while keeping account signup closed.
5. Is zero-click internal auto-enrollment (Confirmed Decision 12 / `metadata.workshop.audience`) worth pulling into v1, or does `existing_members_only` form-gated access cover internal-training customers well enough for launch?

## Phased Delivery

**Phase 0 — Forms prerequisites** (blocks form-gated workshops): ship Forms MVP per `prd/forms-product/README.md`, then implement the workshop-driven Forms extensions listed in Prerequisites (attachment context, access grants, redemption routes, attach-picker extension). Public-only workshops can proceed to Phase 1 in parallel if form-gating is deferred, but the full webinar registration flow cannot ship until Phase 0 is complete.

**Phase 1 — Data model & backend**: enum value; `metadata.workshop` settings; `createWorkshop` service; invariant guards + publish readiness; widen the PUBLIC anonymous pipeline; exclusions everywhere (courses catalog default, admin list, LMS student queries, filter UIs, create modal); `/workshop` + org-site routers; team `avatarUrl`.

**Phase 2 — Admin surface**: sidebar entry; list + single-page editor reusing lesson video/note components; host picker; schedule; public/form access toggle; Forms attach/create picker (after Phase 0); translations (`en.json` + `pnpm translate`).

**Phase 3 — Public org-site**: `/workshops` catalog (Upcoming / On-demand-by-tag); `/workshops/[slug]` detail; embedded form gate; check-email state; scanner-safe grant redemption, token-to-session exchange, and redirect; post-redemption calendar email for scheduled workshops; org-site nav link.

**Phase 4 — LMS + landing**: `/lms/workshops`; shared landing section + card with per-theme override hook; `OrgLandingPageJson.workshops` config; editor panel; 10 theme `org.svelte` conditional blocks; storybook fixtures; `ui:` prefix checks.

**Phase 5 — Assessment & certificates (CE mode, post-v1)**: `metadata.workshop.assessment`; assessment service (sole entry point that may create the single exercise); editor assessment section + results view; workshop-page assessment flow (quiz → auto-grade → pass gate → certificate email + download); certificate stays out of LMS progress/completion lists.

**Later**: reschedule/cancel calendar updates (`method: 'CANCEL'` wiring), `metadata.workshop.audience` zero-click internal auto-enrollment, paid workshops, capacity/waitlists, replay notifications, workshop analytics, multiple hosts, featured collections, assessment extras (retakes, timing, attendance gating, accreditation reporting).

## Verification

- Builds per repo rules: `@cio/db`, `@cio/api` (+deps), dashboard (+deps); `pnpm format:check`; `pnpm --filter @cio/ui prefix:check`.
- Service tests: create yields exactly one course/group/tutor-member/lesson; second lesson/section/exercise rejected; course queries exclude workshops and vice versa; lifecycle derivation covers all five states; anonymous payloads never contain `callUrl`.
- E2E (two browser profiles — admin window vs incognito `?org=udemy-test`):
  1. Admin: create → video + note + team-member host → publish. Not in Courses list; not in the course create modal.
  2. Incognito: landing section (after enabling) → `/workshops` → card (host avatar + duration) → detail plays video, callout renders.
  3. Gating: form-gated → submit custom registration form → generic check-email state → open email interstitial → confirm with `POST` → returned to the workshop page with video access; learner absent from LMS My Learning, present under `/lms/workshops`.
  4. Upcoming: future `lessonAt` + `callUrl` → "Upcoming events" card with date; submit form → redeem access email (no `.ics` in initial email) → post-redemption calendar email with `.ics` (title, time, join link, reminders); call link visible only to enrolled; anonymous API response contains no `callUrl`. Add recording after the date → same URL now on-demand.
  5. Security: verify form submission alone creates no account/enrollment; tokens are stored only as hashes; link-scanner `GET` does not consume the grant; token is cleared from URL after session exchange; first confirmation enrolls and signs in; repeat confirmation is idempotent; resend revokes the old grant; expired/wrong-recipient grants fail generically; video and `callUrl` remain unavailable before redemption.
  6. Internal-only: set the workshop attachment to `existing_members_only` → a non-member email receives no usable access while an existing member redeems normally. Re-run with public playback → confirm the admin UI surfaces the closed-org exposure warning.
  7. Assessment (Phase 5, post-v1): enable assessment + 80% pass mark → registered student takes quiz on the workshop page → scoring above threshold emails a certificate and shows the download; scoring below shows the score with no certificate; a second exercise cannot be created through any route; the workshop still absent from LMS My Learning and completion/certificate lists.
