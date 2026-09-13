# ClassroomIO Mobile App PRD

## Status

- Draft (prototyped, ready for product review)

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Interactive HTML prototypes for every screen live in [`prototypes/mobile-app/`](../../prototypes/mobile-app/) and are the approved design reference for layout, states (locked / overdue / offline / graded / empty), copy, and navigation flow. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/mobile-app/index.html
```

Open it in a browser (`open prototypes/mobile-app/index.html`) — it maps both journeys (learner → tutor) and every screen cross-links so you can click through each flow end to end. Each page has a light/dark toggle, renders inside a 390 × 844 device frame, and shows the alternate states of that screen side by side.

The prototypes are built on the real design tokens from `packages/ui/src/index.css` (OKLCH palette, Geist, `--radius: 0.625rem`) via `app-theme.css`, so the app reads as the same product as the dashboard.

| Surface | Files |
| --- | --- |
| Entry | `index.html` (screen map), `auth.html` |
| Learner — core | `home.html`, `learn.html`, `course.html`, `lesson.html`, `exercise.html` |
| Learner — compliance & proof | `compliance.html`, `certificates.html` |
| Learner — engagement | `community.html`, `notifications.html` |
| Learner — platform | `downloads.html`, `profile.html` |
| Tutor companion | `tutor-grading.html`, `tutor-attendance.html`, `tutor-course.html` |

## Purpose

Ship a native iOS and Android app that makes ClassroomIO usable by the people companies actually train — frontline staff, field technicians, distributed employees, partners, and customers — who often have no work laptop and unreliable connectivity. The app is a **learner-first companion**, not a port of the dashboard: it optimizes for "open the app → see what needs my attention → finish it," with a small tutor mode for grading and attendance on the go. Reference experiences: TalentLMS (offline company training), Canvas Student (learner productivity), Teachable (polished consumption).

## Problem Statement

- ClassroomIO is browser-only. A warehouse worker, retail associate, or field technician with no company laptop has no practical way to complete assigned compliance training.
- There is **no push channel**. Deadline, renewal, and assignment nudges exist only as email (`packages/email/src/emails/`), which is the wrong medium for staff who do not check work email daily. Overdue compliance is discovered by the admin, not prevented by the learner.
- There is **no offline path**. Lessons, video (HLS), and exercises all require a live connection, so training cannot happen on a plane, in a basement, on a shop floor, or in a low-coverage region.
- Mobile web is a poor substitute for the parts that matter: background audio, lock-screen video controls, camera/file submissions, biometric re-entry, and a home-screen icon that pulls a learner back in.
- Compliance status — the product's core value — is buried in a dashboard the learner rarely opens. There is no "am I compliant, what expires next, where is my certificate" surface in the learner's pocket.
- Competitors treat mobile as table stakes: Moodle, Canvas, Blackboard, TalentLMS, Thinkific, and Teachable all ship apps, and every one of them offers push notifications; all but Thinkific offer offline content.

## Confirmed Decisions

These were locked from the mobile brainstorm that preceded this PRD. Items marked **(product call)** were decided without an explicit answer and are the ones to veto first.

1. **One role-aware app, not two.** A single binary serves learners and tutors; the tab bar and course screens change by role. Canvas ships separate Student/Teacher apps, but ClassroomIO's tutor surface is far smaller (grade, attend, announce, moderate) and its orgs are smaller, so two store listings would be overhead without benefit. **(product call)**
2. **Learner scope ships first.** Tutor mode is a later release behind the same binary, not a v1 requirement.
3. **Authoring stays on the web.** No course/lesson/exercise creation, media manager, AI course builder, analytics configuration, billing, SSO setup, domains, or API keys on mobile. Admin-only surfaces are intentionally absent.
4. **Expo + React Native**, as a new `apps/mobile` workspace package. It shares `@cio/utils` validation and the Hono RPC types from `@cio/api/rpc-types`, so request/response shapes stay type-checked against the real API.
5. **No new BFF.** Mobile calls the existing API. Where mobile needs something the web does not (a home digest, a device token, a token-authenticated HLS URL), we add narrow endpoints to the existing routers rather than forking business logic.
6. **Auth is Better Auth via `@better-auth/expo`.** The repo already runs `better-auth@^1.4.18` (`packages/db/package.json`). The Expo client plugin stores the session cookie in `expo-secure-store` and handles OAuth deep links; the server adds the matching `expo()` plugin and the `classroomio://` scheme to `trustedOrigins` (`packages/db/src/auth.ts`). Email/password, Google, and enterprise SSO all work through it.
7. **Biometric lock is a re-entry gate, not an auth method.** Face ID / fingerprint unlocks an existing stored session; it never replaces the initial sign-in.
8. **Org context is explicit.** There are no subdomains on mobile, so the user picks an organization after sign-in and the app sends `cio-org-id` on every request, matching how the API authorizes today (`apps/api/src/middlewares/org-team-member.ts`).
9. **No purchasing in the app, in any storefront.** No course checkout, no plan upgrade, no AI token packs. Selling digital content in-app would trigger Apple's Guideline 3.1.1 in-app-purchase requirement outside the US storefront; ClassroomIO's B2B model (training is assigned, not bought by the learner) means we can sidestep IAP entirely. Paid self-serve enrollment stays on the web.
10. **Push notifications are a hard dependency on `prd/notification-system`.** That PRD builds the `notification` table and the `notify()` service; mobile adds a **push transport** (device token registry + Expo Push delivery) and a per-category preference screen on top of it. Mobile must not build a parallel notification system.
11. **Offline v1 is read-only content plus a queued write for completion.** Download lessons, video, audio, PDFs, and transcripts; mark-complete events queue locally and sync on reconnect. **Offline exercises and submissions are v2** — quiz integrity, grading, and conflict resolution need their own design (this is where Canvas and Blackboard also draw the line).
12. **Compliance is the differentiating home surface.** The app opens on what is due, overdue, expiring, or awaiting a retake, and the certificate wallet is a first-class tab-reachable screen — not a page buried under settings.
13. **Branding is dynamic, white-label is later.** v1 themes the app with the org's name, logo, and primary color at runtime (multi-org accounts re-theme on switch). Dedicated per-customer App Store listings are an enterprise follow-up, as Thinkific and TalentLMS both sell them.
14. **The app is cloud-first but self-host compatible.** The sign-in screen accepts a custom server URL so self-hosted deployments can point the same binary at their own API; single-org self-hosted installs skip the org picker.

## Current-State Audit

| Capability | Current state | Notes for mobile |
| --- | --- | --- |
| Native app | **None.** `apps/course-app` is a CLI generator for standalone SvelteKit course sites, not a client | Greenfield; no code to migrate |
| API surface | Hono app with ~24 mounted routers (`apps/api/src/app.ts`) | Reuse as-is; mobile is another client |
| Typed client | `hcWithType` + `InferRequestType`/`InferResponseType` (`apps/api/src/rpc-types.ts`) | Mobile imports the same types; no hand-written DTOs |
| Auth | Better Auth 1.4.18, cookie sessions, 30-day expiry, 1-hour cookie cache, `customSession` injecting `orgRoles` (`packages/db/src/auth.ts`) | Add `expo()` server plugin + scheme in `trustedOrigins`; `orgRoles` already rides the session so RBAC needs no extra call |
| Session endpoint | `GET /session` returns `{ session, user }` (`apps/api/src/app.ts`) | Cold-start hydration |
| Org RBAC | `cio-org-id` header → `orgRoles[orgId]`; ADMIN=1, TUTOR=2, STUDENT=3 (`packages/utils/src/constants/roles.ts`) | Drives the role-aware tab bar |
| Course delivery | `/course/:courseId/{content,section,lesson,exercise,submission,mark,attendance,newsfeed,members,compliance,ai-tutor,presign}` | Covers nearly all of the learner and tutor scope |
| Question types | 16 keys incl. `VIDEO_RECORDING`, `FILE_UPLOAD`, `HOTSPOT`, `MATCHING` (`packages/question-types/src/question-type-keys.ts`) | Each needs a touch renderer; camera/mic permissions required |
| Video | HLS proxied from R2, authorized by an **HMAC cookie** `classroomio_hls_<assetId>` **or** an org-role session (`apps/api/src/routes/hls/hls.ts`) | ⚠️ Native players can't carry per-asset cookies — needs a token-in-URL variant (see Technical Design) |
| Transcripts / media | `/transcripts`, `/media`, presigned uploads (`apps/api/src/routes/course/presign.ts`) | Presign is already the right shape for mobile uploads |
| Compliance | Deadlines, grace, renewals, waivers (`apps/api/src/routes/course/compliance.ts`; `prd/compliance-training-platform [DONE]`) | Data for the home surface exists; needs a learner-scoped aggregate |
| Certificates | `packages/certificates`, issuance + LMS certificates page | Wallet reads the same records |
| Community / newsfeed | `/community`, `/course/:id/newsfeed`, cohort newsfeed | Maps to the Community tab |
| Cohorts | `/cohort` with goals and deadlines | Surfaces as cohort cards + announcements |
| AI lesson tutor | `/course/:courseId/ai-tutor` with fair-use caps (`prd/ai-tutor-fair-use`) | Renders as a bottom sheet in the player |
| **Notifications** | ⚠️ **Not shipped.** `prd/notification-system` is todo (`PRD-TRACKER.md` rank 1); bell icon is a placeholder; only email exists | Hard dependency — see Decision 10 |
| **Offline** | ⚠️ None. No service worker, no sync queue | Built from scratch in the app |
| **Device tokens** | ⚠️ No table | New `device_token` table |
| Deployment modes | `PUBLIC_IS_SELFHOSTED` switches multi-org, licensing, billing (`FEATURE_AUDIT.md` §5) | App must handle both; see Decision 14 |
| Background jobs | BullMQ workers incl. a `notifications` worker (`apps/jobs`) | Push fan-out belongs here, not in the request path |

## Product Goals

1. A learner signs in (password, Google, or enterprise SSO), picks an org, and lands on a home screen that answers "what needs my attention today" in one glance.
2. A learner completes a full course on a phone: read lessons, watch video, take exercises, and get a certificate — without touching a browser.
3. A learner receives a push notification for an assignment, a deadline, a renewal, a grade, or a reply, and taps straight into the relevant screen.
4. A learner downloads a course, completes the lesson content on a plane, and sees their progress sync automatically on reconnect.
5. A learner can always answer "am I compliant, what expires next, where is my certificate" in two taps.
6. A tutor clears a grading queue, takes attendance, posts an announcement, and moderates a thread from a phone.
7. The web dashboard, self-hosted deployments, and existing API behavior are unchanged (zero regression).

## Non-Goals (v1)

- Course, lesson, or exercise **authoring**; media manager; AI course builder.
- Org administration: settings, team/roles, billing, SSO config, custom domains, API keys, widgets.
- **Any purchase flow** (see Decision 9) — no course checkout, plan upgrade, or AI token packs.
- **Offline exercises, quizzes, and submissions** (v2) — offline is read-only content plus queued completion.
- Live-class video conferencing inside the app (join links open the existing external provider).
- Direct messaging between users (ClassroomIO has no DM system today; community Q&A covers discussion).
- SCORM playback (`prd/scorm-support` is todo; not shipped on web either).
- Per-customer white-label App Store listings (enterprise follow-up, Decision 13).
- Tablet-optimized layouts, watch apps, widgets, offline video for public/unenrolled catalog courses.

---

## Functional Requirements

**Information architecture.** Five tabs, role-aware: learners get **Home · Learn · Compliance · Community · Profile**; ADMIN and TUTOR get **Teach** in place of Compliance. Notifications live behind the bell in the nav bar, and Certificates and Downloads are reached from Compliance and Profile.

### 1. Onboarding and authentication — `auth.html`

- **Sign-in**: email + password, "Continue with Google", and "Sign in with SSO" (email-domain discovery via `/sso`). Google and SSO open the system browser and return through the `classroomio://` deep link.
- **Self-hosted**: a "Use a custom server" affordance accepts an API base URL, validated before the credential step.
- **Org picker**: shown after sign-in when the account belongs to more than one org; each row shows the org logo, name, and role. Single-org accounts (including all self-hosted installs) skip it.
- **Biometric**: after the first successful sign-in the app offers Face ID / fingerprint for subsequent launches; declining falls back to the stored session, and a remote sign-out invalidates it.
- **States to build**: idle, invalid credentials, SSO-required-for-this-domain, offline (no network at launch → "you're offline, showing downloaded content" with a path to Downloads), and session-expired re-auth.
- Invitation and password-reset deep links open the app when installed and the web flow otherwise.

### 2. Home — `home.html`

The attention surface. Ordered by urgency, not by recency:

1. **Compliance alert band** — only when something is overdue or inside its grace period; red for overdue, amber for due soon; tapping opens Compliance.
2. **Continue learning** — the single most recent in-progress lesson with a thumbnail, course name, position ("Lesson 4 of 12"), and a progress bar.
3. **Due soon** — deadline-ordered list of exercises and required courses with relative dates ("Due in 2 days").
4. **Newly assigned** — courses assigned since the last open, with an enroll/start affordance.
5. **Cohort announcements** — latest newsfeed items from the learner's cohorts and courses.
6. **Recent feedback** — graded submissions with score and tutor comment preview.

States: fully-caught-up empty state ("Nothing due — you're all caught up"), first-run empty state (no enrollments), and offline state (cached digest with an "Offline — last updated 2h ago" chip).

### 3. Learn — `learn.html`, `course.html`

- **My Learning**: segmented control for In progress / Not started / Completed; rows carry a progress ring, course type chip (Compliance / Cohort / Self-paced), and a download indicator.
- **Explore**: the org's public catalog, enroll-in-place for free/assigned courses; no paid checkout (Decision 9).
- **Cohorts**: cohort cards with goal progress and deadline.
- **Course detail** (`course.html`): header with progress, then the section/lesson outline. Every lesson row shows its state — complete, current, locked (with the reason: "Complete Lesson 3 first"), or downloaded. Compliance courses show a deadline banner. Tabs: Content, Newsfeed, Community, Certificate, and — for compliance courses — Compliance.
- Locked content is enforced by the API, not just hidden (`apps/dashboard/src/lib/features/course/utils/content-lock-utils.ts` is the web equivalent).

### 4. Lesson player — `lesson.html`

- **Video**: HLS playback with captions, playback speed, AirPlay/Chromecast, picture-in-picture, background audio, and lock-screen controls. Position is remembered per lesson and synced across devices.
- **Text, slides, and documents** rendered natively; multilingual lessons respect the learner's chosen language (`lesson-language.ts`).
- **Transcript** in a bottom sheet, tap-to-seek where timestamps exist.
- **AI Lesson Tutor** in a bottom sheet, scoped to the current lesson, showing the fair-use cap state when exhausted (`prd/ai-tutor-fair-use`).
- **Mark complete** advances to the next item; when offline the action is queued and the row shows a "will sync" indicator.
- States: online, downloaded/offline, locked, video-unavailable-offline, and tutor-cap-reached.

### 5. Exercises — `exercise.html`

- Touch renderers for all 16 question types in `packages/question-types`, including `MATCHING` (drag), `ORDERING` (drag), `HOTSPOT` (tap target), `FILE_UPLOAD` (files/photo library/document scan), and `VIDEO_RECORDING` (in-app camera).
- Answers autosave locally as the learner works so a call or app switch never loses progress.
- Submission uses the existing presigned upload path for media (`apps/api/src/routes/course/presign.ts`) with a visible upload progress state and retry.
- Result view: score, per-question correctness where allowed, rubric, tutor feedback, and resubmit when the exercise permits it.
- States: unattempted, in progress, submitted/awaiting grade, graded/passed, graded/failed with retake, and **connection-required** (an explicit blocking state, since exercises are online-only in v1).

### 6. Compliance — `compliance.html`

- Status header: Compliant / Due soon / Overdue / In grace, with the count of requirements behind it.
- Per-requirement rows: course, status, deadline or renewal date, grace-period note, waiver note where one applies, and last completion date.
- Renewal countdown for certifications approaching expiry.
- A "Proof" action jumping to the matching certificate.
- States: all-clear, overdue, in-grace, waived, and no-requirements.

### 7. Certificates — `certificates.html`

- Wallet list of issued certificates with course, issue date, certificate ID, and expiry when applicable.
- Detail view: rendered certificate, share sheet (PDF), save to device, and a verification QR/link.
- Downloaded certificates remain viewable offline.
- States: populated, empty ("Finish a course to earn your first certificate"), and expiring-soon.

### 8. Community — `community.html`

- Org and course Q&A: ask, answer, upvote, and follow threads; course and cohort newsfeed posts with comments.
- A "For you" filter for mentions, replies, and followed threads.
- Compose supports text and image attachments.
- Author-or-team edit/delete rules mirror the API guards (`apps/api/src/routes/community/middlewares/`).
- States: populated, empty, offline (read cached, compose disabled with an explanatory chip).

### 9. Notifications — `notifications.html`

- **Center**: grouped Today / Earlier, unread dots, deep-link on tap, mark-all-read.
- **Categories** (each independently toggleable, push and in-app): new assignment, deadline reminder, overdue, renewal due, new lesson/newsfeed post, exercise graded, community mention or reply, certificate issued, cohort goal approaching.
- **Preferences**: per-category switches plus quiet hours; changes write through to the same preference store the web uses (`prd/email-notification-preferences`).
- The first launch asks for the OS notification permission with an explanatory pre-prompt, not a cold system dialog.

### 10. Downloads and offline — `downloads.html`

- Download a whole course or an individual lesson; per-item progress and cancel.
- Storage manager: total used, per-course breakdown, delete individual or all.
- Settings: Wi-Fi-only downloads (default on), auto-download newly assigned required training (default off).
- **Sync queue** panel: pending completion events with their state (queued / syncing / synced / failed-retry), and a manual "Sync now".
- A persistent offline banner appears app-wide when the device is offline.
- Content that cannot work offline (exercises, live classes, AI tutor, community compose) is visibly marked rather than silently broken — the failure mode TalentLMS solved with an authoring-side compatibility check.

### 11. Profile and settings — `profile.html`

- Profile summary, learning stats, and organization switcher (re-themes the app).
- Links to Certificates, Downloads, Notification preferences.
- App settings: language, theme (system/light/dark), video quality, biometric lock toggle.
- Account: change password (web link), sign out, delete account (web link).

### 12. Tutor mode — `tutor-grading.html`, `tutor-attendance.html`, `tutor-course.html`

Visible only when `orgRoles[activeOrg]` is ADMIN or TUTOR. Staff get **Teach** in place of the learner Compliance tab; their own compliance stays reachable from the Home alert band and Profile.

- **Grading queue**: submissions awaiting grading across courses, oldest first, with course/exercise/learner and waiting time. Review shows the learner's answers (including video/file submissions), the rubric, score entry, written or recorded feedback, and approve / request-resubmission.
- **Attendance**: roster for a live-class session with present/absent/late toggles, bulk actions, and a code or QR check-in.
- **Course snapshot**: enrollment, completion rate, overdue count; post an announcement; moderate community/newsfeed posts (hide, delete, mark answered).
- Explicitly absent: authoring, settings, people management beyond invite, analytics configuration.

### 13. Cross-cutting requirements

- **Accessibility**: full screen-reader labels, Dynamic Type, minimum 44 pt touch targets, and no color-only status encoding (every status carries an icon and text). Canvas advertises VPAT 2.2 conformance; we should not ship below that bar.
- **Localization**: the app reads the same translation catalog the dashboard uses (`apps/dashboard/src/lib/utils/translations/`), covering the 10+ supported languages; no hardcoded strings.
- **Frontline mode**: large-target layout, low-bandwidth media defaults, and QR-code course launch, aimed at shared or shop-floor devices.
- **Security**: session in `expo-secure-store`, biometric re-lock, no analytics of lesson content, and remote sign-out honored on next foreground.

---

## Technical Design

### Workspace

```
apps/mobile/                      # @cio/mobile — Expo (React Native)
  app/                            # expo-router routes, grouped by tab
  src/features/<domain>/          # mirrors the dashboard's feature folders
    api/                          # typed calls via @cio/api/rpc-types
    components/
    utils/types.ts                # request/response types inferred from the API
  src/lib/{auth,offline,push,i18n}/
```

`apps/mobile` joins the existing `apps/*` workspace glob (`pnpm-workspace.yaml`). It depends on `@cio/utils` (validation, constants, roles) and `@cio/api` (types only). It must **not** depend on `@cio/ui` (Svelte) or `@cio/db`.

### Data model additions (`packages/db/src/schema.ts`)

```
device_token
  id uuid PK · profileId FK(profile, cascade) · token varchar NOT NULL
  platform DEVICE_PLATFORM ('ios' | 'android')
  provider PUSH_PROVIDER ('expo')            -- room for direct FCM/APNs later
  appVersion varchar · deviceName varchar · locale varchar
  lastSeenAt timestamptz · disabledAt timestamptz nullable
  createdAt / updatedAt
  unique(token) · index(profileId) · index(profileId, disabledAt)

notification_preference                      -- extends prd/notification-system
  id uuid PK · profileId FK(profile, cascade)
  category NOTIFICATION_CATEGORY             -- reuses the notification type enum
  push boolean default true · inApp boolean default true · email boolean default true
  unique(profileId, category)

profile_quiet_hours
  profileId FK(profile) PK · startMinute smallint · endMinute smallint · timezone varchar
```

Notes, per repo rules: no relational IDs inside `jsonb`; nothing computed is stored. Download state, sync queue, and playback position live **on the device** (SQLite), not in Postgres — the server keeps only the authoritative completion records it already has. Last-read playback position reuses existing lesson progress rather than a new column.

### Video: token-authenticated HLS

Today `/hls/:assetId/*` authorizes on an HMAC cookie `classroomio_hls_<assetId>` **or** an org-role session (`apps/api/src/routes/hls/hls.ts`). A native player (AVPlayer / ExoPlayer) fetches manifests and segments outside the app's HTTP client, so neither mechanism is reliable on mobile.

```
GET /hls/:assetId/playback-token        [authMiddleware + asset org membership]
  → { url: "/hls/<assetId>/master.m3u8?t=<hmac>", expiresIn: 3600 }

hlsRouter authorization order becomes:
  1. query param `t`  → verifyHlsToken (NEW — same HMAC, same claims)
  2. cookie           → verifyHlsToken (unchanged, web)
  3. session orgRoles → membership check (unchanged)
```

The token is the existing HMAC payload; only the transport is new, so web behavior is untouched. Offline downloads fetch the segment set once and store it locally; expiry is enforced at download time, not playback time, so a downloaded lesson keeps working on a plane.

### Push delivery

Push rides on `prd/notification-system` — mobile adds a transport, not a second notification pipeline.

```
notify(...)                                # existing service (notification-system PRD)
  ├─ INSERT notification                   # in-app center
  ├─ enqueue email                         # existing
  └─ enqueue push  (NEW)
       └─ apps/jobs notifications worker:
            tokens = active device_token rows for profileId
            skip if preference.push = false for category
            skip / defer if inside quiet hours
            chunk ≤100 → Expo Push API (expo-server-sdk)
            on DeviceNotRegistered → set device_token.disabledAt
```

Payload carries `{ type, entityId, deepLink }` so the app can route without a fetch. Expo Push abstracts APNs and FCM behind one endpoint; the `provider` column leaves room to move to direct FCM/APNs if enterprise requirements demand it.

### Offline architecture

| Concern | Approach |
| --- | --- |
| Content cache | SQLite (`expo-sqlite`) for lesson/section/course metadata; file system for video segments, audio, PDFs, images |
| Download unit | Course or lesson; queued, resumable, cancellable; Wi-Fi-only by default |
| Write queue | Append-only local table of intents (`lesson.complete`, `playback.position`), each with an idempotency key |
| Sync | On reconnect and on foreground: replay queue oldest-first; `409`/duplicate responses are treated as success |
| Conflict rule | Completion is monotonic — once complete, always complete; the server value wins for everything else |
| Eviction | Manual delete only in v1 (no silent eviction of content a learner deliberately downloaded) |

Because v1 queues only completion and playback position — never grades or submissions — there is no merge conflict class that can corrupt an assessment record. That is exactly why offline exercises are deferred.

### API additions

All additions follow the repo layering (validation → queries → services → routes) and mount under existing root segments.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/account/home-digest` | auth + org | One call for the Home screen: continue-learning, due-soon, newly-assigned, announcements, feedback, compliance summary |
| GET | `/account/compliance` | auth + org | Learner-scoped compliance across courses (today's data is per-course) |
| POST | `/account/device-tokens` | auth | Register/refresh a push token |
| DELETE | `/account/device-tokens/:token` | auth | Deregister on sign-out |
| GET | `/account/notification-preferences` | auth | Category matrix + quiet hours |
| PUT | `/account/notification-preferences` | auth | Update |
| GET | `/course/:courseId/offline-manifest` | course member | Everything needed to download a course in one call: lessons, media URLs, sizes, checksums |
| POST | `/course/:courseId/sync` | course member | Batch-replay queued completion intents idempotently |
| GET | `/hls/:assetId/playback-token` | auth + asset org | Token-authenticated playback (above) |
| GET | `/account/grading-queue` | org team member | Tutor: submissions awaiting grading across courses |

`/account/home-digest` exists to avoid the 6–8 round trips a cold mobile launch would otherwise need on a slow connection; it is a read-only composition of existing services, not new business logic.

### Client plan

- **Auth**: `@better-auth/expo` client with `scheme: 'classroomio'` and `expo-secure-store`; server adds the `expo()` plugin and the scheme to `trustedOrigins` in `packages/db/src/auth.ts`. `orgRoles` already arrives on the session via `customSession`, so the role-aware tab bar needs no extra request.
- **Types**: every request/response type is inferred from `@cio/api/rpc-types` into `features/<domain>/utils/types.ts` — the same rule the dashboard follows. No hand-maintained mobile DTOs, and no importing from `@cio/db`.
- **Validation**: reuse the Zod schemas in `packages/utils/src/validation/`.
- **State**: TanStack Query with a SQLite-backed persister so cached screens render instantly offline.
- **i18n**: load the dashboard translation catalog; no literal user-facing strings in components.

### Build verification

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/utils build && pnpm --filter @cio/db build && pnpm --filter @cio/api build
pnpm --filter @cio/mobile typecheck && pnpm --filter @cio/mobile test
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build   # regression
pnpm format:check
```

---

## Implementation Order

1. **Unblock notifications.** Ship `prd/notification-system` (table, `notify()`, in-app center). Mobile push has no foundation without it.
2. **Backend for mobile.** `device_token` + preference tables, push transport in the `apps/jobs` notifications worker, `/account/home-digest`, `/account/compliance`, HLS playback token, offline manifest, sync endpoint.
3. **App skeleton.** `apps/mobile` Expo project, auth (password → Google → SSO), org picker, role-aware tab bar, theming from org branding, i18n.
4. **Consumption path.** My Learning → course detail → lesson player (video, text, transcript) → mark complete → certificate. This is the first genuinely useful build.
5. **Assessment path.** All 16 question types, autosave, presigned media upload, results and resubmission.
6. **Compliance and certificates.** Home compliance band, compliance screen, certificate wallet with share/verify.
7. **Push end to end.** Token registration, categories, quiet hours, deep links from every notification type.
8. **Offline.** Download manager, storage settings, write queue, sync-on-reconnect, offline banners and blocked-state messaging.
9. **Engagement.** Community, newsfeed, cohorts, AI lesson tutor sheet.
10. **Tutor mode.** Grading queue, attendance, announcements, moderation.
11. **Store readiness.** Accessibility audit, App Store / Play listings, privacy nutrition labels, data-safety form, beta via TestFlight and Play internal testing.

Releases: 3–6 = Release 1 (learner core), 7–9 = Release 2 (push, offline, engagement), 10 = Release 3 (tutor), then white-label and microlearning.

## Acceptance Criteria

1. A learner can sign in with email/password, Google, and enterprise SSO; multi-org accounts choose an org and every request carries `cio-org-id`.
2. A self-hosted user can point the app at a custom API base URL and sign in; the single-org install skips the org picker.
3. Home shows compliance alerts, continue-learning, due-soon, newly-assigned, announcements, and feedback in one request, and renders a cached version offline with an explicit staleness chip.
4. A learner can complete an entire course on a phone — lessons, video, all 16 exercise question types, and certificate issuance — with progress matching the web dashboard exactly.
5. Video plays via HLS with captions, background audio, lock-screen controls, and PiP; the playback token authorizes a native player, and the existing cookie and session paths still work on web (regression check).
6. Push notifications arrive for every category in §9, respect per-category preferences and quiet hours, and deep-link to the right screen; disabling a category stops both push and in-app for that category.
7. A learner downloads a course, airplane-mode completes its lesson content, and every completion appears on the web dashboard after reconnect, with no duplicates on retry.
8. Exercises, AI tutor, and community compose show explicit "connection required" states offline rather than failing silently.
9. Compliance status, renewal dates, grace periods, and waivers match the web compliance view for the same learner.
10. A tutor sees the Teach tab only with ADMIN or TUTOR in the active org, and can grade a submission, take attendance, post an announcement, and moderate a post.
11. A student-role user has no path to authoring, org settings, billing, or admin data anywhere in the app; the API rejects such calls independently of the UI.
12. No purchase, upgrade, or checkout affordance exists anywhere in the app on any storefront.
13. Accessibility: screen-reader labels on all interactive elements, Dynamic Type honored, 44 pt minimum targets, no color-only status.
14. All user-facing copy comes from translation keys; the app runs in every language the dashboard supports.
15. Zero regression: dashboard, API, and self-hosted deployments behave exactly as before; all builds and `pnpm format:check` pass.

## Risks and Mitigations

- **Notification-system dependency slips.** Mobile's headline retention feature has no foundation. *Mitigation*: sequence it first (Implementation Order 1); if it slips, Release 1 ships without push and the app remains useful for consumption, but do not build a parallel notification path.
- **HLS auth on native players.** Cookie-based gating silently 403s in AVPlayer/ExoPlayer, which is easy to misdiagnose as a media bug. *Mitigation*: the playback-token endpoint is scheduled in Implementation Order 2, before any player work, and the web cookie path is left untouched.
- **Offline scope creep into assessments.** Offline quizzes bring conflict resolution, integrity, and grading-race problems. *Mitigation*: v1 queues only monotonic completion and playback position (Decision 11); revisit with its own PRD.
- **App Store rejection under Guideline 3.1.1.** Any in-app path to buying a course or plan triggers IAP obligations outside the US storefront. *Mitigation*: no purchase affordance at all (Decision 9), enforced by acceptance criterion 12; revisit only with a deliberate IAP design.
- **16 question types is a large surface.** Drag, hotspot, camera, and file types each carry native complexity. *Mitigation*: ship the legacy trio (`RADIO`, `CHECKBOX`, `TEXTAREA`) plus the common objective types first, gate uncommon types behind a "open in browser" fallback until their renderer lands, and never let an unsupported type silently render blank.
- **Storage exhaustion on low-end devices.** Downloaded video can fill a cheap Android phone. *Mitigation*: pre-download size estimate, a visible storage manager, Wi-Fi-only default, and a device-space check before each download.
- **Two clients drifting.** Mobile and web can diverge into different business rules. *Mitigation*: shared Zod validation, types inferred from the live API, and no mobile-only business logic — new capability lands in the API and both clients consume it.
- **Push cost and deliverability at scale.** Expo Push is a third-party hop in the delivery chain. *Mitigation*: the `provider` column and a transport-shaped worker make a move to direct FCM/APNs a swap rather than a rewrite.
- **Self-hosted push.** Self-hosters cannot use our Expo credentials. *Mitigation*: push degrades gracefully to in-app plus email when unconfigured — the same fallback pattern `prd/notification-system` uses for Trigger.dev.
