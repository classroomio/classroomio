# ClassroomIO — Feature & Flow Map (QA Audit)

> **Purpose of this document:** a reverse‑engineered, citation‑backed map of every
> feature in the ClassroomIO application, produced for QA to build test cases and
> record demo videos. **Files are the source of truth.** Every claim is backed by a
> file reference. Claims that could not be traced to code are marked
> `⚠️ UNVERIFIED`. Ambiguities live in **§7 Open Questions**, not in the body.
>
> Reference format: `` `path/to/file` `` → symbol/lines — what it proves.
> Scope (per QA request): full depth on the user‑facing product
> (`apps/dashboard`, `apps/api`, `apps/website`, `apps/embeds` + the packages that
> back features); a lighter **Supporting Infrastructure** summary for the rest.
> PRD folders (`prd/*`) are used only to cross‑check intent — code wins on conflict.

---

## 1. System Overview

**What it is.** ClassroomIO is an open‑source **Learning Management System (LMS) for
companies** — compliance/employee training, customer education, and partner
certification. It supports multi‑organization workspaces, courses/lessons/exercises,
cohorts (cohorts), certificates, an AI course builder + in‑lesson tutor, a public
REST API, an MCP server, and embeddable course widgets. It can be **self‑hosted** or
run as the **cloud** product. (`README.md` → lines 11–50 — feature summary;
`README.md` → 84–91 — monorepo apps.)

**Tech stack** (cited from manifests):
- **Monorepo**: pnpm + Turbo. `package.json` → root scripts/workspaces;
  `pnpm-workspace.yaml` → packages globs (`apps/*`, `packages/*`,
  `packages/course-app/src/*`); `turbo.json`.
- **Frontend**: SvelteKit + Svelte 5 + TailwindCSS. `README.md` → 52–58 ("Built With");
  `apps/dashboard/svelte.config.js`.
- **Backend API**: Hono (TypeScript). `apps/api/src/app.ts` → `new Hono()` app;
  `ARCHITECHTURE.md` → layered architecture (Routes → Services → Queries).
- **Database**: PostgreSQL via Drizzle ORM. `packages/db/src/schema.ts` (~3,400 lines
  of `pgTable`/`pgEnum`); `packages/db/src/drizzle.ts`.
- **Auth**: Better Auth (sessions, OAuth, SSO). `apps/api/src/app.ts` → 12, 107–188
  (`auth.handler`, `/api/auth/*`); `packages/db/src/auth.ts`.
- **Background jobs**: BullMQ + Redis. `apps/jobs`, `apps/api/src/routes/admin/queues.ts`
  (`mountQueueDashboard`), `mediaJob`/`jobStep`/`deadLetterJob` tables in `schema.ts`.
- **Object storage**: S3‑compatible / MinIO. `.env.example` → 77–89 (OBJECT_STORAGE_*);
  `README.md` → 176–191.
- **Billing**: Polar. `apps/dashboard/src/routes/api/polar/*`.
- **AI providers**: OpenAI / Google (Gemini) / Anthropic. `.env.example` → 110–115;
  `packages/utils/src/agent-models` (per `README.md` → 236).

**High‑level architecture** (`ARCHITECHTURE.md` → 9–51):
```
SvelteKit dashboard (apps/dashboard)  ──RPC (Hono client)──▶  Hono API (apps/api)
        │  server-side SSR proxy (.server.ts, PRIVATE_SERVER_KEY)        │
        │                                                                 ▼
   Public org sites / embeds                              Services → Queries (Drizzle)
   (apps/website, apps/embeds)                                     │
                                                                   ▼
                                              PostgreSQL · Redis/BullMQ · S3/MinIO
```
- Layered API: **Routes** (HTTP/validation/auth) → **Services** (business logic/
  transactions) → **Queries** (pure Drizzle). `ARCHITECHTURE.md` → 44–50.
- Shared **Zod validation** in `packages/utils/src/validation/*`, used by both API and
  dashboard. `ARCHITECHTURE.md` → 45; `AGENTS.md` → 17–25.
- Dashboard talks to the API through a typed Hono RPC client and an SSR auth proxy
  authenticated with `PRIVATE_SERVER_KEY`. `README.md` → 149–156.

---

## 2. Feature Inventory

Status legend: **Complete** = route+service+schema present; **Partial** = present but
gated/limited or doc claims exceed code; **Stub/Planned** = PRD only, little/no code.

| # | Feature | Purpose | Primary files | Status |
|---|---------|---------|---------------|--------|
| 1 | Authentication & sessions | Email/password, OAuth, session mgmt | `apps/api/src/app.ts:107`, `packages/db/src/auth.ts` | Complete |
| 2 | Signup gating | Org‑scoped/invite‑only/self‑host bootstrap rules | `apps/api/src/middlewares/signup-guard.ts` | Complete |
| 3 | Onboarding & org creation | Create profile + first organization | `apps/api/src/services/onboarding.ts`, `apps/dashboard/src/routes/(auth)/onboarding` | Complete |
| 4 | Organizations (workspaces) | Multi‑org, settings, members, plan | `apps/api/src/routes/organization/organization.ts`, `schema.ts:1949` | Complete |
| 5 | Team / people management | Invite teachers, assign roles | `apps/api/src/routes/course/people.ts`, `apps/dashboard/src/lib/features/people` | Complete |
| 6 | Courses | Create/manage courses, sections, content | `apps/api/src/routes/course/course.ts`, `schema.ts:634` | Complete |
| 7 | Lessons & lesson editor | Lesson content, multilingual, comments | `apps/api/src/routes/course/lesson.ts`, `.../lesson-language.ts`, `schema.ts:956` | Complete |
| 8 | Exercises & questions | Quizzes, question types, sections, grading | `apps/api/src/routes/course/exercise.ts`, `.../submission.ts`, `.../mark.ts`, `packages/question-types` | Complete |
| 9 | Course people / enrollment | Enroll students, roster | `apps/api/src/routes/course/people.ts` | Complete |
| 10 | Course invites | Email + link invites with audit | `apps/api/src/routes/course/invite.ts`, `apps/api/src/services/course/invite.ts`, `schema.ts:1282` | Complete |
| 11 | Org invites | Invite org members (EMAIL/LINK) | `apps/api/src/routes/invite/invite.ts`, `schema.ts:1384` | Complete |
| 12 | Compliance training | Deadlines, renewals, grace, records | `apps/api/src/routes/course/compliance.ts`, `apps/api/src/routes/internal`, `schema.ts:768` (`courseCompletionRecord`) | Complete |
| 13 | Certificates | Issue branded certificates | `packages/certificates/src/render.ts`, `schema.ts:850` (`courseCertificateIssue`) | Complete |
| 14 | Cohorts | Group courses, goals, members, newsfeed | `apps/api/src/routes/cohort/cohort.ts`, `schema.ts` cohort tables | Complete |
| 15 | Community Q&A | Per‑course questions/answers | `apps/api/src/routes/community/community.ts`, `schema.ts:1558` | Complete |
| 16 | Course newsfeed | Course/cohort announcements + comments | `apps/api/src/routes/course/newsfeed.ts`, `schema.ts:1605` | Complete |
| 17 | Attendance | Track group/live‑class attendance | `apps/api/src/routes/course/attendance.ts`, `schema.ts:321` (`groupAttendance`) | Complete |
| 18 | AI Course Assistant | In‑course AI authoring/plan/edit chat | `apps/api/src/routes/agent/*`, `packages/ai-assistant`, `schema.ts:3163` (`aiAgentRun`) | Complete (key‑gated) |
| 19 | AI Lesson Tutor | In‑lesson learner AI helper + fair‑use caps | `apps/api/src/routes/course/ai-tutor.ts`, `apps/api/src/routes/organization/ai-tutor.ts`, `schema.ts:3013` (`aiTutorMessageCount`) | Complete (key‑gated) |
| 20 | AI credits / token billing | Token usage, balance, purchases | `schema.ts:2919` (`aiTokenUsage`), `apps/dashboard/src/lib/features/agent/api/credit-purchase.server.ts` | Complete (cloud billing) |
| 21 | Course import | Import from prompt/PDF/course | `apps/api/src/routes/organization/course-import.ts`, `apps/api/src/services/course-import`, `schema.ts:2603` | Complete |
| 22 | Media manager | Upload/manage video/docs/media, transcripts | `apps/api/src/routes/media/media.ts`, `.../transcripts.ts`, `.../hls.ts`, `apps/dashboard/src/lib/features/media`, `schema.ts:1028` (`asset`) | Complete |
| 23 | Tags | Tag groups/tags/assignments for courses | `apps/api/src/routes/organization/tags.ts`, `schema.ts:2158` | Complete |
| 24 | Org public site (org‑site) | Branded public course catalog/pages | `apps/api/src/routes/org-site`, `apps/dashboard/src/routes/(org-site)` | Complete |
| 25 | Custom domains | Cloudflare custom domain mapping | `apps/api/src/routes/domain/domain.ts`, `apps/tenant-router` | Complete |
| 26 | Course widget embed | Embeddable course catalog widget | `apps/api/src/routes/widgets`, `apps/dashboard/src/routes/(app)/widgets`, `apps/embeds`, `schema.ts:2255` (`widget`) | Complete |
| 27 | Public REST API (v1) | API‑key automation: courses, audience | `apps/api/src/routes/v1/*`, `apps/api/src/services/v1`, `schema.ts:2539` (`organizationApiKey`) | Complete |
| 28 | Automation / API keys | Issue mcp/api/zapier keys with scopes | `apps/api/src/routes/organization/automation.ts`, `apps/api/src/middlewares/automation-key*.ts` | Complete |
| 29 | MCP server | `@classroomio/mcp` AI‑native course authoring | `packages/mcp/src/*` | Complete |
| 30 | Enterprise SSO | OIDC SSO (Okta/Google Workspace/Auth0) | `apps/api/src/routes/organization/sso.ts`, `apps/api/src/routes/sso/discovery.ts`, `schema.ts:2479` (`organizationSsoConfig`) | Complete (licensed) |
| 31 | Token auth | Token‑based auth policy | `apps/api/src/routes/organization/token-auth.ts`, `schema.ts:2513` (`organizationTokenAuth`) | Complete (licensed) |
| 32 | Licensing | Self‑host license‑gated features | `apps/api/src/routes/license.ts`, `apps/api/src/middlewares/license.ts`, `packages/utils/src/license/*` | Complete |
| 33 | Billing (Polar) | Subscriptions + AI token packs | `apps/dashboard/src/routes/api/polar/*` | Complete (cloud only) |
| 34 | Analytics | Login/page events, org/course/country daily | `apps/api/src/routes/dash`, `apps/api/src/services/analytics`, `schema.ts:167–285` | Complete |
| 35 | Email / notifications | Transactional emails via jobs | `apps/api/src/routes/mail`, `packages/email`, `apps/api/src/services/jobs` | Complete |
| 36 | Background jobs | Media/email queues, BullMQ dashboard | `apps/jobs`, `apps/api/src/routes/jobs`, `apps/api/src/routes/admin/queues.ts` | Complete |
| 37 | Unsplash image search | Image picker for content | `apps/api/src/routes/unsplash/unsplash.ts` | Complete |
| 38 | Marketing website | classroomio.com landing | `apps/website` | Complete |
| 39 | Documentation site | classroomio.com/docs | `apps/docs` | Complete |
| 40 | Outbound webhooks | Emit `certificate.issued`, etc. | `prd/webhooks` (todo) | **Stub/Planned ⚠️** |
| 41 | SCORM support | SCORM package support | `prd/scorm-support` (todo) | **Stub/Planned ⚠️** |
| 42 | Notification system | In‑app notifications | `prd/notification-system` (todo) | **Stub/Planned ⚠️** |

> Items 40–42 are listed in `PRD-TRACKER.md` → 9, 16, 24 as **todo**; treat as not yet
> shipped. See **§7**.

---

## 3. Per‑Feature Detail

### 3.1 Authentication & Sessions
- **Purpose:** authenticate users (email/password + OAuth) and attach org roles to the session.
- **How it works:** All `/api/auth/*` requests are handled by Better Auth via
  `auth.handler`. `apps/api/src/app.ts` → 107–188. A global middleware resolves the
  session on every request and sets `user`, `session`, and `orgRoles` into context.
  `apps/api/src/app.ts` → 60–97. The app rebuilds the request host from
  `X-Forwarded-Host`/`-Proto` (Cloudflare proxy) and uses a Redis "oauth handoff" to
  shrink large OAuth callback cookies into a short token. `apps/api/src/app.ts` → 110–173.
- **User flow:** Login page → submit email/password (or OAuth) → Better Auth sets
  session cookie → dashboard reads `/session`. `apps/dashboard/src/routes/(auth)/login`;
  `apps/api/src/app.ts` → 189–199 (`/session`).
- **Key files:** `apps/api/src/app.ts`, `packages/db/src/auth.ts`,
  `packages/db/src/auth/hooks/create-profile.ts`.
- **Edge cases:** OAuth cookie > 500 chars routed through Redis token (`app.ts:160`);
  `getSession` failures fall through as anonymous (`app.ts:71–84`); session carries
  `orgRoles` map used by RBAC middlewares (`app.ts:88`).

### 3.2 Signup Gating (`signupGuard`)
- **Purpose:** enforce org‑level and deployment‑level signup rules server‑side.
- **How it works:** `apps/api/src/middlewares/signup-guard.ts` → 129–159. With a
  `cio-org-id` header: rejects when `org.disableSignup` (403 `SIGNUP_DISABLED`, line 148)
  or when `settings.signup.inviteOnly` and the email lacks an active invite (403
  `INVITE_REQUIRED`, lines 97–113). Without the header: cloud passes through; **self‑hosted
  requires org context** unless no org exists yet (bootstrap) or the email already belongs
  to the org. Lines 75–91 (`canProceedWithoutOrgContext`).
- **User flow:** Signup form → POST `/api/auth/sign-up/*` (guarded, `app.ts:106`) → allowed
  / `SIGNUP_DISABLED` / `INVITE_REQUIRED` / `ORG_CONTEXT_REQUIRED`.
- **Edge cases (tester probes):** invite‑only org without invite; disabled signup;
  self‑hosted with no `cio-org-id` and an existing org; unparseable body → 400 `INVALID_REQUEST`.

### 3.3 Onboarding & Organization Creation
- **Purpose:** create the user profile and first organization, then send a welcome email.
- **How it works:** `apps/api/src/services/onboarding.ts`. `createOrganizationWithOwner`
  validates site‑name uniqueness (409 `SITENAME_EXISTS`, lines 36–40), creates org + admin
  member in a transaction (lines 44–61), and on **self‑hosted** assigns the org an
  `ENTERPRISE` plan with provider `selfhosted` (lines 64–77). **Self‑hosted blocks a second
  org** (403, lines 28–33). `completeOnboarding` enqueues a `welcome` email (lines 121–134).
- **User flow:** Signup → `(auth)/onboarding` → enter name/org/site name → org+admin created → dashboard.
- **Edge cases:** duplicate site name (409 + Postgres `23505` fallback, lines 93–95);
  second‑org attempt on self‑host; profile not found (404).

### 3.4 Organizations (Workspaces)
- **Purpose:** the top‑level tenant; owns courses, members, settings, plan, branding.
- **How it works:** `apps/api/src/routes/organization/organization.ts` (CRUD + settings);
  `organization` table `schema.ts:1949` (siteName, settings, branding, `disableSignup`).
  Members live in `organizationmember` (`schema.ts:1754`) with `roleId` FK to `role`.
- **User flow:** Org switcher → settings → update name/site/branding/signup policy.
  `apps/dashboard/src/lib/features/ui/sidebar/org-sidebar/org-switcher.svelte`;
  `apps/dashboard/src/lib/features/settings`.
- **Edge cases:** unique `siteName`; self‑hosted = single org (see §5); org settings drive
  signup gating (§3.2).

### 3.5 Courses, Sections & Content
- **Purpose:** author and deliver courses (self‑paced, live‑class, compliance, public).
- **How it works:** course sub‑routers under `apps/api/src/routes/course/` — `course.ts`,
  `section.ts`, `content.ts`, `lesson.ts`, `exercise.ts`, `people.ts`, `newsfeed.ts`,
  `attendance.ts`, `compliance.ts`, `mark.ts`, `submission.ts`, `invite.ts`,
  `lesson-language.ts`, `payment-request.ts`, `presign.ts`, `ai-tutor.ts`, `katex.ts`
  (`index.ts` composes them). Course type enum `SELF_PACED|LIVE_CLASS|COMPLIANCE|PUBLIC`
  (`schema.ts:26`). Course row `schema.ts:634`.
- **User flow:** Courses → New course → add sections/lessons → add exercises → publish →
  students enroll. `apps/dashboard/src/routes/(app)/courses/[id]`.
- **Edge cases:** course type drives compliance/public behavior; locale enum (`schema.ts:27`,
  10 languages) drives multilingual lessons.

### 3.6 Lessons & Multilingual Editor
- **Purpose:** lesson content with notes/slides/video, comments, translations.
- **How it works:** `lesson` (`schema.ts:956`), `lessonComment` (`schema.ts:516`),
  `lessonCompletion` (`schema.ts:1490`), `lessonLanguage` + `…History` (`schema.ts:1706`,
  `1732`). Routes: `apps/api/src/routes/course/lesson.ts`, `.../lesson-language.ts`.
  PRDs `prd/lesson-edit [DONE]`, `prd/lessons-list [DONE]` confirm intent.
- **User flow:** Open lesson → edit content → add translation → student marks complete.
- **Edge cases:** language history retained; completion tracked per student.

### 3.7 Exercises, Question Types & Grading
- **Purpose:** quizzes/assessments with multiple question types and grading.
- **How it works:** `exercise` (`schema.ts:1175`), `exerciseSection` (`schema.ts:1217`),
  `question`/`questionType`/`questionAnswer` (`schema.ts:1803–1913`), `submission`/
  `submissionstatus` (`schema.ts:571,617`), `exerciseTemplate` (`schema.ts:2401`).
  Routes `exercise.ts`, `submission.ts`, `mark.ts`. Shared types in `packages/question-types`.
  PRDs: `exercise-question-types`, `exercise-sections [DONE]`, `video-recording-question-type [DONE]`.
- **User flow:** Author exercise → add questions (incl. video‑recording type) → student
  submits → tutor/admin marks → status recorded.
- **Edge cases:** section‑based exercises; video‑recording answers (media pipeline);
  `prd/selective-exercise-assignment` is **todo** (assign specific exercises to specific
  students) — verify it is *not* yet available.

### 3.8 Enrollment, Course Invites & Secure Invites
- **Purpose:** add students to courses by email or shareable link, with audit trail.
- **How it works:** `apps/api/src/services/course/invite.ts`; `courseInvite`
  (`schema.ts:1282`) + `courseInviteAudit` (`schema.ts:1342`); event‑type enum
  `schema.ts:53`. Org invites: `organizationInvite` (`schema.ts:1384`, EMAIL/LINK enum
  `schema.ts:71`) + `…Audit` (`schema.ts:1448`), routes `apps/api/src/routes/invite/invite.ts`.
  PRD `secure-student-invites [DONE]`.
- **User flow:** Course → People → Invite (email or link) → invitee accepts via
  `apps/dashboard/src/routes/invite/[hash]` or `/invite/link/[hash]` → enrolled.
- **Edge cases:** invite expiry/custom expiry (`AGENTS.md:231` references
  `customExpiresAt`); link vs email; audit events recorded; invite‑only signup interplay (§3.2).

### 3.9 Compliance Training
- **Purpose:** deadline tracking, renewals/retake intervals, grace periods, completion records.
- **How it works:** `apps/api/src/routes/course/compliance.ts` and internal compliance
  router `apps/api/src/routes/internal` (`AGENTS.md:87–98`); `courseCompletionRecord`
  (`schema.ts:768`), `courseCompletionNotificationEvent` (`schema.ts:824`),
  `courseCertificateIssue` (`schema.ts:850`). Course type `COMPLIANCE` (`schema.ts:26`).
  PRD `compliance-training-platform [DONE]`.
- **User flow:** Mark course as compliance → set deadlines/renewal → learners complete →
  completion record + certificate; renewal/grace events tracked.
- **Edge cases:** grace periods, renewal intervals, waivers (per README 21), notification events.

### 3.10 Certificates
- **Purpose:** issue branded completion certificates with custom IDs.
- **How it works:** `packages/certificates/src/render.ts` + `templates/` render the
  certificate; `courseCertificateIssue` (`schema.ts:850`) records issuance.
- **User flow:** Learner completes course → certificate issued → downloadable/branded.
- **Edge cases:** custom certificate IDs (README 21); template selection.

### 3.11 Cohorts & Goals
- **Purpose:** group courses into cohorts with goals, members, and progress tracking.
- **How it works:** `apps/api/src/routes/cohort/cohort.ts`; tables `cohort`
  (`schema.ts:2646`), `programCourse` (`2677`), `programMember` (`2704`), `programNewsfeed`
  +`Comment` (`2739`,`2767`), `programGoal`/`…Assignment` (`2829`,`2878`) with goal‑type/
  deadline/status enums (`2803–2828`), status enum `ACTIVE|INACTIVE|ARCHIVED` (`2644`).
  Middlewares `cohort-member.ts`, `cohort-team-member.ts`. PRD `cohorts [DONE]`.
- **User flow:** Create cohort → add courses + members → set goals/deadlines → track
  progress → cohort newsfeed. `apps/dashboard/src/routes/(app)/cohorts/[id]`.
- **Edge cases:** goal deadline kinds; assignment status; archived cohorts.

### 3.12 Community Q&A & Newsfeed
- **Purpose:** per‑course discussion (questions/answers) and announcements.
- **How it works:** `apps/api/src/routes/community/community.ts` with route‑specific
  `middlewares/question-author-or-team` (`ARCHITECHTURE.md:241–252`); tables
  `communityQuestion`/`communityAnswer` (`schema.ts:1558`,`1522`), `courseNewsfeed`/
  `…Comment` (`1605`,`1632`). Comment‑author middlewares `newsfeed-comment-author-or-team.ts`,
  `cohort-newsfeed-comment-author-or-team.ts`.
- **User flow:** Course → Community → ask/answer; team can moderate. Newsfeed posts +
  comments at course and cohort level.
- **Edge cases:** author‑or‑team authorization (only author or course team can edit/delete).

### 3.13 AI Course Assistant (authoring chat)
- **Purpose:** in‑course AI that generates outlines, lesson content, and edits.
- **How it works:** `apps/api/src/routes/agent/{agent,history,runs}.ts`; `packages/ai-assistant`;
  run tracking in `aiAgentRun`/`…Step`/`…Event` (`schema.ts:3163`,`3225`,`3259`),
  conversation/model context/documents (`3083`,`3106`,`3138`). **Disabled until a provider
  key is set**; `GET /agent/status` flips to `enabled:true` when any of OPENAI/GOOGLE/
  ANTHROPIC key is present. `README.md:223–238`. Selected model persisted in `localStorage`
  (`classroomio-ai-chat-model`), provider resolved server‑side; missing key → 503
  `AI_NOT_CONFIGURED` (`README.md:236`).
- **User flow:** Course → AI button (only shown when enabled) → chat to build/edit course.
- **Edge cases:** no key → AI button hidden / 503; per‑model provider resolution; optional
  Tinybird observability (`TINYBIRD_TOKEN`).

### 3.14 AI Lesson Tutor + Fair‑Use Caps
- **Purpose:** in‑lesson AI helper for learners, with usage caps.
- **How it works:** `apps/api/src/routes/course/ai-tutor.ts`,
  `apps/api/src/routes/organization/ai-tutor.ts`; `aiTutorMessageCount` (`schema.ts:3013`)
  + `aiTutorCapEvent` (`3050`). Settings UI `apps/dashboard/src/lib/features/ai-tutor-settings`.
  PRD `ai-tutor-fair-use`.
- **User flow:** Learner in lesson → ask tutor → counts toward cap → cap event when exceeded.
- **Edge cases:** per‑org cap configuration; cap‑exceeded behavior.

### 3.15 AI Credits / Token Billing
- **Purpose:** meter AI token usage and sell token packs.
- **How it works:** `aiTokenUsage` (`schema.ts:2919`), `aiCreditBalance` (`2950`),
  `aiCreditPurchase` (`2974`); purchases recorded by Polar `order.paid` webhook →
  `CreditPurchaseApiServer.recordPurchase`. `apps/dashboard/src/routes/api/polar/webhook/+server.ts`
  → 33–82; token‑pack constants `@cio/utils/plans` (`TOKEN_PACK.TOKENS_PER_UNIT`, line 53).
- **User flow:** Buy tokens (`/api/polar/buy-tokens`) → Polar checkout → webhook credits org balance.
- **Edge cases:** **cloud only** (Polar); quantity/metadata parsing; UUID validation of
  `triggeredBy` (lines 61–66).

### 3.16 Course Import
- **Purpose:** create courses from a prompt, PDF, or existing course.
- **How it works:** `apps/api/src/routes/organization/course-import.ts`,
  `apps/api/src/services/course-import`; `courseImportDraft` (`schema.ts:2603`) with source
  enum `prompt|pdf|course` (`schema.ts:29`) and draft status `DRAFT|PUBLISHED|ARCHIVED` (`30`).
- **User flow:** Org → Import course → choose source → review draft → publish.
- **Edge cases:** draft lifecycle; PDF parsing pipeline (jobs/media).

### 3.17 Media Manager (video/docs, transcripts, HLS)
- **Purpose:** upload and manage media; transcode video to HLS; generate transcripts.
- **How it works:** routes `media/media.ts`, `transcripts.ts`, `hls.ts`, `course/presign.ts`
  (S3 presigned uploads). Tables `asset`/`assetUsage` (`schema.ts:1028`,`1086`),
  `mediaJob`/`jobStep`/`mediaTranscript`/`deadLetterJob` (`schema.ts:3297`,`3357`,`3393`,`3447`),
  `videoTranscripts` (`916`). Jobs processed by `apps/jobs`. Dashboard
  `apps/dashboard/src/lib/features/media`. PRD `media-manager [DONE]`. Storage via MinIO/S3
  (`.env.example:77–89`).
- **User flow:** Media → upload → background transcode/transcribe → use asset in lesson.
- **Edge cases:** job retries / dead‑letter; HLS cross‑origin headers (`app.ts:48–54`);
  Google Drive picker optional (`.env.example:99–101`).

### 3.18 Tags
- **Purpose:** categorize courses via tag groups/tags.
- **How it works:** `apps/api/src/routes/organization/tags.ts`; `tagGroup`/`tag`/
  `tagAssignment` (`schema.ts:2158`,`2188`,`2225`). PRD `tags-feature [DONE]`.
- **User flow:** Org → Tags → create groups/tags → assign to courses → filter catalog.

### 3.19 Org Public Site (org‑site) & Theming
- **Purpose:** branded public catalog and course landing pages for an org.
- **How it works:** API `apps/api/src/routes/org-site` (mounted `/org-site/course`,
  `app.ts:217`); dashboard public routes `apps/dashboard/src/routes/(org-site)/{course,courses}`.
  Theme picker PRD `org-landing-page-theme-picker [DONE]`.
- **User flow:** Visitor → org public site → browse courses → view course → enroll/sign up.
- **Edge cases:** self‑host vs cloud routing differences (see §5); org branding/theme.

### 3.20 Custom Domains
- **Purpose:** map a customer's own domain to their org site.
- **How it works:** `apps/api/src/routes/domain/domain.ts` (mounted `/domain`, `app.ts:203`);
  routing app `apps/tenant-router`. PRD `custom-domain-cloudflare [DONE]`.
- **User flow:** Org settings → add custom domain → Cloudflare mapping → site served on domain.

### 3.21 Course Widget Embed
- **Purpose:** embed an org's course catalog on any external website.
- **How it works:** API `apps/api/src/routes/widgets` (mounted `/widgets`, `app.ts:221`);
  dashboard `apps/dashboard/src/routes/(app)/widgets/[widgetId]` + `widget-preview`; build
  artifacts `apps/embeds` (`embeds:publish`, `README.md:256–257`). Tables `widget`/
  `widgetCourse`/`widgetVersion` (`schema.ts:2255`,`2305`,`2336`) with status/layout/
  selection enums (`42–52`). PRD `course-widget-embed [DONE]`.
- **User flow:** Widgets → create widget → choose courses/layout → publish → copy embed
  snippet (`embed-preview.html`).
- **Edge cases:** draft vs published widget; manual vs published course selection mode.

### 3.22 Public REST API (v1) & Automation Keys
- **Purpose:** programmatic access for integrations/automation.
- **How it works:** `apps/api/src/routes/v1/{courses,audience}.ts` mounted at
  `/public-api/v1` (`app.ts:218`, `v1/index.ts`). Auth via `automationKeyMiddleware` +
  `automationKeyScopesMiddleware(['public_api:*'])` on every route; OpenAPI documented via
  `hono-openapi`. Courses endpoints: list/create/get/update/delete, list students, export,
  get/put structure (`v1/courses.ts`). Keys: `organizationApiKey` (`schema.ts:2539`, type
  `mcp|api|zapier`), usage tracked in `organizationAutomationUsage` (`2574`); managed via
  `apps/api/src/routes/organization/automation.ts`. PRD `public-api [DONE]`.
- **User flow:** Org → API keys → create key with scopes → call `/public-api/v1/...` with key.
- **Edge cases:** scope enforcement (403 on missing scope); usage categories `read|write|publish`
  (`schema.ts:32`); per‑org isolation via `orgId` from key context.

### 3.23 MCP Server
- **Purpose:** AI‑native course authoring through the Model Context Protocol.
- **How it works:** `packages/mcp/src/{index.ts,api-client.ts,config.ts,tools/}`; published
  as `@classroomio/mcp` (`README.md:258`). Talks to the public API using an automation key.
  PRD `mcp-course-authoring [DONE]`.
- **User flow:** Configure MCP client with API key → AI tools create/update courses.

### 3.24 Enterprise SSO & Token Auth (licensed)
- **Purpose:** OIDC SSO and token‑based auth for enterprise self‑host.
- **How it works:** `apps/api/src/routes/organization/sso.ts`,
  `apps/api/src/routes/sso/discovery.ts` (mounted `/organization/sso`, `/sso`, `app.ts:211,213`);
  `organizationSsoConfig` (`schema.ts:2479`), provider enum `OKTA|GOOGLE_WORKSPACE|AUTH0`
  (`schema.ts:2444`), `organizationAuthPolicy` (`2447`). Token auth:
  `apps/api/src/routes/organization/token-auth.ts`, `organizationTokenAuth` (`2513`).
  **License‑gated on self‑host** via `requireLicense('sso'|'token-auth')`
  (`apps/api/src/middlewares/license.ts`). PRD `enterprise-sso [DONE]`.
- **User flow:** Org → SSO settings → register IdP (discovery fetches
  `.well-known/openid-configuration`) → users sign in via IdP.
- **Edge cases:** trusted OIDC origins allow‑listed (`packages/db/src/constants.ts:14–24`);
  cloud has no license restriction (see §5).

### 3.25 Licensing
- **Purpose:** gate Enterprise self‑host features behind a license key.
- **How it works:** `apps/api/src/routes/license.ts` (mounted `/license`, `app.ts:209`),
  `apps/api/src/services/license.ts` (`isFeatureLicensed`), feature ids `sso`,
  `token-auth`, `no-tracking` (`packages/utils/src/license/constants.ts:8–10`),
  plan→feature mapping `packages/utils/src/license/plan-features.ts`. Dashboard side
  `apps/dashboard/src/lib/features/license/api/license.svelte.ts` (`licenseApi.hasAccess`).
- **User flow:** Set `LICENSE_KEY` (`.env.example:117–118`) → licensed features unlock.
- **Edge cases:** `requireLicense` is a **no‑op on cloud** (`license.ts:15–19`).

### 3.26 Billing (Polar) — cloud
- **Purpose:** paid subscriptions and AI token packs.
- **How it works:** `apps/dashboard/src/routes/api/polar/{subscribe,buy-tokens,portal,webhook}`.
  Webhook handles `order.paid` (token packs → credit balance) and `subscription.*`
  (create/update/cancel org plan). `webhook/+server.ts` → 30–168. Plans enum
  `EARLY_ADOPTER|ENTERPRISE|BASIC` (`schema.ts:28`), org plan stored in `organizationPlan`
  (`schema.ts:1667`).
- **User flow:** Upgrade → Polar checkout → webhook activates/updates plan; manage via portal.
- **Edge cases:** **cloud only**; subscription cancel → `cancelOrgPlan`; webhook secret
  `POLAR_WEBHOOK_SECRET` required.

### 3.27 Analytics
- **Purpose:** usage analytics for orgs/courses.
- **How it works:** `apps/api/src/routes/dash` + `apps/api/src/services/analytics`; tables
  `analyticsLoginEvents`, `analyticsPageEvent`, `analyticsOrgDaily`, `analyticsCourseDaily`,
  `analyticsCountryDaily` (`schema.ts:167–285`). Dashboard `apps/dashboard/src/lib/features/analytics`.
  Client tracking (PostHog/Umami) gated by deployment mode / license (§5).
- **User flow:** Org → Analytics dashboard → view login/page/course metrics.

### 3.28 Email / Notifications & Background Jobs
- **Purpose:** transactional email and async processing.
- **How it works:** `apps/api/src/routes/mail`, templates in `packages/email`,
  enqueued via `enqueueTransactionalEmail` (`apps/api/src/services/jobs`,
  `onboarding.ts:128`). Workers in `apps/jobs`; BullMQ dev dashboard at `/admin/queues`
  (`apps/api/src/routes/admin/queues.ts`, `app.ts:232–234`). Email providers: Zoho/ZeptoMail
  or SMTP (`.env.example:62–74`).
- **User flow:** trigger (signup, invite, completion) → email queued → worker sends.
- **Edge cases:** idempotency keys (`onboarding.ts:133`); dead‑letter jobs (`schema.ts:3447`).
- **Note:** an in‑app **notification system** is `prd/notification-system` **todo** — not shipped.

---

## 4. Roles & Responsibilities

**Org roles** are integers: `ADMIN=1`, `TUTOR=2`, `STUDENT=3`
(`packages/utils/src/constants/roles.ts:1–4`). They are stored on
`organizationmember.roleId` (`schema.ts:1767`, FK to `role` table `schema.ts:1913`) and
surfaced into the session as an `orgRoles` map keyed by org id (`apps/api/src/app.ts:88`).
RBAC middlewares read `orgRoles[orgId]` (org id from the `cio-org-id` header) — **no
per‑request DB lookup** (`apps/api/src/middlewares/org-team-member.ts:5–53`).

| Role | Can do | Cannot do | Enforced by |
|------|--------|-----------|-------------|
| **ADMIN** (1) | Full org control: settings, members, billing, courses, SSO, API keys, all team actions | — | `org-admin.ts`, `org-team-member.ts` (admin∈team) |
| **TUTOR** (2) | Team actions: author/manage courses, grade, moderate community/newsfeed | Org admin‑only ops (org settings, billing, member roles) | `org-team-member.ts:44` (ADMIN or TUTOR), `course-team-member.ts` |
| **STUDENT** (3) | Enroll, learn, submit exercises, post community Q&A, use tutor | Authoring/grading/team/admin actions | absence of team/admin role → 403 |
| **Guest / anonymous** | Public org sites, public courses, embeds, public API (with key) | Any authed action | session = null path (`app.ts:77–84`); public CORS paths (`app.ts:60–67`) |

**Resource‑scoped middlewares** (`apps/api/src/middlewares/`):
- `authMiddleware` — requires a session (`auth.ts`).
- `orgMemberMiddleware` — must be org member; `orgTeamMemberMiddleware` — ADMIN|TUTOR;
  `orgAdminMiddleware` — ADMIN only (`ARCHITECHTURE.md:233–237`).
- `courseMemberMiddleware` / `courseTeamMemberMiddleware` — course‑level membership/team.
- `cohortMemberMiddleware` / `cohortTeamMemberMiddleware` — cohort-level.
- `apiKeyMiddleware` / `automationKeyMiddleware` (+ `automationKeyScopesMiddleware`) —
  machine auth for webhooks/public API; `authOrApiKeyMiddleware`,
  `authOrAutomationKeyMiddleware`, and `*-or-automation-key`/`*-or-api-key` variants allow
  either a session or a key.
- `requireLicense(feature)` — self‑host license gate (`license.ts`).
- `workspaceNotReadonlyMiddleware` — blocks writes on read‑only workspaces
  (`workspace-not-readonly.ts`).
- `signupGuard` — signup rules (§3.2). `rateLimiter` — global rate limit (`app.ts:98`).
- Route‑specific author/team guards: `question-author-or-team`,
  `newsfeed-comment-author-or-team`, `cohort-newsfeed-comment-author-or-team`.

**Public API scopes:** automation keys carry scopes like `public_api:*`, enforced per route
(`apps/api/src/routes/v1/courses.ts:47`); usage categorized `read|write|publish`
(`schema.ts:32`).

---

## 5. Deployment Modes — Self‑Hosted vs Cloud

The single switch is **`PUBLIC_IS_SELFHOSTED`** (`=true` ⇒ self‑hosted). Source of truth:
`.env.example:26` (Docker stack), `apps/dashboard/.env.example`, and the local‑dev value
`apps/dashboard/.env` (`PUBLIC_IS_SELFHOSTED=true`, `README.md:155`). The flag is read in
both the API/db layer (`process.env.PUBLIC_IS_SELFHOSTED`) and the dashboard
(`$env/static/public`). Every behavioral difference below is traced to a flag check.

### 5.1 Self‑Hosted mode (`PUBLIC_IS_SELFHOSTED=true`)
- **Setup:** Docker Compose full stack — `cp .env.example .env` then
  `./run-docker-full-stack.sh` (auto‑generates `PRIVATE_SERVER_KEY`, `BETTER_AUTH_SECRET`);
  `README.md:240–249`, `docker-compose.yaml`, `docker/Dockerfile.{api,dashboard}`,
  `docker/docs/SELF_HOST.md`. Bundled Postgres, Redis, MinIO.
- **Single organization:** org creation **blocks a second org**
  (`apps/api/src/services/onboarding.ts:28–33`); the new org is auto‑assigned an
  `ENTERPRISE` plan with provider `selfhosted` (`onboarding.ts:64–77`). The "add org" UI is
  **hidden** (`apps/dashboard/src/routes/(app)/org/[slug]/+layout.svelte:29–31`) and the
  org‑site→LMS redirect is **skipped** (`.../+layout.server.ts:16`). PRD `self-host-single-org.md`.
- **Signup:** requires org context unless bootstrapping the first org or the email already
  belongs to the org (`signup-guard.ts:75–91`).
- **Licensing:** Enterprise features (`sso`, `token-auth`, `no-tracking`) are **gated by
  `LICENSE_KEY`** — `requireLicense` actively checks (`middlewares/license.ts:15–22`);
  `.env.example:117–118`.
- **Tracking:** cloud analytics (PostHog/Umami) are **disabled**
  (`apps/dashboard/src/lib/utils/functions/appSetup.ts:23–27`); a `no-tracking` license also
  suppresses tracking (`appSetup.ts:29–37`).
- **URLs/links:** `BASE_URL` and invite/email links use `DASHBOARD_ORIGIN` when self‑hosted
  (`packages/db/src/constants.ts:36–37`; `.env.example:32–35`). Dashboard SSR calls the API
  internally via `PRIVATE_SERVER_URL` (`.env.example:28–30`).
- **Storage/email:** MinIO + Zoho/SMTP from `.env` (`.env.example:62–89`).

### 5.2 Cloud mode (`PUBLIC_IS_SELFHOSTED` ≠ `true`)
- **Multi‑org:** users can create/switch multiple orgs (no single‑org block); "add org" UI
  shown (`+layout.svelte:29`).
- **Billing:** Polar subscriptions + AI token packs are active
  (`apps/dashboard/src/routes/api/polar/*`); plan set via subscription webhooks
  (`webhook/+server.ts`). License gate is a **no‑op** — cloud has no license restrictions
  (`middlewares/license.ts:15–19`).
- **Tracking:** PostHog/Umami/UserJot analytics enabled (`appSetup.ts:17–27`).
- **Signup:** org context optional unless org settings restrict it (`signup-guard.ts:132–139`).
- **Infra:** hosted Postgres/Redis/S3; dashboard deployed on Cloudflare Workers
  (`apps/dashboard/wrangler.jsonc`, `svelte.config.js`).

### 5.3 Mode‑exclusive features (summary)
| Concern | Self‑Hosted | Cloud |
|---|---|---|
| Number of orgs | One only (`onboarding.ts:28`) | Many |
| Enterprise SSO / token‑auth | Requires `LICENSE_KEY` (`license.ts`) | Always allowed (no license) |
| Billing (Polar) | Not used (plan = selfhosted ENTERPRISE) | Subscriptions + token packs |
| Analytics tracking | Off (unless… still off) (`appSetup.ts:24`) | On |
| API base / links | `DASHBOARD_ORIGIN` (`constants.ts:37`) | `PUBLIC_SERVER_URL` |
| Add‑org modal | Hidden (`+layout.svelte:29`) | Shown |

> Both modes exist in source and share one codebase; **neither mode is
> `⚠️ NOT FOUND`.** The product is one app with flag‑driven divergence.

---

## 6. End‑to‑End Flow Diagrams (text)

**A. Signup → Onboarding → Workspace**
```
Login/Signup (apps/dashboard/.../(auth)/signup)
  → POST /api/auth/sign-up/*  [signupGuard]      (app.ts:106; signup-guard.ts)
  → Better Auth creates user + profile           (auth.ts; create-profile.ts)
  → (auth)/onboarding: createOrganizationWithOwner (onboarding.ts:19)
        · self-host: block 2nd org, assign ENTERPRISE plan
  → completeOnboarding → enqueue 'welcome' email (onboarding.ts:121)
  → Dashboard /lms or /org/[slug]
```

**B. Author a course**
```
Courses → New course (course.ts)
  → add sections (section.ts) → lessons (lesson.ts) + translations (lesson-language.ts)
  → add exercises/questions (exercise.ts, question-types)
  → [optional] AI Assistant builds content (agent/*; requires provider key)
  → publish → appears on org site / widget
```

**C. Student learns → certificate (compliance)**
```
Invite (course/invite.ts) → accept /invite/[hash]
  → enroll (people.ts) → study lessons → mark complete (lessonCompletion)
  → submit exercises (submission.ts) → tutor grades (mark.ts)
  → completion recorded (courseCompletionRecord schema.ts:768)
  → certificate issued (packages/certificates; courseCertificateIssue schema.ts:850)
  → compliance: deadlines/renewals tracked (course/compliance.ts; internal/*)
```

**D. Public API automation (integration)**
```
Org → create automation key with scopes (organization/automation.ts; organizationApiKey)
  → external client: GET/POST /public-api/v1/courses
        [automationKeyMiddleware + automationKeyScopesMiddleware('public_api:*')]
  → service resolves orgId from key → returns course data (v1/courses.ts; services/v1)
```

**E. Cloud upgrade / buy AI tokens (cloud only)**
```
Upgrade or Buy tokens (api/polar/subscribe | buy-tokens)
  → Polar checkout
  → Polar webhook (api/polar/webhook/+server.ts)
        · subscription.created → createOrgPlan
        · order.paid (token_pack) → recordPurchase → aiCreditBalance
```

---

## 7. Open Questions & Gaps

1. **Outbound webhooks — doc vs code mismatch.** `README.md:42–43` advertises
   "REST API + Webhooks … receive events (`certificate.issued`, `enrollment.completed`)",
   but the only webhook code is **inbound Polar billing**
   (`apps/dashboard/src/routes/api/polar/webhook`) and `prd/webhooks` is **todo**
   (`PRD-TRACKER.md:24`). No outbound event‑emission/delivery system was found in
   `apps/api/src` or `packages/db/src`. **Code wins: outbound webhooks appear unimplemented.**
   QA should not test event delivery as a shipped feature. ⚠️
2. **SCORM support** — README does not promise it, but `prd/scorm-support` is **todo**
   (`PRD-TRACKER.md:16`). No SCORM code located. ⚠️ Treat as not shipped.
3. **In‑app notification system** — `prd/notification-system` is **todo**
   (`PRD-TRACKER.md:9`). Transactional *email* exists (§3.28); in‑app notifications appear
   unbuilt. Verify before demoing. ⚠️
4. **Selective exercise assignment** — `prd/selective-exercise-assignment` is **todo**
   (`PRD-TRACKER.md:15`). Assigning specific exercises to specific students may not exist;
   confirm against `exercise.ts` behavior. ⚠️
5. **Course templates / cohorts / import variants** — `prd/course-templates`,
   `prd/course-cohorts`, `prd/course-import` are **todo** (`PRD-TRACKER.md:10,12,13`),
   yet related schema exists (`exerciseTemplate` `schema.ts:2401`; `courseImportDraft`
   `schema.ts:2603`; cohorts are DONE). Scope of what's actually wired end‑to‑end vs.
   schema‑only should be verified per feature before writing test cases. ⚠️
6. **Anthropic in AI picker** — code supports Anthropic, but it is "not currently in the
   picker UI" (`README.md:231`, `.env.example:112`). The picker exposes Gemini + GPT‑4o;
   note the `.env.example:111` "Gemini 3 Flash" vs `README.md:228` "Gemini 2.5 Flash"
   wording inconsistency — verify the actual model id in `packages/utils/src/agent-models`.
7. **Two operating sub‑modes within self‑host** (single‑org bootstrap vs. licensed
   Enterprise) interact with `signupGuard` and `requireLicense`. Exact UX when
   `LICENSE_KEY` is absent on self‑host (SSO/token‑auth hidden vs. 403) should be confirmed
   in the dashboard `license` feature before recording a self‑host SSO demo.
8. **Tenant‑router / domain routing** (`apps/tenant-router`, `/domain`) was inventoried but
   not deeply traced (infra scope). Custom‑domain happy‑path is PRD‑DONE; failure/SSL
   provisioning states are unverified here.

---

## Appendix — Supporting Infrastructure (light)

These exist in source but are infra/dev tooling rather than demoable product features:

- `apps/jobs` — BullMQ worker process; consumes media/email queues
  (paired with `apps/api/src/routes/jobs`, `mediaJob`/`jobStep` tables). Dev queue UI at
  `/admin/queues` (`apps/api/src/routes/admin/queues.ts`).
- `apps/tenant-router` — multi‑tenant/custom‑domain request routing (backs §3.20).
- `apps/course-app` / `packages/course-app` — course‑app runtime modules
  (`pnpm-workspace.yaml:4`).
- `apps/docs` — documentation site (`pnpm docs:dev`).
- `apps/website` — marketing site (`pnpm website:dev`).
- `packages/core` — shared config incl. env access (`packages/core/src/config/env.ts`,
  used by `signup-guard.ts`, `license.ts`, `onboarding.ts`).
- `packages/storybook` — UI component stories (`pnpm storybook:dev`).
- `packages/analytics` — analytics helpers (paired with `apps/api/src/services/analytics`).
- `packages/tsconfig` — shared TS config.
- `packages/ui` — shared Svelte component library (`@cio/ui`); theme classes require `ui:`
  prefix in dashboard (`AGENTS.md:313`).
- `packages/utils` — shared Zod validation, plans, license, agent‑models, constants.
- `packages/db` — Drizzle schema/queries/migrations/seed; `pnpm --filter @cio/db db:setup:seed`
  seeds demo data and the demo login `admin@test.com` / `123456` (`README.md:215–219`).

---

### How this audit was verified
Every section traces to files read during the audit: `README.md`, `ARCHITECHTURE.md`,
`AGENTS.md`, `.env.example`, `PRD-TRACKER.md`, `apps/api/src/app.ts`,
`packages/db/src/schema.ts`, the role/RBAC middlewares, `signup-guard.ts`,
`onboarding.ts`, `appSetup.ts`, the Polar webhook, the v1 public‑API router, and the
license constants/middleware. No application was run and no tests were executed —
functional testing is deferred to the QA phase per the audit brief.
