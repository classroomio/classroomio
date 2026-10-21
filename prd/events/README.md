# Events PRD

## Purpose

Let organizations run their events on ClassroomIO instead of Luma: publish a webinar, livestream, workshop or meetup, collect registrations, remind people, and share the recording afterwards. An Event is its own entity. It is **not** a course and has no lessons.

The value over Luma is what happens after the event. Registration data comes from a native ClassroomIO Form, and an event can be linked to a course so every registrant is enrolled in a reusable training and can earn that course's certificate. A one-off session becomes something an academy keeps selling and teaching.

**A webinar is a format of Event, not a separate product.** `webinar`, `livestream`, `workshop`, `meetup` and `session` are formats shown as a badge and a catalog filter.

Reference products:

- **Luma** (lu.ma): event pages, registration questions, approval-required registration, email/SMS/push reminders (reportedly the day before and an hour before), invites, QR check-in, ticketing, Zoom integration, mobile apps, API on paid tiers. The product we are replacing. Details come from third-party summaries; verify against Luma's own docs before using any of it in marketing or comparison pages.
- **TraCorp LMS Webinar Training**: not a conferencing tool. An admin launches Zoom from the LMS or pastes a meeting URL (Zoom, Teams, GoToMeeting, etc.), and the link is shown only after registration. We take the same stance: we are the registration, access and reminder layer, not a video conferencing product. (From TraCorp help-desk snippets; their pages were not fetchable when this was written.)
- OpenAI Academy events: one `/events` catalog filtered `All / Upcoming / Now / Past`, format badges, topic tags, a detail page with countdown, timezone-explicit time range, Register, Add to calendar; past events keep their page and gain slides.
- Cursor Workshops: card grid with host and date, grouped into upcoming and on-demand.
- Zoho Writer webinars: library split into Upcoming and Completed, completed cards with presenter, duration and a Watch Now CTA.
- Ona: public event page plus a lead-capture form before an on-demand recording.
- Our differentiation: cards open an **internal** branded event page rather than sending visitors to YouTube or Luma; registration is a native Form; verified registration grants access; registrants can flow into a course.

## Prerequisites

**Events is not implemented yet.** Form-gated registration depends on the **Forms product MVP** (`prd/forms-product/README.md`): standalone form CRUD, public and authenticated runners, the attachment model, the response inbox, and the existing integration loops. Do not start event delivery until those exist.

Events is the first consumer of a **verified-email access-grant** capability that the Forms baseline does not ship. Specify the extensions here, implement them in the Forms codebase before or alongside event form-gating, and keep `prd/forms-product/README.md` free of event-specific scope.

### Required Forms extensions (event-driven)

1. **New attachment context.** Add `EVENT` to `form_attachment.context_type`, referencing the event through an `event_id` FK. Attachment `settings` carry `accessPolicy: 'public_registration' | 'existing_members_only'`, an optional response `capacity`, and `requireApproval`. Enforce with a DB check plus a constraint that `EVENT` rows point at an `event` row. **Tenant and uniqueness invariants** (transactional on attach/replace): the `form`, `form_attachment`, `event`, and `organization_id` must all belong to the same organization. At most one **active** `EVENT` attachment per event; attaching a new form deactivates the prior one so "the" attachment is unambiguous for gating, grants and publish readiness.
2. **Attachment-level settings are authoritative.** Lifecycle window, response limit and one-response-per-respondent come from the attachment, not conflicting `form` columns. Event services never read timing or limit fields from the reusable form row. **Capacity is the attachment response limit only**; do not add a second event capacity field that could disagree.
3. **Context overrides on submit.** For `EVENT` attachments the runner forces `collect_email = true`, `allow_anonymous = false`, and rejects submissions without a normalized `respondent_email` before creating an access grant. Reject submission when the org's student limit is reached (`studentLimitReached`) with a clear respondent-facing error; create no response and send no email. **Student-limit contract (single strategy):** under an org-level lock, **reserve one seat transactionally** when the response and grant are created; release it if the grant expires unredeemed or is revoked; consume it during successful redemption when membership is created. No separate redemption-only recheck. Concurrent submission and redemption tests must prove the org never exceeds its limit.
4. **Response statuses for waitlist and approval.** Responses on `EVENT` attachments can be `waitlisted` (over capacity), `pending_approval` (approval required), `approved`, `rejected`, or the normal registered state. No grant is issued while `waitlisted` or `pending_approval`. Approval issues the grant. When a seat frees (grant revoked or expired), the oldest `waitlisted` response is promoted and its grant issued.
5. **`form_response_access_grant` table.** Recipient-bound, expiring, single-use grants linked to `form_response_id` and `form_attachment_id`. Store only a SHA-256 `token_hash`. At most one **active** (unredeemed, unrevoked, unexpired) grant per `(form_response_id, recipient_email)`, with transactional locking on resend and redeem.
6. **Scanner-safe redemption.** `GET /forms/access/:token` renders a confirmation interstitial and does not consume the grant. `POST /forms/access/:token/redeem` redeems. Both use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`, with a one-time token-to-session exchange so the bearer token does not stay in the URL.
7. **PII retention.** Purge or anonymize `recipient_email` and grant audit events: expired unredeemed grants after 30 days, redeemed grants after 90 days (audit metadata only), revoked grants after 30 days.
8. **Shared attach picker.** Extend the Forms "Attach a form" picker so the event editor can list, create and attach forms without leaving the page. Events owns the editor shell; Forms owns the picker and attachment APIs.

Event services own the **consequence** after redemption (identity reconciliation, org membership, event registration, optional course enrollment, session start, redirect to `/events/[slug]`). Forms owns grant creation, the email dispatch hook and redemption verification.

## Problem Statement

Orgs that run trainings, webinars and community sessions today send people to Luma, Zoom registration pages or YouTube. They lose their branding, their registrant data lives in a different tool from their learners, reminders and replay emails are manual, and a recorded event never becomes training material.

## Terminology note

"Event" is already overloaded in this repo: `COURSE_INVITE_EVENT_TYPE` and `ORGANIZATION_INVITE_EVENT_TYPE` (audit trails), `packages/analytics` (tracking events), and the webhooks PRD (emitted events). There is no `event` table or `/events` route today, so nothing hard-conflicts. Keep the domain unambiguous: the product entity is the `event` table, the dashboard feature folder is `features/events`, and no new audit or analytics concept may be named bare `event`. Webhook payloads about Events are named explicitly (e.g. `event.registration.completed`).

## Confirmed Decisions

1. **An Event is its own entity.** A new `event` table, owned by an organization. It is not a course, has no lesson, no group and no section structure. Events and courses interact only through an optional link from an event to a course (decision 9).
2. **Event fields live on the event.** Host(s) via `event_host` rows (decision 12); schedule in `starts_at` (nullable) + `duration_minutes` + IANA `timezone`; meeting link in `meeting_url`; recording as a reference to the org's media asset (or a YouTube embed); resources as event documents; description and notes as rich text; optional callout; tags. No relational IDs in JSONB.
3. **Lifecycle is derived, never stored:** `draft` (unpublished) → `upcoming` (published, `starts_at` future) → `live` (inside `starts_at + duration_minutes`) → `replay-pending` (past, no recording) → `on-demand` (published recording exists). No status field that can go stale. `cancelled` is the one stored state, because it is an admin action, not a function of time.
4. **`format` is cosmetic and never drives behavior.** It sets the badge and the catalog filter, nothing else. Every behavioral branch derives from data: is `starts_at` set, is `meeting_url` present, is there a playable recording, is the event form-gated. Services and UI must not contain `if (format === 'webinar')`.
5. **Watch gating is the admin's choice per event:** **public** (on-demand replay only: anyone watches the recording, no login) or **form-gated** (registration required). Public applies only when there is no upcoming or live join requirement. **Scheduled events** (`starts_at` set and/or `meeting_url` present) must be form-gated so meeting links never appear anonymously. Form-gated requires one active `EVENT` attachment and withholds recording, resources and meeting link until registration is verified. The editor blocks or auto-switches to form-gated when a schedule or meeting link is added while public is selected.
6. **Form submission starts registration; redeeming the email completes it.** The attached Form collects the admin-configured fields. If the org's student limit is reached, **block submission** before creating a response or sending an email. A successful submission stores a pending response, **reserves one seat** (Prerequisites §3) and sends an org-branded access email. ClassroomIO does not create an account or registration from an unverified address. Redeeming the grant proves ownership, consumes the reservation, creates or reconciles the learner identity and org membership by normalized email (no duplicates), records the **event registration**, enrolls the learner in the linked course if one is set (decision 9), starts a session, and redirects to `/events/[slug]`. Expired or revoked grants release the reservation without registering.
7. **Topics are tags.** On-demand lists group by tag; untagged fall into "General". Audience segmentation is not a separate axis in v1.
8. **Events and courses never mix in lists**: events are absent from the courses catalog, admin course list, course filters, My Learning, progress and certificate lists. A course an event links to appears in those lists as a normal course.
9. **An event can be linked to a course.** In the event settings the admin picks an optional course. When set, every verified registrant is enrolled in that course at redemption, and gets that course's normal progress and certificate. This replaces a separate event assessment and certificate: certification is a course feature, and the event simply feeds learners into it. Registrants over the org student limit are handled by the existing seat reservation, so enrollment cannot push the org over limit. Enrollment settings per event: `none` | `on_registration`. Changing the linked course later affects only future registrants; existing registrants are not re-enrolled automatically, and the admin gets an explicit "enroll existing registrants" action with a count.
10. **Registration data is Forms data.** Registrant answers are `form_response` rows. The admin sees them in the Forms inbox and an event-scoped guest list. Linking the event to a course does not copy those answers into the course; the course sees an enrolled learner, and the event keeps the registration record.
11. **Reminders are v1.** A scheduled event without reminders is not a Luma replacement. Defaults: 24 hours and 1 hour before start, configurable or disabled per event. Recipients are verified registrants only. Channel is email in v1 (SMS, push and WhatsApp depend on `prd/notification-system/README.md` and are Later). Reminders contain the join link (recipients have redeemed). Rescheduling or cancelling a published event with registrants recomputes pending reminders, emails registrants, and sends an updated or cancelling `.ics` (same UID, bumped sequence; `method: 'CANCEL'` for cancellation). Each send is idempotent per `(event, recipient, reminder kind)`. Respect `prd/email-notification-preferences/README.md` for opt-out; reschedule and cancel notices are exempt. A "replay is ready" email goes to verified registrants when a recording is attached to a past event.
12. **Hosts can be anyone, not just org members.** An event has one or more hosts. A host is either an org team member or a **guest** invited by email (e.g. a guest speaker). A guest host does not need to be an organization member, student or admin. Public pages show every host's name, photo and optional short bio. Whether a host can also manage the event (see Open Questions) is separate from being shown publicly.
13. **Calendar invites ship in v1, after verified redemption.** For scheduled events the initial "check your email" message contains neither a calendar attachment nor a meeting link, since that would bypass redemption. After redemption, send an org-branded follow-up with the `.ics` (title, time, join link, default reminders) and expose **Add to calendar** on the event page for registrants. The existing `packages/email/src/ics.ts` `buildSessionIcs` is the starting point.
14. **Times are timezone-explicit.** `starts_at` is `timestamptz` and the event stores its authoring IANA timezone. Public pages render the start-end range in the **viewer's** timezone with the abbreviation (e.g. "6:00 PM - 6:30 PM WAT"); the editor states which timezone it is saving. Never render a bare time.
15. **Internal-audience events need an explicit form access policy.** `existing_members_only` requires the submitted email to match an existing org member at redemption. Public (no-login) playback bypasses `disableSignup`, so choosing it on a closed-signup org shows a warning (warn, do not block).
16. **v1 covers all four surfaces:** admin, public org-site pages, landing-page section (all 10 themes) and LMS entry. Form-gated registration ships only after the Forms prerequisites.
17. **Zero-friction internal delivery is deferred.** An existing employee still submits or redeems the form once. Auto-registering every org member (a `metadata.audience` setting) is a Later item.

## Current-State Audit

| Event concept | Existing storage / code | Notes |
| --- | --- | --- |
| Org linkage, tags, slug, publish | none for events | New `event` table. Reuse the slug service. Tags: see Open Questions |
| Registration form | `packages/db` forms tables (`prd/forms-product/README.md`) | Not built yet. Attachment gains `EVENT` context |
| Learner identity, org membership, student limits | `organizationmember`, `profile`, student-limit services | Reused at redemption |
| Course enrollment | `groupmember` rows on the course's group | Used only when an event is linked to a course (decision 9) |
| Recording playback, HLS | media manager (`prd/media-manager [DONE]/README.md`) and the existing HLS cookie flow used for lesson video | Event recording must reuse the same asset and playback pipeline, but through new event-specific public queries. Verify the exact entry points before building |
| Calendar invites | `packages/email/src/ics.ts` `buildSessionIcs`, `services/course/session-invite.ts` | Reused for the post-redemption email, reschedule and cancel |
| Reminders | `session-reminder-scan.ts`, gated on `type = 'LIVE_CLASS'` | Events get their own reminder scan keyed on the `event` table. Do not widen the course scan |
| Host render pattern | `packages/ui/src/custom/org-landing-page/course-instructor.svelte` | Name + role + image; extend for multiple hosts with bio |
| Team members | `GET /organization/team` -> `OrgTeamMember` | Lacks `avatarUrl`; add via profile join |
| Callout | `packages/ui/src/custom/public-course/callout` | Reuse for the event CTA |
| Landing pages | 10 themes in `packages/ui/src/custom/org-landing-page/<theme>/`; props built in `apps/dashboard/src/lib/features/org/utils/landing-page.ts`; config on `organization.landingpage` | Sections hardcoded per theme's `org.svelte`; shared token-styled components are precedented |
| Org-site routes | `apps/api/src/routes/org-site/*` | New `events` routes alongside |

## Product Goals

1. An admin creates, edits and publishes an event from a dedicated simple editor.
2. Visitors browse a branded `/events` catalog filtered `All / Upcoming / Live now / Past`, with format badges and topic tags.
3. Each event has a stable public page (`/events/[slug]`) through every lifecycle state: registration before, join during, replay and resources after.
4. Hosts, including invited guest speakers, appear with name and photo.
5. Registration is native: attached Form, access email, verified redemption, then recording or meeting link.
6. Registrants get reminders, calendar invites and a replay-ready email without admin effort.
7. An event can be linked to a course so registrants are enrolled and can earn its certificate.
8. Orgs can show events on their landing page (all 10 themes) with a section toggle, heading and item limit.
9. Learners see their registered and available events in the LMS.
10. Courses and events stay separate in every list, count and progress surface.

## Non-Goals (v1)

- Ticketing, payments and paid events (course pricing plumbing exists; deferred).
- In-person operations: venue management, seat maps, QR check-in, attendance tracking. `delivery: 'in_person'` and `location` are display-only strings.
- Attendance reports and event analytics dashboards.
- Recurring events and series.
- One event with multiple dated sessions.
- Completion badges and leaderboards.
- Hosting video conferencing. Admins paste a Zoom, Meet, Teams or YouTube Live link. Auto-creating meetings through OAuth is a Later item.
- Native mobile app (belongs in `prd/mobile-app/README.md`). Public pages and emails are mobile-first, and Add to calendar covers most phone usage.
- Custom format labels; external registration URL / Luma escape hatch.
- Landing-page section reordering (no ordering system exists; the section renders after courses).
- A separate event assessment and certificate. Certification comes from the linked course.

## Data Model

New tables. Exact column names are for implementation; the invariants below are the requirement.

- **`event`**: `id`, `organization_id`, `title`, `slug` (unique per org), `description` (rich text), `cover_image`, `format` (`webinar | livestream | workshop | meetup | session`), `delivery` (`online | in_person | hybrid`), `location` (display-only), `starts_at` (nullable `timestamptz`), `duration_minutes` (nullable), `timezone` (IANA), `meeting_url` (nullable), `recording` (media asset reference or YouTube embed; nullable), `access_mode` (`public | form`, server default `form`), `linked_course_id` (nullable FK -> `course`), `course_enrollment` (`none | on_registration`, default `none`), `reminder_offsets_minutes` (default 1440 and 60, empty = off), `callout`, `is_published`, `cancelled_at` (nullable), timestamps.
- **`event_document`**: resources (slides, handouts) belonging to an event; same gating as the recording.
- **`event_tag`**: tag assignments (see Open Questions for whether this reuses the org tag system).
- **`event_host`**: `event_id`, ordering, **either** `profile_id` (an org team member or an accepted guest) **or** a pending invite (`invited_email`, `invite_status`), display `name`, `photo`, optional short `bio`, `role` (`manager | speaker`, see Open Questions). A guest accepts by email invite and gets a profile; they do not become an org member.
- **`event_registration`**: `event_id`, `profile_id`, `form_response_id`, `registered_at`, source grant. Unique on `(event_id, profile_id)`. This is the access record, so redemption is idempotent.
- **`event_reminder_send`**: `(event_id, profile_id, reminder_kind)` unique, with sent timestamp, so retries never double-send.

**Scheduling invariants** (enforced in create/update/publish services, not only the editor):

- `starts_at` set -> `duration_minutes` must be a positive integer (countdown, time range, live window and `.ics` end time depend on it).
- `starts_at` or `meeting_url` present -> `access_mode` must be `form`.
- `meeting_url` without `starts_at` is **invalid**: reject on save/publish rather than inventing a schedule.
- `linked_course_id` must belong to the same organization as the event.

**Publish readiness:** title and at least one host; upcoming needs `starts_at`; on-demand needs a playable recording; scheduled or meeting-link events need `access_mode: 'form'` and a published `EVENT` attachment; public is valid only for replay-only events.

**Security:** anonymous payloads never contain `meeting_url`, the recording of a form-gated event, or its documents. An authenticated registration check returns them and drives the "Registered / Join" state.

**Transactions:** create, update, reschedule, cancel and redemption each run in one transaction at the service boundary. Redemption (identity reconciliation, org membership, `event_registration`, optional course enrollment, grant consumption) is atomic and idempotent. Reminder emails, calendar emails and cache invalidation run after commit.

## API

Dedicated thin router delegating to services; one response type per route.

**Admin routes** (authenticated session, org membership with **admin or teacher** role on the caller's active organization). Every read and write is scoped to the caller's organization: the event, `linked_course_id`, hosts and attachment must all belong to it. Reject cross-org IDs with 404/403 rather than leaking existence.

```text
POST   /event                     create event
GET    /event/:id                 editor shape + derived state
PUT    /event/:id                 update; publish readiness checked when is_published toggles
POST   /event/:id/cancel          cancel, notify registrants, send CANCEL ics
POST   /event/:id/hosts           add team-member host or invite guest host by email
DELETE /event/:id/hosts/:hostId   remove host
GET    /event/:id/registrations   guest list: status, search, export
POST   /event/:id/enroll-existing enroll existing registrants in the linked course (explicit, returns count)
POST   /event/:id/email           email all verified registrants
```

**Public org-site routes** (no session; tenant resolved from site name or custom domain):

```text
GET /org-site/events        public list: event + hosts, tags, format, delivery,
                            derived state; meeting_url stripped
GET /org-site/events/:slug  public detail; recording and documents only for
                            public replay-only events or a verified registrant
```

**Forms access-grant routes** (Forms extension, Prerequisites §5-6):

- **Context dispatch**: resolve the grant's `form_attachment.context_type` before running any consequence. Only `EVENT` grants invoke the event redemption handler. Future contexts register their own handlers.
- **Revoke authorization**: `POST /forms/access/:token/revoke` requires an authenticated org **admin or teacher** scoped to the grant's `organization_id`.

```text
GET  /forms/access/:token        scanner-safe interstitial; does not consume the grant
POST /forms/access/:token/redeem verifies grant + EVENT context, runs event redemption,
                                 exchanges token for session cookie, redirects
                                 without token in URL; idempotent
POST /forms/access/:token/resend rate-limited replacement grant (revokes prior)
POST /forms/access/:token/revoke org admin/teacher revokes an active grant
```

Failure states (expired, revoked, wrong recipient, already redeemed, wrong context) return generic respondent-facing errors without revealing whether an account exists. Student-limit failures occur at submission, not at redemption. Waitlisted and pending-approval submissions return the same neutral "check your email / we'll be in touch" state.

## User Experience

### Admin (`/org/[slug]/events`)

- New "Events" entry in the org sidebar (`content` group, beside Courses).
- List: cards with title, hosts, format badge, derived-state badge, published status, registrant count.
- Single-page editor (`/events/[id]`): title, description, cover, hosts, format and delivery, schedule (start, duration, timezone label), meeting link, recording, resources, callout, tags, access toggle, reminders, **linked course** with enrollment setting, publish.
- Hosts section: add an org team member or enter an email to invite a guest speaker. Guests accept by email and do not become org members.
- Form-gated mode uses the Forms "Attach a form" picker: choose or create a registration form in context, set public vs existing-members-only, capacity (with waitlist), approval-required, and preview the gate.
- Guest list: registrations with status (pending approval, waitlisted, registered, revoked), search, export, approve or reject, email all registrants.
- Cancel event, and reschedule through editing the start time, both notify registrants.

### Public catalog (`/events`)

- Filter tabs: **All / Upcoming / Live now / Past** (Past includes on-demand and replay-pending).
- Cards: format badge, title, host names and photos, start date and time range with timezone (or duration for on-demand), delivery label, topic tags, and the state-appropriate CTA (Register / Join / Watch / "Replay coming soon").
- Org-site nav shows an Events link when the org has published events.

### Public event page (`/events/[slug]`)

Stable URL through every lifecycle state.

**Hero:** cover image (falls back to a branded gradient card with the title), format badge, time range and date with timezone, title, primary CTA, and a client-side **countdown** while `upcoming` that flips to live at start without reload.

**Body:** topic chips, rich description, video player once access is granted, **Resources**, and the callout CTA.

**Sidebar:** status line ("Live in 2 hours 14 minutes" / "Live now" / "Event has finished" / "Cancelled"), time range, date, delivery (or `location`), **Hosted by** (all hosts with photo and bio), the CTA repeated, **Add to calendar** for registrants, and share links (LinkedIn, X, email).

State behavior:

- **Public replay-only:** the recording plays for anyone; no `meeting_url` in anonymous payloads.
- **Form-gated:** the attached form renders for upcoming, live and replay states; registrants get the recording or meeting link.
- **`replay-pending`:** "Event has finished: replay coming soon"; registration closes; the page stays live so attaching the recording later flips it to on-demand at the same URL and triggers the replay-ready email.
- **Cancelled:** page stays, shows cancelled, registration closed.
- If a linked course is set, registered users see a link to the course after redemption.

### Form-gated registration and access flow

1. An anonymous visitor opens `/events/[slug]`; public metadata renders, but recording, documents and `meeting_url` do not.
2. The page renders the attached Form, or a student-limit/closed message. Email is mandatory.
3. Submit persists a pending response and applies capacity, approval and dedup rules. Within capacity and without approval, it sends an org-branded "Watch event" email containing **only** the redemption link (no meeting link, no calendar attachment). The browser shows a neutral "Check your email" state that never reveals whether the address has an account. Over capacity the response is waitlisted; with approval required it waits for the admin.
4. The email link opens an interstitial without consuming the token. Choosing "Watch event" sends a `POST` that redeems the grant, verifies the email, reconciles or creates the learner, records the registration, enrolls them in the linked course if configured, signs them in, and redirects to the event page with the token cleared from the URL.
5. For scheduled events, redemption sends a follow-up email with the `.ics` (title, time, join link, reminders). Reminders then go at the configured offsets.
6. The registrant watches on the org-site event page and sees the event under `/lms/events`. The LMS is the identity layer, not a second copy of the recording.
7. Resubmitting the same normalized email returns the same generic state and sends a replacement grant subject to cooldown and rate limits, with no duplicate responses, registrations or enrollments.

Use event-specific org-branded templates for the access email, calendar confirmation, reminders, reschedule, cancel and replay-ready emails, rather than overloading course wording. Events are **org-branded** emails (an org addressing its own members), so each carries `branding` and is sent with `buildEmailFromName`. Link URLs for learners use `getDashboardBaseUrl(org)`.

### Landing page (all 10 themes)

1. Admin enables it in the landing-page editor (new `events-section.svelte` panel), writing `landingpage.events = { show, title?, subtitle?, itemLimit? }`.
2. The org root `+page.server.ts` fetches `GET /org-site/events` (capped at `itemLimit`) only when `show` is true, in parallel with the courses fetch.
3. `buildOrgLandingPageProps` gains `events`; `mapPublicEventsToLandingPageEvents` maps rows to `EventItem[]` (id, slug, title, format, host names and photos, derived state).
4. Each theme's `org.svelte` gets a conditional block rendering a **shared token-styled** `events-section.svelte` + `event-card.svelte` (`--landing-*` vars only). The loader prefers a theme-local `event-card.svelte` when one ships; none required for v1.
5. The section renders only when enabled and events exist; "View all" links to `/events`; position is fixed after courses.

### LMS

- "Events" nav entry -> `/lms/events`: events the learner registered for, plus the org's published on-demand events. Cards link to the **org-site** event URL.
- Events are excluded from My Learning, progress totals and certificate lists. A linked course appears there as a normal course.

## Open Questions

1. **Can a guest host manage the event, or only be displayed?** Hosts can be invited by email without an org account. Recommendation: two roles per host. `speaker` is display-only (name, photo, bio on the public page). `manager` can edit the event and see the guest list, scoped to that one event only, with no access to the rest of the org. Default for a new invite is `speaker`.
2. **Topic tags for events.** The existing tag system is course-oriented (`prd/tags-feature [DONE]/README.md`). Reuse it with an event assignment table, or add event-specific tags? Read that PRD before choosing.
3. **Default access-grant lifetime.** Recommendation: 24 hours with a rate-limited resend; once redeemed, the authenticated session and registration govern future access.
4. **Reminder defaults.** 24 hours and 1 hour before is based on Luma's reported defaults; confirm against Luma docs.
5. **Enrollment timing for a linked course.** Decision 9 enrolls at redemption (registration). Do any orgs need enrollment only after the event takes place? That needs attendance tracking, which is a non-goal, so it is deferred unless a customer asks.
6. **Is the fixed `format` enum enough at launch?** Recommendation: ship fixed; add custom labels only if a real customer asks.
7. **Plan limits.** Are events, registrants per event and reminder volume plan-gated? Check `prd/pricing-improvements/README.md`.

## Phased Delivery

**Phase 0: Forms prerequisites** (blocks form-gated events): ship the Forms MVP, then the Required Forms extensions above. Public replay-only events can proceed in parallel if form-gating is deferred.

**Phase 1: Data model and backend:** `event`, `event_document`, `event_tag`, `event_host`, `event_registration`, `event_reminder_send` tables; create/update/cancel services; invariant guards and publish readiness; event-specific public queries and recording gating; `/event` and `/org-site/events` routers; team `avatarUrl`; guest-host invites.

**Phase 2: Admin surface:** sidebar entry; list and single-page editor; hosts (team members and guest invites); format and delivery; schedule with timezone; meeting link, recording, resources; access toggle; Forms attach picker (after Phase 0); linked course and enrollment setting; reminder settings; translations (`en.json` + `pnpm translate`).

**Phase 3: Public org-site and notifications:** `/events` catalog with filters; `/events/[slug]` detail (hero, body, sidebar, countdown, timezone-aware times, resources, share links); embedded form gate; check-email state; scanner-safe redemption and redirect; post-redemption calendar email and Add to calendar; org-site nav link; **reminder scan and sends; reschedule and cancel updates; replay-ready email**; capacity, waitlist, approval and the admin guest list.

**Phase 4: LMS and landing:** `/lms/events`; shared landing section and card with per-theme override hook; `OrgLandingPageJson.events`; editor panel; 10 theme `org.svelte` blocks; storybook fixtures; `ui:` prefix checks.

**Later:** Zoom/Meet OAuth (create meetings, import cloud recordings into the event), recurring events, subscribable event calendars and embeds, newsletters to registrants, SMS/push/WhatsApp reminders, QR check-in for in-person, paid and ticketed events, auto-registering every org member for internal events, webhook and Zapier lifecycle events (`prd/webhooks/README.md`, `prd/zapier/README.md`), custom format labels.

## Verification

- Builds per repo rules: `@cio/db`, `@cio/api` (+deps), dashboard (+deps); `pnpm format:check`; `pnpm --filter @cio/ui prefix:check`.
- Service tests: create yields exactly one `event` row and no course, group or lesson; course queries exclude events and event queries exclude courses; lifecycle derivation covers all five states plus cancelled and is unaffected by `format`; anonymous payloads never contain `meeting_url`; publish rejects public + scheduled/`meeting_url`, `meeting_url` without `starts_at`, scheduled events without a positive duration, and a `linked_course_id` from another org; anonymous recording playback allowed only for public replay-only events; form submit rejected at student limit; concurrent submit and redeem never exceed the limit; redemption is idempotent; reminders send once per `(event, recipient, kind)` across job retries; reschedule recomputes reminders and sends an updated `.ics`; cancel sends `CANCEL` and stops reminders; admin routes reject unauthenticated, student and cross-org callers; a guest host can accept an invite without becoming an org member.
- E2E (two browser profiles, admin window vs incognito `?org=udemy-test`):
  1. Admin creates an event with format, recording, note and a team-member host, publishes it. It is not in the Courses list or course create modal.
  2. Incognito: landing section (after enabling) -> `/events` -> filters -> card -> detail plays the recording.
  3. Gating: form-gated -> submit -> generic check-email state -> interstitial -> confirm with `POST` -> back on the event page with access; learner absent from My Learning, present under `/lms/events`.
  4. Upcoming: future start + meeting link -> countdown and timezone-correct range in two browser timezones; redeem -> calendar email with `.ics`; a reminder fires at the configured offset; `meeting_url` visible only to registrants.
  5. Reschedule: change the start time -> registrants emailed, updated `.ics`, reminders recomputed. Cancel -> `CANCEL`, no further reminders.
  6. Post-event: past event with no recording shows "replay coming soon"; attach the recording -> same URL becomes on-demand and the replay-ready email goes out; resources respect gating.
  7. Security: submission alone creates no account or registration; student limit blocks submission before any email; tokens stored only as hashes; link-scanner `GET` does not consume the grant; token cleared from the URL; repeat confirmation is idempotent; resend revokes the old grant; expired or wrong-recipient grants fail generically.
  8. Capacity and approval: over-capacity submission is waitlisted with no grant; freeing a seat promotes the oldest waitlisted response; approval-required responses get a grant only after approval.
  9. Linked course: set a linked course -> a new registrant is enrolled on redemption and can complete the course and earn its certificate; "enroll existing registrants" shows a count first; the enrollment cannot exceed the student limit.
  10. Guest host: invite a guest speaker by email -> they accept without becoming an org member -> appear on the public page; a `speaker` role cannot edit the event.
  11. Internal-only: `existing_members_only` -> a non-member email receives no usable access, a member redeems normally; public playback on a closed-signup org shows the exposure warning.
