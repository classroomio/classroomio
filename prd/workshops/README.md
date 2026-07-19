# Workshops PRD

## Purpose

Enable organizations to publish one-off video training sessions — webinars, recorded talks, live events — without building a full course. A Workshop is a course with exactly one lesson: one video (YouTube embed or upload) plus optional rich text and a callout CTA. Workshops get their own admin surface, public catalog, landing-page section, and LMS entry, while reusing the entire course machinery underneath.

Reference products:

- Cursor Workshops: <https://cursor.com/workshops> — card grid with title, host ("By AJ Valenty" + headshot), upcoming date or duration; grouped into "Upcoming events" (Luma registration) and "On-demand sessions" (YouTube links, grouped by topic).
- Our differentiation: cards link to an **internal** workshop page (video + text + callout on the org's branded site) instead of sending visitors to YouTube/Luma, and registration is native enrollment.

## Problem Statement

Orgs that run trainings and webinars have single-video content that doesn't fit the course model:

- Creating a course for one video forces them through the full course builder (sections, lessons, exercises, certificates) for content that is "watch once."
- There is no public surface for a webinar library — no host attribution, no upcoming-event registration, no duration-first card layout.
- Teams currently send audiences to YouTube or Luma, losing branding, lead capture, and the conversion callout.

## Confirmed Decisions

1. **A Workshop IS a course** — a new `WORKSHOP` value in the existing `COURSE_TYPE` enum, with exactly one auto-created lesson. No new table. (All three candidate plans — claude/codex/composer — converged on course reuse; the enum-vs-`contentKind`-column debate was settled by evidence: the `type === 'PUBLIC'` anonymous-access audit is 7 occurrences in 3 files, and a second classification axis would need a new column, CHECK constraints, and parallel filter plumbing.)
2. **The lesson row is the event.** Host = `lesson.teacherId` (existing FK → `profile.id`); schedule = `lesson.lessonAt` (nullable — workshop creation writes `null` explicitly for on-demand); meeting link = `lesson.callUrl`; recording = `lesson.videos`. No relational IDs in JSONB.
3. **Lifecycle is derived, never stored**: `draft` (unpublished) → `upcoming` (published, `lessonAt` future) → `live` (inside `lessonAt + durationMinutes`) → `replay-pending` (past, no video) → `on-demand` (published video exists). No status field that can go stale.
4. **Watch gating is the admin's choice per workshop**: public (anyone watches, no login) or registration-required. Maps to the lesson `public` flag.
5. **Registration = enrollment** (existing enroll flow). Registered users see the meeting link and get a confirmation email. Optional per-workshop external registration URL (Luma escape hatch) is a cheap, cuttable add.
6. **Topics = existing course tags.** On-demand lists group by tag; untagged fall into "General".
7. **Workshops and courses never mix**: excluded from the courses catalog, admin course list, course-type filters, the course create modal, and LMS My Learning / progress / certificate lists. (A workshop certificate issued by a passed assessment — decision 9 — is delivered by email and downloadable from the workshop page; it does not enroll the workshop into LMS progress/completion surfaces.)
8. **v1 scope is all four surfaces**: admin, public org-site pages, landing-page section (all 10 themes), LMS entry.
9. **Optional post-session assessment (CE mode)**: an admin can enable exactly one assessment on a workshop — a quiz with a pass percentage (default 80%) — and registrants who pass are automatically issued a certificate. This is the standard certified-training (continuing-education) workflow — register → attend live → take the test → pass → certificate emailed → replay stays up; the grading, pass-gate, and certificate machinery already exist on courses. Off by default; a workshop without an assessment behaves exactly as decisions 1–8 describe.

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
5. Registration is native: enroll → confirmation email → meeting link visible to registered users only.
6. Orgs can showcase workshops on their landing page (all 10 themes) with a section toggle, heading, and item limit.
7. Learners see their registered/available workshops in the LMS, linking to the org-site workshop page.
8. Courses and workshops remain fully separated in every list, filter, count, and progress surface.
9. An admin running certified trainings (CE) can enable a post-session assessment: registrants take the quiz on the workshop page after the session, it is auto-graded, and everyone at or above the pass percentage is automatically issued and emailed a certificate — no manual steps between registration and certificate delivery.

## Non-Goals (v1)

- No-account (email-only) registration — Luma-grade friction reduction ships later (verify-email token → email-only groupmember, idempotent confirm/cancel, rate limits, reconcile to profile).
- Paid workshops (course pricing plumbing exists; deferred).
- Capacity limits, waitlists, approval, custom registration questions.
- ICS calendar invites + 24h/1h reminders — near-free later (widen the `LIVE_CLASS` gate in `listUpcomingSessionsForReminderScan`, reuse `session-invite.ts`), but out of v1.
- Multiple hosts per workshop; replay-available notifications; workshop analytics dashboards; dedicated topic taxonomy (tags suffice); landing-page section reordering (no section-ordering system exists — the section renders after courses).
- Assessment extras beyond one quiz + pass mark + certificate: multiple assessments, retake limits, timed tests, manual grading, attendance verification before the quiz unlocks, accreditation-body reporting.

## Data Model

- Add `'WORKSHOP'` to `COURSE_TYPE_VALUES` (`packages/utils/src/constants/course-type.ts`); the pgEnum, Drizzle types, and Zod mirror follow from that one edit. Schema work stops at a passing `@cio/db` build (migrations handled outside this workflow).
- Course `metadata` gains scalar settings only: `workshop?: { durationMinutes?: number; registrationMode?: 'enrollment' | 'external'; registrationUrl?: string; assessment?: { enabled: boolean; passPercentage: number } }`.
- Workshop creation (one transaction): group + course (`type: 'WORKSHOP'`) + creator tutor member + the single lesson (title = course title, `public` per gating choice, explicit `lessonAt`, `teacherId` = host, slug via the slug service). No welcome newsfeed.
- **Invariants enforced in services, not just UI**: lesson/section create services reject additions to WORKSHOP courses. Exercise creation is likewise rejected, with one controlled exception: the workshop assessment service may create **exactly one** exercise on the single lesson when `assessment.enabled` is turned on (and general exercise routes still reject workshop courses — the assessment service is the only entry point). Publish readiness (extend `go-live-readiness.ts`): title + host required; upcoming needs `lessonAt`; on-demand needs a playable video.
- **Security**: anonymous payloads never contain `callUrl`; an authed membership check returns it for enrolled users (and drives the "Registered ✓ / Join" card state).

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
- Single-page editor (`/workshops/[id]`) — no course sidebar: title, description, host picker (team members from `GET /organization/team`, which gains `avatarUrl`), schedule (`lessonAt` + `durationMinutes`), video + rich-text note (reusing `features/course/components/lesson/` `video/*` and `note/*` by hydrating the existing lesson store), callout, tags, gating toggle, registration mode, publish.
- Assessment section (Phase 5): enable toggle, pass percentage (default 80), and the quiz builder (reusing the existing exercise question editor against the single lesson's one exercise). Enabling requires registration-required gating — anonymous viewers can't take a graded, certificate-issuing test. Results view lists registrants with score, pass/fail, and certificate status.
- `/courses/[id]` for a workshop-typed course redirects to `/workshops/[id]`.

### Public org site

- `/workshops` — full catalog: **Upcoming events** (date, Register; "Join" while live) then **On-demand sessions grouped by tag** (duration, Watch; "Replay coming soon" for replay-pending). Theme tokens via the same pattern as `/courses`.
- `/workshops/[slug]` — stable URL through every state: host header (`course-instructor.svelte` pattern) + `lesson-view.svelte` (video, note, callout). Public → plays for anyone; gated → Register; upcoming → date + Register, meeting link for registered users. Admin adds the recording after the event and the same page becomes on-demand automatically.
- With an assessment enabled, registered users see a "Take the assessment" section on the same page once the session is past (or on-demand video watched for evergreen enrollees): quiz → auto-grade → pass ≥ threshold → certificate emailed + downloadable there; below threshold → score shown with the org's contact path. Anonymous visitors see that a certificate assessment exists (conversion hook) but must register.
- Org-site nav shows a Workshops link when the org has published workshops.

### Enrollment (registration) flow — traced

Reuses `(org-site)/course/[slug]/enroll`, with these deliberate deltas:

- **Redirect chain**: the existing flow hard-redirects post-enroll to the LMS (`/courses/{id}/lessons?next=true`) and rebuilds login/signup redirects to the enroll page. Workshops thread a return destination through all hops so the registrant lands back on `/workshops/[slug]` (extend `getStudentCourseContinuePath` or pass an explicit redirect — don't fork the enroll page).
- **Email verification gate**: kept — protects `callUrl` and keeps registrant emails real.
- **Free reuse**: `allowNewStudent === false` doubles as "registration closed"; `?invite_token=` gives private/unlisted workshops.
- **Confirmation email**: the org-branded student-course-welcome email; verify wording fits workshops (date + call link for scheduled ones).

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

1. **Do workshop registrants count toward the org's plan student limit?** Enrollment creates a student `groupmember`, and `studentLimitReached` blocks signups — a popular free webinar collides with per-seat limits. v1 default until decided: they count; surface the limit clearly in admin. Alternative: exclude WORKSHOP groups from `countActiveStudents` (needs an abuse guard).
2. Keep the external `registrationUrl` escape hatch in v1, or cut for leanness?
3. Should the enrollment confirmation email get a workshop-specific template variant, or is adjusted generic wording enough?
4. **Assessment certificate template**: reuse the existing course certificate templates as-is, or does a workshop certificate need its own fields (session date, host, duration/credit hours)? CE buyers may need credit hours printed — verify against a real CE customer's certificate before building.
5. Does Phase 5 ship inside v1 (if certified trainings are the go-to-market wedge) or immediately after the four v1 surfaces? Default until decided: build Phases 1–4 first, but design Phase 1 metadata/invariants so the assessment slot needs no migration.

## Phased Delivery

**Phase 1 — Data model & backend**: enum value; `metadata.workshop` settings; `createWorkshop` service; invariant guards + publish readiness; widen the PUBLIC anonymous pipeline; exclusions everywhere (courses catalog default, admin list, LMS student queries, filter UIs, create modal); `/workshop` + org-site routers; team `avatarUrl`; email copy check.

**Phase 2 — Admin surface**: sidebar entry; list + single-page editor reusing lesson video/note components; host picker; schedule; gating; translations (`en.json` + `pnpm translate`).

**Phase 3 — Public org-site**: `/workshops` catalog (Upcoming / On-demand-by-tag); `/workshops/[slug]` detail; enrollment redirect threading; org-site nav link.

**Phase 4 — LMS + landing**: `/lms/workshops`; shared landing section + card with per-theme override hook; `OrgLandingPageJson.workshops` config; editor panel; 10 theme `org.svelte` conditional blocks; storybook fixtures; `ui:` prefix checks.

**Phase 5 — Assessment & certificates (CE mode)**: `metadata.workshop.assessment`; assessment service (sole entry point that may create the single exercise); editor assessment section + results view; workshop-page assessment flow (quiz → auto-grade → pass gate → certificate email + download); certificate stays out of LMS progress/completion lists.

**Later**: no-account registration, ICS + reminders (near-free via existing session machinery), paid workshops, capacity/waitlists, replay notifications, workshop analytics, multiple hosts, featured collections, assessment extras (retakes, timing, attendance gating, accreditation reporting).

## Verification

- Builds per repo rules: `@cio/db`, `@cio/api` (+deps), dashboard (+deps); `pnpm format:check`; `pnpm --filter @cio/ui prefix:check`.
- Service tests: create yields exactly one course/group/tutor-member/lesson; second lesson/section/exercise rejected; course queries exclude workshops and vice versa; lifecycle derivation covers all five states; anonymous payloads never contain `callUrl`.
- E2E (two browser profiles — admin window vs incognito `?org=udemy-test`):
  1. Admin: create → video + note + team-member host → publish. Not in Courses list; not in the course create modal.
  2. Incognito: landing section (after enabling) → `/workshops` → card (host avatar + duration) → detail plays video, callout renders.
  3. Gating: registration-required → Register → sign up → returned to the workshop page → video plays; student absent from LMS My Learning, present under `/lms/workshops`.
  4. Upcoming: future `lessonAt` + `callUrl` → "Upcoming events" card with date; register → confirmation email; call link visible only to enrolled; anonymous API response contains no `callUrl`. Add recording after the date → same URL now on-demand.
  5. Assessment (Phase 5): enable assessment + 80% pass mark → registered student takes quiz on the workshop page → scoring above threshold emails a certificate and shows the download; scoring below shows the score with no certificate; a second exercise cannot be created through any route; the workshop still absent from LMS My Learning and completion/certificate lists.
