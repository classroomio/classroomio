# Events PRD

## Purpose

Enable organizations to publish one-off sessions — webinars, livestreams, workshops, bootcamps, recorded talks — without building a full course. An Event is a course with exactly one lesson: one video (YouTube embed or upload) plus optional rich text, resources, and a callout CTA. Events get their own admin surface, public catalog, landing-page section, and LMS entry, while reusing the entire course machinery underneath.

**A webinar is a format of Event, not a separate product.** The product noun is Event; `webinar`, `livestream`, `workshop`, and `bootcamp` are formats rendered as a badge and a catalog filter.

Reference products:

- OpenAI Academy events: <https://academy.openai.com/public/events> — one `/events` catalog filtered by `All / Upcoming / Now / Past`, format badges (`LIVESTREAM`), topic tags, and a detail page with countdown, time range with timezone, delivery ("Online"), organizer, Register, and Add to calendar. Past events keep their page and gain slides/handouts.
- Cursor Workshops: <https://cursor.com/workshops> — card grid with title, host ("By AJ Valenty" + headshot), upcoming date or duration; grouped into "Upcoming events" (Luma registration) and "On-demand sessions" (YouTube links, grouped by topic).
- Ona's webinar pages: public event detail plus a lead-capture form before an on-demand recording.
- Our differentiation: cards link to an **internal** event page (video + text + callout on the org's branded site) instead of sending visitors to YouTube/Luma. Admins can make the recording public or gate it with a native ClassroomIO Form; verified registration grants LMS access.

## Prerequisites

**Events is not implemented yet.** Form-gated registration additionally depends on the **Forms product MVP** (`prd/forms-product/README.md`) being shipped first. Do not start event delivery until Forms supports standalone form CRUD, public/authenticated runners, the attachment model, response inbox, and the integration loops already defined there (purchase-request pipeline, per-lesson pulse).

Events is the first consumer of a **verified-email access-grant** capability that Forms does not ship in its baseline MVP. The extensions below are event-driven additions to Forms — specify them here, implement them in the Forms codebase before or alongside event form-gating, and keep `prd/forms-product/README.md` free of event-specific product scope.

### Required Forms extensions (event-driven)

1. **New attachment context** — add `EVENT` to `form_attachment.context_type`, referencing the event course via `course_id`. Attachment `settings` carry `accessPolicy: 'public_registration' | 'existing_members_only'`. Enforce with a DB check/enum plus a constraint that `EVENT` rows point at a `course.type = 'EVENT'` row. **Tenant and uniqueness invariants** (transactional on attach/replace): the `form`, `form_attachment`, referenced `course`, `course.group`, and `organization_id` must all belong to the same organization. Allow at most one **active** `EVENT` attachment per event course — attaching a new form deactivates/replaces the prior attachment so "the" attachment is unambiguous for gating, grants, and publish readiness.
2. **Attachment-level settings are authoritative** — lifecycle window, response limit, and one-response-per-respondent are read from the attachment, not conflicting `form` columns. Event services must never read timing/limit fields from the reusable form row.
3. **Context overrides on submit** — for `EVENT` attachments, the runner/submission service forces `collect_email = true`, `allow_anonymous = false`, and rejects submissions without a normalized `respondent_email` before creating an access grant. Reject submission when the org's student limit is reached (`studentLimitReached`), with a clear respondent-facing error — do not create a response or send an access email. **Student-limit contract (single strategy)**: under an organization-level student-limit lock, **reserve one seat transactionally** when the response and grant are created; release the reservation if the grant expires unredeemed or is revoked before redemption; consume the reservation during successful redemption when membership and enrollment are created. Do not offer a separate redemption-only recheck path — the reservation is the capacity hold. Concurrent submission/redemption tests must prove the org never exceeds its student limit.
4. **`form_response_access_grant` table** — recipient-bound, expiring, single-use grants linked to `form_response_id` and `form_attachment_id`. Store only SHA-256 `token_hash`. Enforce at most one **active** (unredeemed, unrevoked, unexpired) grant per `(form_response_id, recipient_email)` with transactional locking on resend/redeem.
5. **Scanner-safe redemption** — `GET /forms/access/:token` renders a confirmation interstitial and must not consume the grant. `POST /forms/access/:token/redeem` performs redemption. Both endpoints use `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, and a one-time token-to-session exchange so the bearer token does not remain in the URL after the handoff.
6. **PII retention** — define purge/anonymization for `recipient_email` and grant audit events: expired unredeemed grants after 30 days, redeemed grants after 90 days (audit metadata only), revoked grants after 30 days.
7. **Shared attach picker** — extend the Forms "Attach a form" picker so the event editor can list/create/attach forms without leaving the page. Events owns the editor shell; Forms owns the picker and attachment APIs.

Event services own the **consequence** after redemption (identity reconciliation, org membership, event enrollment, session start, redirect to `/events/[slug]`). Forms owns grant creation, email dispatch hook, and redemption verification.

## Problem Statement

Orgs that run trainings, webinars, and community sessions have single-video content that doesn't fit the course model:

- Creating a course for one video forces them through the full course builder (sections, lessons, exercises, certificates) for content that is "watch once."
- There is no public surface for an events library — no host attribution, no upcoming-event registration, no format badge, no duration-first card layout.
- Teams currently send audiences to YouTube or Luma, losing branding, lead capture, and the conversion callout.

## Terminology note

"Event" is already overloaded in this repo: `COURSE_INVITE_EVENT_TYPE` and `ORGANIZATION_INVITE_EVENT_TYPE` (audit trails), `packages/analytics` (tracking events), and the webhooks PRD (emitted events). There is no `event` table, no `/events` route, and no `EVENT` course type today, so nothing hard-conflicts. Keep the domain unambiguous: the product entity is always `course.type === 'EVENT'`, the dashboard feature folder is `features/events`, and no new audit/analytics concept in this domain may be named bare `event`. A future webhooks integration will emit *events about Events* — name those payloads explicitly (e.g. `event.registration.completed`).

## Confirmed Decisions

1. **An Event IS a course** — a new `EVENT` value in the existing `COURSE_TYPE` enum, with exactly one auto-created lesson. No new table. (All three candidate plans — claude/codex/composer — converged on course reuse; the enum-vs-`contentKind`-column debate was settled by evidence: the `type === 'PUBLIC'` anonymous-access audit is 7 occurrences in 3 files, and a second classification axis would need a new column, CHECK constraints, and parallel filter plumbing.)
2. **The lesson row is the session.** Host = `lesson.teacherId` (existing FK → `profile.id`); schedule = `lesson.lessonAt` (nullable — event creation writes `null` explicitly for on-demand); meeting link = `lesson.callUrl`; recording = `lesson.videos`; resources = `lesson.documents`. No relational IDs in JSONB.
3. **Lifecycle is derived, never stored**: `draft` (unpublished) → `upcoming` (published, `lessonAt` future) → `live` (inside `lessonAt + durationMinutes`) → `replay-pending` (past, no video) → `on-demand` (published video exists). No status field that can go stale.
4. **`format` is cosmetic — it must never drive behavior.** `metadata.event.format` sets the badge label and the catalog filter, nothing else. Every behavioral branch derives from data: is `lessonAt` set, is `callUrl` present, is there a playable recording, is the event form-gated. Services and UI must not contain `if (format === 'webinar')` logic. Without this rule the lifecycle becomes a matrix of format × schedule × gating combinations and the stateless derivation in decision 3 collapses.
5. **Watch gating is the admin's choice per event**: **public** (on-demand replay only — anyone watches the recording, no login) or **form-gated** (registration required). Public maps to the lesson `public` flag and applies only when there is no upcoming/live join requirement. **Scheduled events** (`lessonAt` set and/or `callUrl` present) must use form-gated access so meeting links never appear anonymously. Form-gated requires one active `EVENT` form attachment and withholds the video and meeting link until registration is verified. The editor blocks or auto-switches to form-gated when a schedule or meeting link is added while public is selected.
6. **Form submission starts registration; redeeming the email completes enrollment.** The attached ClassroomIO Form collects the admin-configured fields. If the org's student limit is already reached, **block form submission** before creating a response or sending an access email — do not let registrants complete the form only to fail at redemption. A successful submission stores a pending response, **reserves one student seat** under the org limit lock (Prerequisites §3), and sends an org-branded access email to the submitted address. ClassroomIO does not enroll or create an account from an unverified address. Redeeming the emailed access grant proves ownership, atomically consumes the seat reservation, creates or reconciles the learner identity and org membership, enrolls the learner in the event group, starts a session, and redirects to `/events/[slug]`. Existing learners are reconciled by normalized email, so the flow never creates a duplicate account. Expired or revoked grants release their seat reservation without enrollment.
7. **Topics = existing course tags.** On-demand lists group by tag; untagged fall into "General". Audience segmentation (OpenAI's "Work Users", "Small Business") is not a separate axis in v1 — model it as a tag.
8. **Events and courses never mix**: excluded from the courses catalog, admin course list, course-type filters, the course create modal, and LMS My Learning / progress / certificate lists. (An event certificate issued by a passed assessment — decision 10 — is delivered by email and downloadable from the event page; it does not enroll the event into LMS progress/completion surfaces.)
9. **v1 scope is all four surfaces**: admin, public org-site pages, landing-page section (all 10 themes), LMS entry. Form-gated registration is part of v1 but ships only after the Forms prerequisites above are complete.
10. **Post-session assessment (CE mode) is post-v1 (Phase 5)** — an admin can enable exactly one assessment on an event — a quiz with a pass percentage (default 80%) — and registrants who pass are automatically issued a certificate. The grading, pass-gate, and certificate machinery already exist on courses. Off by default and **not in the initial events launch**; Phase 1 metadata reserves the `assessment` slot so Phase 5 needs no migration.
11. **Calendar invites ship in v1, after verified redemption** — `.ics` generation (`packages/email/src/ics.ts` `buildSessionIcs`) already works for `LIVE_CLASS` courses. For scheduled events, the initial "check your email" message must **not** include a calendar attachment or meeting link — that would bypass redemption. After successful grant redemption, send a follow-up org-branded email with the `.ics` containing title, time, join link, and default reminders, and expose an **Add to calendar** button on the event page for enrolled users. On-demand events skip calendar metadata.
12. **Times are timezone-explicit.** `lesson.lessonAt` is already `timestamptz`; the authoring timezone reuses the existing `course.metadata.sessionTimezone` (IANA string, already defined for live sessions). Public pages render the start–end range in the **viewer's** resolved timezone with the abbreviation shown (e.g. "6:00 PM - 6:30 PM WAT"), and the admin editor states which timezone it is saving. Never render a bare time without a timezone.
13. **Internal-audience events need an explicit form access policy.** A form-gated public registration is intentionally a lead-capture/signup path, even when org-wide signup is disabled. For internal training, the event attachment must support `existing_members_only`; redemption then requires the submitted email to match an existing organization member. The admin UI must make this distinction explicit. Public (no-login) playback still bypasses `disableSignup`, so selecting it on a closed org requires a warning.
14. **Zero-friction internal delivery is a real, separate feature — deferred.** Even with the combination above, an existing employee still submits or redeems the registration form once (having an org account ≠ having a `groupmember` row on that specific event). True zero-click delivery — the event just appears already-registered for every teammate — needs a new `metadata.event.audience: 'public' | 'organization'` setting that auto-enrolls every current `organizationmember` (role ≥ STUDENT) into the event's group on publish, and auto-enrolls new hires as they join (mirroring the existing `autoJoinOrg` pattern). Out of v1; tracked as a Later item.

## Current-State Audit

| Event concept | Existing storage / code | Notes |
| --- | --- | --- |
| Title, description, cover, slug, publish | `course` table | `type` enum at `packages/db/src/schema.ts:27`, values from `packages/utils/src/constants/course-type.ts` |
| Org linkage + enrollment | `course.groupId` → `group.organizationId`; `groupmember` rows | Registration = student groupmember |
| Video / rich text / resources | `lesson.videos` (jsonb, incl. duration metadata), `lesson.note`, `lesson.documents` | Already the exact event content shape; `documents` powers post-event slides/handouts |
| Host | `lesson.teacherId` FK → `profile.id` (`lesson_teacher_id_fkey`, schema.ts:1033) | Real constraint; barely used today |
| Schedule | `lesson.lessonAt` (nullable, `defaultNow()` only when omitted) | Session queries, ICS invites (`services/course/session-invite.ts`), and the reminder job (`session-reminder-scan.ts`) already key on it — reminder scan is gated by one `type = 'LIVE_CLASS'` condition |
| Authoring timezone | `course.metadata.sessionTimezone` (IANA string, schema.ts:695) | Already defined for live sessions — reuse, do not add a new field |
| Meeting link | `lesson.callUrl` | Must never appear in anonymous API payloads |
| Conversion CTA | `course.callout` + `packages/ui/src/custom/public-course/callout` | Built for PUBLIC courses |
| Anonymous viewing pipeline | `packages/db/src/queries/course/public-course.ts` + `apps/api/src/routes/org-site/public-course.ts` + HLS cookie | Gated `type = 'PUBLIC'` today — widen to admit `EVENT` **only** when `metadata.event.accessMode = 'public'`, derived state is on-demand (playable recording, no upcoming/live join), `lesson.lessonAt` is null, and `lesson.callUrl` is absent. Form-gated or scheduled events must stay behind auth/enrollment even if `type = 'EVENT'`. Regression tests must prove anonymous playback is denied for form-gated events. |
| Student lesson renderer | `packages/ui/src/custom/public-course/lesson-view.svelte` | Video + note + callout; the body of the event page |
| Host render pattern | `packages/ui/src/custom/org-landing-page/course-instructor.svelte` | Name + role + image |
| Enrollment flow | `(org-site)/course/[slug]/enroll` + `POST /course/:courseId/enroll` | Handles login redirect, student limits, email verification, invite tokens |
| Landing pages | 10 themes in `packages/ui/src/custom/org-landing-page/<theme>/`; props built in `apps/dashboard/src/lib/features/org/utils/landing-page.ts`; config JSON on `organization.landingpage` | Sections hardcoded per theme's `org.svelte`; shared token-styled components are precedented (callout, links, instructor) |
| Catalog + filters | `(org-site)/courses` + `getPublishedCoursesBySiteName` (accepts `types`) | No default type exclusion today — events would leak in without Phase 1 filters |
| Team members (host picker) | `GET /organization/team` → `OrgTeamMember` | Lacks `avatarUrl` — add via profile join |

**Key insight**: `lesson` already holds who (`teacherId`), when (`lessonAt`), where (`callUrl`), the recording (`videos`), and the handouts (`documents`) — all relational. The feature is a product layer (type value, routes, simplified admin, catalog), not a new content entity.

## Product Goals

1. An admin can create, edit, and publish an event from a dedicated, simple editor — never touching the full course builder.
2. Visitors browse a branded `/events` catalog filtered by `All / Upcoming / Live now / Past`, with format badges and topic tags.
3. Each event has a stable public page (`/events/[slug]`) through every lifecycle state: registration page before, live join during, replay + resources after.
4. Hosts are org team members, shown with name + avatar on cards and detail pages.
5. Registration is native: attached form → access email → verified redemption and enrollment → recording or meeting link.
6. Orgs can showcase events on their landing page (all 10 themes) with a section toggle, heading, and item limit.
7. Learners see their registered/available events in the LMS, linking to the org-site event page.
8. Courses and events remain fully separated in every list, filter, count, and progress surface.
9. _(Post-v1 / Phase 5)_ An admin running certified trainings (CE) can enable a post-session assessment: registrants take the quiz on the event page after the session, it is auto-graded, and everyone at or above the pass percentage is automatically issued and emailed a certificate.

## Non-Goals (v1)

The broader "Events" name invites expectations that are explicitly out of scope:

- **Ticketing, payments, and paid events** (course pricing plumbing exists; deferred).
- **Capacity limits, waitlists, and approval workflows.**
- **In-person operations** — venue management, room capacity, seat maps, check-in/QR scanning, attendance tracking. `delivery: 'in_person'` and `location` are **display-only strings** in v1.
- **Series / clubs / recurring events** — OpenAI's `/clubs/<club>/events/<event>` grouping. Each event is standalone in v1; collections are a Later item.
- **Multiple hosts, speaker bios, panelists, sponsors.**
- **Custom format labels** — the format enum ships fixed; org-defined badge labels are a Later item.
- Rescheduling/cancellation calendar updates — `buildSessionIcs` supports `method: 'CANCEL'` but no caller wires it today; a rescheduled or cancelled event does not yet push an updated/cancelled calendar event to prior registrants.
- Zero-click internal-audience auto-enrollment (`metadata.event.audience` — see Confirmed Decision 14).
- Replay-available notifications; event analytics dashboards; dedicated topic taxonomy (tags suffice); landing-page section reordering (no section-ordering system exists — the section renders after courses).
- Post-session assessment and certificates (Phase 5 CE mode — see Confirmed Decision 10).
- External registration URL / Luma escape hatch (`registrationUrl`).
- Assessment extras beyond one quiz + pass mark + certificate: multiple assessments, retake limits, timed tests, manual grading, attendance verification before the quiz unlocks, accreditation-body reporting.

## Data Model

- Add `'EVENT'` to `COURSE_TYPE_VALUES` (`packages/utils/src/constants/course-type.ts`); the pgEnum, Drizzle types, and Zod mirror follow from that one edit. Schema work stops at a passing `@cio/db` build (migrations handled outside this workflow).
- Every `type = 'EVENT'` course **must** carry a complete `metadata.event` object after create — not an optional fragment. Create/update/publish services reject EVENT rows missing required event metadata or scheduling fields.

  ```ts
  // Required on every EVENT course (TypeScript optional only for non-EVENT course types)
  event: {
    format: 'webinar' | 'livestream' | 'workshop' | 'bootcamp' | 'meetup' | 'session';
    delivery: 'online' | 'in_person' | 'hybrid';
    location?: string;            // display-only (e.g. "St Louis, MO"); no venue management
    durationMinutes?: number;     // required positive integer when lessonAt is set
    accessMode: 'public' | 'form'; // server default 'form' when omitted on create
    assessment?: { enabled: boolean; passPercentage: number };
  }
  ```

  **Server defaults on create** (applied when the client omits fields): `format: 'webinar'`, `delivery: 'online'`, `accessMode: 'form'`. The admin must explicitly set `accessMode: 'public'` for replay-only on-demand events. Form-gated events resolve the attached form through the active `EVENT` `form_attachment`, not duplicated in course JSON. `accessMode: 'form'` requires a published `EVENT` attachment before publish. Authoring timezone reuses the existing `course.metadata.sessionTimezone`.

  **Scheduling invariants** (enforced in create/update/publish services, not just the editor):
  - `lessonAt` set → `durationMinutes` must be a positive integer (countdown, time-range display, live-window derivation, and `.ics` end time all depend on it).
  - `lessonAt` or `callUrl` present → `accessMode` must be `form` (public replay-only cannot carry a join link or upcoming schedule).
  - `callUrl` without `lessonAt` is **invalid** — meeting links require a scheduled start so reminders, live state, and calendar metadata are defined. Reject on save/publish rather than inventing a synthetic schedule.
- Event creation (one transaction): group + course (`type: 'EVENT'`) + creator tutor member + the single lesson (title = course title, `public` per gating choice, explicit `lessonAt`, `teacherId` = host, slug via the slug service). No welcome newsfeed.
- **Invariants enforced in services, not just UI**: lesson/section create services reject additions to EVENT courses. Exercise creation is likewise rejected, with one controlled exception: the event assessment service may create **exactly one** exercise on the single lesson when `assessment.enabled` is turned on (and general exercise routes still reject event courses — the assessment service is the only entry point). Publish readiness (extend `go-live-readiness.ts`): title + host required; upcoming needs `lessonAt`; on-demand needs a playable video; `lessonAt` or `callUrl` requires `accessMode: 'form'` and a published `EVENT` attachment (public is valid only for replay-only events).
- **`format` never branches logic** (Confirmed Decision 4): it is read only by badge rendering and catalog filtering. Lifecycle, gating, publish readiness, and calendar behavior derive from `lessonAt`, `callUrl`, `videos`, and `accessMode`.
- **Security**: anonymous payloads never contain `callUrl`; an authed membership check returns it for enrolled users (and drives the "Registered ✓ / Join" card state).
- **Form binding**: extend Forms `form_attachment.contextType` with `EVENT`; the attachment references the event course, carries `accessPolicy: 'public_registration' | 'existing_members_only'`, and is the source for lifecycle, response-limit, and dedup settings. Exactly one active `EVENT` attachment per event course (Prerequisites §1). A form remains reusable; every response records the event attachment through which it was submitted.
- **Access grants** (Forms extension — see Prerequisites): submission creates or replaces a recipient-bound, single-use grant linked to the form response and event. The event redemption handler runs only after Forms verifies the grant via `POST`. Redemption is transactional and idempotent across identity reconciliation, org membership, event enrollment, and grant consumption.
- **Calendar invite reuse**: after successful redemption for a scheduled event, reuse `buildSessionIcs` from `services/course/session-invite.ts` in a follow-up confirmation email that includes title, time, join link, and reminders (see Confirmed Decision 11). The initial access email contains only the redemption link — no `.ics`, no `callUrl`.
- **Admin footgun guard**: the event editor's gating toggle warns (or blocks) selecting "public, no login" when the org has `disableSignup` enabled, since that combination silently exposes the event to anyone despite the org's closed-signup intent (see Confirmed Decision 13).

## API

Dedicated thin router delegating to shared course/lesson/group/tag services (single response type per route, per repo conventions).

**Admin routes** (`POST /event`, `GET /event/:id`, `PUT /event/:id`):

- Require authenticated session (`authMiddleware`) and org membership with **admin or teacher** role on the caller's active organization.
- Scope every read/write to the caller's organization: the event course's `group.organizationId`, the referenced `groupId`, `lesson.teacherId` (host), and `:id` must all belong to that org before create/update/publish proceeds. Reject cross-org IDs with 404/403 rather than leaking existence.
- `POST /event` creates atomically; `PUT /event/:id` updates course + lesson transactionally and folds publish readiness into the same handler when `isPublished` toggles.

```text
POST /event                     — atomic create, returns course + lesson
GET  /event/:id                 — course + lesson + derived state (editor shape)
PUT  /event/:id                 — transactional course + lesson update; publish folds in
```

**Public org-site routes** (no session required; tenant resolved from site name / custom domain):

```text
GET  /org-site/events           — public list: course + lesson join (duration, slug)
                                  + profile join on teacherId (host name/avatar),
                                  tags, format, delivery, derived state; callUrl stripped
GET  /org-site/events/:slug     — public detail; lesson body/HLS reuses the existing
                                  public-course item endpoint + HLS cookie
```

No `DELETE /event` (course delete works). Default course queries (`getPublishedCoursesBySiteName`, counts, admin org-courses) exclude `type = 'EVENT'`. The anonymous public-course pipeline admits `EVENT` only under the replay-only public rule in the Current-State Audit row (not by course type alone).

**Forms access-grant routes** (Forms extension — see Prerequisites §4–5; not in the Forms MVP PRD):

- **Context dispatch**: resolve the grant's `form_attachment.context_type` before running any integration consequence. Only `EVENT` grants invoke the event redemption handler (identity, membership, enrollment, redirect). Other future attachment contexts must register their own handlers — never route every grant to event enrollment.
- **Revoke authorization**: `POST /forms/access/:token/revoke` requires an authenticated org **admin or teacher** session scoped to the grant's `organization_id`. Respondents cannot revoke their own grants through this route.

```text
GET  /forms/access/:token       — scanner-safe interstitial; does not consume the grant;
                                  Cache-Control: no-store; Referrer-Policy: no-referrer
POST /forms/access/:token/redeem — verifies grant + EVENT attachment context, runs event
                                  redemption consequence, exchanges token for session cookie,
                                  redirects without bearer token in URL; idempotent for repeat
                                  confirms
POST /forms/access/:token/resend — rate-limited replacement grant for the same response
                                  (revokes prior active grant); respondent-facing, no auth
POST /forms/access/:token/revoke — org admin/teacher revokes an active grant (see above)
```

Failure states (expired, revoked, wrong recipient, already redeemed, wrong attachment context) return generic respondent-facing errors without revealing whether an account exists. Student-limit failures occur at form submission before a grant is issued — not at redemption.

## User Experience

### Admin (`/org/[slug]/events`)

- New "Events" entry in the org sidebar (`content` group, beside Courses).
- List page: cards with title, host, format badge, derived-state badge, published status.
- Single-page editor (`/events/[id]`) — no course sidebar: title, description, host picker (team members from `GET /organization/team`, which gains `avatarUrl`), format + delivery selectors, schedule (`lessonAt` + `durationMinutes` + timezone label), video + rich-text note (reusing `features/course/components/lesson/` `video/*` and `note/*` by hydrating the existing lesson store), resources upload (`lesson.documents`), callout, tags, access toggle, publish.
- Form-gated mode uses the Forms product's "Attach a form" picker (Forms prerequisite). The admin can choose an existing form or create an event-registration form in context, configure public-registration vs existing-members-only access, and preview the gate without leaving the event editor.
- Assessment section (**Phase 5 only**): enable toggle, pass percentage (default 80), and the quiz builder (reusing the existing exercise question editor against the single lesson's one exercise). Enabling requires form-gated access — anonymous viewers can't take a graded, certificate-issuing test. Results view lists registrants with score, pass/fail, and certificate status.
- `/courses/[id]` for an event-typed course redirects to `/events/[id]`.

### Public catalog (`/events`)

- Filter tabs: **All / Upcoming / Live now / Past** (Past includes on-demand replays and replay-pending).
- Cards show: format badge, title, host name + avatar, start date and time range with timezone for scheduled events or duration for on-demand, delivery label, topic tags, and the state-appropriate CTA (Register / Join / Watch / "Replay coming soon").
- Upcoming and live cards always reflect form-gated registration when a meeting link exists. Theme tokens via the same pattern as `/courses`.
- Org-site nav shows an Events link when the org has published events.

### Public event page (`/events/[slug]`)

Stable URL through every lifecycle state. Layout follows the reference detail page:

**Hero** — cover image on the left (falls back to a branded gradient card rendering the title when no cover is uploaded); on the right: format badge, time range + date with timezone, title, primary CTA, and a **countdown** (days/hours/minutes/seconds) while `upcoming`. The countdown ticks client-side and flips to the live state at start time without a page reload.

**Body (left column)** — topic tag chips, rich description (`course.description` + `lesson.note`), the video player once access is granted, a **Resources** section listing `lesson.documents` (slides, handouts) subject to the same gating as the recording, and the callout CTA.

**Sidebar (right column)** — status line ("Live in 2 hours 14 minutes" / "Live now" / "Event has finished"), time range, date, delivery ("Online", or the `location` string for in-person), **Hosted by** (host name + avatar), the CTA repeated, **Add to calendar** for enrolled users only, and share links (LinkedIn, X, email) that use the public event URL.

State behavior:

- **Public (replay-only)** → the recording plays for anyone; no `callUrl` in anonymous payloads.
- **Form-gated** → the attached form renders for upcoming, live, and replay states; verified/enrolled users get the recording or the meeting link.
- **`replay-pending`** (past, no video yet) → "Event has finished — replay coming soon"; registration closes, and the page stays live so the admin can attach the recording later, at which point the same URL becomes on-demand automatically.
- With an assessment enabled (Phase 5), registered users see a "Take the assessment" section once the session is past: quiz → auto-grade → pass ≥ threshold → certificate emailed + downloadable there. Anonymous visitors see that a certificate assessment exists (conversion hook) but must register.

### Form-gated registration and access flow

1. An anonymous visitor opens `/events/[slug]`; public metadata renders, but video playback and `callUrl` do not (form-gated events).
2. The page renders the attached ClassroomIO Form, or shows a student-limit message if registration is closed. Email is mandatory for an event registration form even if the reusable form otherwise allows anonymous responses.
3. Submit persists a pending form response, applies the attachment's limits/dedup rules, and sends an org-branded "Watch event" email containing **only** the redemption link (no meeting link, no calendar attachment). The browser shows a neutral "Check your email" state and must not reveal whether that address already has an account.
4. The email link opens an interstitial without consuming the token. The visitor selects "Watch event"; a `POST` redeems the grant, verifies the email, reconciles or creates the learner, adds org/event membership idempotently, signs in, and redirects to the stable event page. The bearer token is exchanged for a session cookie and cleared from the URL (`no-store`, `no-referrer`).
5. For scheduled events, redemption triggers a follow-up confirmation email with the `.ics` calendar attachment (title, time, join link, reminders), and the page's **Add to calendar** button becomes available. On-demand events skip calendar metadata.
6. The enrolled learner watches on the org-site event page and sees the event in `/lms/events`. The LMS is the identity/access layer, not a second copy of the recording.
7. Resubmitting the same normalized email returns the same generic success state and sends a replacement grant subject to cooldown/rate limits. It must not create duplicate responses, members, or enrollments.

Use an event-specific org-branded template for both the access and post-redemption calendar emails rather than overloading the generic course-welcome wording.

### Landing page (all 10 themes)

Flow mirrors the courses section exactly:

1. Admin enables it in the landing-page editor (new `events-section.svelte` panel) → writes `landingpage.events = { show, title?, subtitle?, itemLimit? }`.
2. Org root `+page.server.ts` fetches `GET /org-site/events` (capped at `itemLimit`) only when `show` is true, in parallel with the courses fetch.
3. `buildOrgLandingPageProps` gains `events`; `mapPublicEventsToLandingPageEvents` maps API rows → `EventItem[]` (id, slug, title, format, host name + avatar, precomputed lifecycle state).
4. Each theme's `org.svelte` gets a small conditional block rendering a **shared token-styled** `events-section.svelte` + `event-card.svelte` (`--landing-*` vars only). The theme loader prefers a theme-local `event-card.svelte` when a theme ships one — none required for v1; themes with strong card identity get bespoke variants incrementally.
5. Section renders only when enabled AND events exist; "View all" links to `/events`. Position is fixed after the courses section.

### LMS

- "Events" nav entry → `/lms/events`: registered upcoming/live events + the org's published on-demand events. Cards link to the **org-site** event URL (tenant-origin helper) — the LMS does not render events through the course lesson shell.
- Events are excluded from My Learning, progress totals, completion/certificate lists.

## Open Questions

1. What should the default access-grant lifetime be? Recommendation: 24 hours with a rate-limited resend; once redeemed, the normal authenticated session and enrollment govern future access.
2. Is the fixed `format` enum sufficient at launch, or do design-partner orgs need custom badge labels (OpenAI ships org-specific names like "Skill Lab" and "Builder Bootcamp")? Recommendation: ship fixed, add custom labels only if a real customer asks.
3. **Assessment certificate template** (Phase 5): reuse the existing course certificate templates as-is, or does an event certificate need its own fields (session date, host, duration/credit hours)? CE buyers may need credit hours printed — verify against a real CE customer's certificate before building.
4. Should the "public gating on a signup-disabled org" case (Confirmed Decision 13) hard-block save, or just show a warning the admin can dismiss? Recommendation: warn, don't block — an org might legitimately want one public event as a lead magnet while keeping account signup closed.
5. Is zero-click internal auto-enrollment (Confirmed Decision 14 / `metadata.event.audience`) worth pulling into v1, or does `existing_members_only` form-gated access cover internal-training customers well enough for launch?

## Phased Delivery

**Phase 0 — Forms prerequisites** (blocks form-gated events): ship Forms MVP per `prd/forms-product/README.md`, then implement the event-driven Forms extensions listed in Prerequisites (attachment context, access grants, redemption routes, attach-picker extension). Public replay-only events can proceed to Phase 1 in parallel if form-gating is deferred, but the full registration flow cannot ship until Phase 0 is complete.

**Phase 1 — Data model & backend**: enum value; `metadata.event` settings (format, delivery, location, duration, accessMode); `createEvent` service; invariant guards + publish readiness; widen the PUBLIC anonymous pipeline; exclusions everywhere (courses catalog default, admin list, LMS student queries, filter UIs, create modal); `/event` + org-site routers; team `avatarUrl`.

**Phase 2 — Admin surface**: sidebar entry; list + single-page editor reusing lesson video/note components; host picker; format/delivery selectors; schedule with timezone label; resources upload; public/form access toggle; Forms attach/create picker (after Phase 0); translations (`en.json` + `pnpm translate`).

**Phase 3 — Public org-site**: `/events` catalog with All/Upcoming/Live now/Past filters; `/events/[slug]` detail (hero + body + sidebar, countdown, timezone-aware times, resources, share links); embedded form gate; check-email state; scanner-safe grant redemption, token-to-session exchange, and redirect; post-redemption calendar email and Add to calendar button; org-site nav link.

**Phase 4 — LMS + landing**: `/lms/events`; shared landing section + card with per-theme override hook; `OrgLandingPageJson.events` config; editor panel; 10 theme `org.svelte` conditional blocks; storybook fixtures; `ui:` prefix checks.

**Phase 5 — Assessment & certificates (CE mode, post-v1)**: `metadata.event.assessment`; assessment service (sole entry point that may create the single exercise); editor assessment section + results view; event-page assessment flow (quiz → auto-grade → pass gate → certificate email + download); certificate stays out of LMS progress/completion lists.

**Later**: reschedule/cancel calendar updates (`method: 'CANCEL'` wiring), `metadata.event.audience` zero-click internal auto-enrollment, event series/collections, custom format labels, paid/ticketed events, capacity/waitlists, in-person operations (venue, check-in, attendance), replay notifications, event analytics, multiple hosts/speakers, assessment extras (retakes, timing, attendance gating, accreditation reporting).

## Verification

- Builds per repo rules: `@cio/db`, `@cio/api` (+deps), dashboard (+deps); `pnpm format:check`; `pnpm --filter @cio/ui prefix:check`.
- Service tests: create yields exactly one course/group/tutor-member/lesson; second lesson/section/exercise rejected; course queries exclude events and vice versa; lifecycle derivation covers all five states and is unaffected by `format`; anonymous payloads never contain `callUrl`; publish rejects public + scheduled/callUrl, `callUrl` without `lessonAt`, and scheduled events without positive `durationMinutes`; anonymous `EVENT` playback allowed only for public replay-only rows; form-gated events denied anonymous playback; form submit rejected when student limit reached; concurrent submit/redeem never exceeds org student limit; admin event routes reject unauthenticated, student, and cross-org callers.
- E2E (two browser profiles — admin window vs incognito `?org=udemy-test`):
  1. Admin: create → format + video + note + team-member host → publish. Not in Courses list; not in the course create modal.
  2. Incognito: landing section (after enabling) → `/events` → filter tabs (All/Upcoming/Live now/Past) → card (format badge, host avatar, duration) → detail plays video, callout renders.
  3. Gating: form-gated → submit custom registration form → generic check-email state → open email interstitial → confirm with `POST` → returned to the event page with video access; learner absent from LMS My Learning, present under `/lms/events`.
  4. Upcoming: future `lessonAt` + `callUrl` → Upcoming card with date; detail shows countdown and timezone-correct time range for two different browser timezones; submit form → redeem access email (no `.ics` in initial email) → post-redemption calendar email with `.ics` and Add to calendar button; call link visible only to enrolled; anonymous API response contains no `callUrl`.
  5. Post-event: past event with no video shows "Event has finished — replay coming soon"; attach recording → same URL becomes on-demand; uploaded slides appear under Resources and respect gating.
  6. Security: verify form submission alone creates no account/enrollment; student limit blocks form submit before any email is sent; tokens are stored only as hashes; link-scanner `GET` does not consume the grant; token is cleared from URL after session exchange; first confirmation enrolls and signs in; repeat confirmation is idempotent; resend revokes the old grant; expired/wrong-recipient grants fail generically; video and `callUrl` remain unavailable before redemption.
  7. Public replay-only: on-demand event with `accessMode: 'public'` plays without login; adding `lessonAt` or `callUrl` requires form-gated or blocks publish.
  8. Internal-only: set the event attachment to `existing_members_only` → a non-member email receives no usable access while an existing member redeems normally. Re-run with public playback → confirm the admin UI surfaces the closed-org exposure warning.
  9. Assessment (Phase 5, post-v1): enable assessment + 80% pass mark → registered student takes quiz on the event page → scoring above threshold emails a certificate and shows the download; scoring below shows the score with no certificate; a second exercise cannot be created through any route; the event still absent from LMS My Learning and completion/certificate lists.
