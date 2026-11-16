# Onboarding PRD

## Status
- Draft. Prototyped in `prototypes/onboarding-flow/` (round 2), tracked for build in [#1340](https://github.com/classroomio/classroomio/issues/1340).

## Date
- November 16, 2026

## Supersedes
This PRD merges two earlier drafts, which are removed in the same change:
- `onboarding-ai-bootstrap` (February 19, 2026): website URL, AI-generated starter courses, brand detection.
- `onboarding-platform-showcase` (May 20, 2026): theme picker, goal-matched demo courses.

The two overlapped and disagreed on how many courses to create. The merged flow resolves that in § Decisions needed.

## Purpose
A new creator should reach a branded, populated academy and a first course of their own in one sitting, not an empty workspace. The flow:
1. Learns what the creator wants to achieve and what they sell.
2. Drafts starter courses from that, so the workspace is never empty.
3. Lets the creator pick a look for the academy, with the real landing page as the preview.
4. Ends on an AI builder where the creator generates a first course of their own and sees it land in their Courses dashboard.

## Problem Statement
Onboarding used to collect profile and organization details and then drop the user on an empty `/courses` page. New users:
- have no reference for what a good course looks like,
- never see the landing page themes (they live in Settings, so they must find them),
- must define course structure, branding and first actions by hand,
- see no evidence the platform can do more than list courses.

The result is a high time to first value and low activation. Creators who already have product content on a website are the most likely to churn here, because the content exists and the product still makes them start from nothing.

## ICP (Primary)
1. SaaS founders launching a product academy.
2. Customer-success and enablement teams running customer education.
3. Operations leaders running employee and compliance training (hospital, hotel, restaurant).
4. Independent creators selling self-paced courses or cohorts.

## Target Jobs-To-Be-Done
1. Turn existing website or product content into structured training quickly.
2. Launch a branded learning experience without setting everything up from scratch.
3. See what a good course looks like on the platform without building one first.
4. Reach a publishable state in a single session.

## The journey
Six segments in the progress bar. The preparation screen is not counted.

| # | Step | What the user does | Result |
| --- | --- | --- | --- |
| 1 | Create account | Name, work email, password, or Google | Account |
| 2 | Verify email | Enters or follows the verification link | Verified |
| 3 | Your business | First outcome, website or description, role and company size, how customers learn today, optional "how did you hear about us" | Answers; six-block workspace stack fills in beside the form |
| 4 | Hi, {name} | Full name, organization name, academy subdomain | Organization and address |
| - | Preparation | Waits while starter courses, a path and the workspace are drafted | Drafted starter content (not a counted step) |
| 5 | Customise | Picks a theme, name, logo and colour on the real landing page | Branding saved |
| 6 | Build your first course | Watches the welcome video, then chats with the AI to build a course | A draft course on the Courses dashboard |
| - | Courses and tour | Clicks Publish, lands on Courses, takes the product tour | Onboarding complete |

Steps 1 to 3 stay as designed in the prototype. Steps 4 to 6 are specified below.

## Goals
1. Capture what the creator offers during onboarding, from a website or a short description.
2. Create starter courses so the workspace is populated the moment onboarding ends.
3. Show the creator their own academy in the real landing page theme before they commit to it.
4. Let the creator generate a first course of their own with AI, from a prompt or a document.
5. Never leave the user stranded: every AI or seeding failure has a way to continue.

## Non-Goals (v1)
- Autonomous publishing. Generated and seeded courses stay drafts until the creator publishes.
- Deep multi-domain crawling or migrating full docs.
- Custom theme editing inside onboarding beyond name, logo and brand colour. The full editor stays in landing page settings.
- Multi-language starter content. v1 content is English; the locale choice affects UI chrome only.
- Replacing long-form import providers (Teachable, Thinkific, SCORM, CSV).

## Decisions needed
These were the open conflicts between the two source drafts. The prototype shows one proposal for each; none is confirmed.

1. **How many starter courses, and where do they come from?** Bootstrap said generate exactly two from the website. Showcase said seed two curated demo courses matched to the goal. Running both gives four with no stated relationship.
   - *Prototype proposal:* four starter courses and one path. Three are drafted from the user's business, and the first outcome can swap in one or two goal-matched curated courses, badged "Matched to your goal". When the user skips the website question, the generic curated set is used.
   - *Needs:* a product decision on the count, and on whether curated and generated courses can coexist.
2. **Do starter courses and the step 6 AI builder stack?** The builder creates a course of its own after the starter courses exist. Decide whether it adds to them or replaces them.
3. **Is the AI builder counted in the progress bar and skippable by default?** The prototype shows it as segment 6 of 6, with Skip to my courses.
4. **What drives the curated set?** The showcase draft keyed its set on goals (`sell-online`, `teach-online`, `employees`, `customers`, `expanding-platform`). The shipped questionnaire no longer has goals: #908 dropped the sell and teach goals, and #1216 then rebuilt it as a multi-select `useCases` question (`customer-training`, `customer-certification`, `partner-training`, `team-training`, `sell-courses`, `other`). The prototype asks a single first outcome (onboard, understand, adoption, deflect) that has no production counterpart yet. The curated set must be keyed to whichever the product decides is the source of truth.

## Current Baseline (As-Is)
The shipped onboarding is `org-setup` followed by five question steps (`ONBOARDING_STEPS` in `features/onboarding/utils/constants.ts`). It has no theme step, no website input and no course seeding. The org is created with the default landing page theme, and the user lands on the Courses page with no courses.

Theme data today:
- Eleven landing page themes ship. **Only Quartz is free** (`FREE_LANDING_PAGE_THEMES = ['quartz']`); the API rejects any other theme on the basic plan.
- Preview images are served from `assets.cdn.clsrio.com/templates/{theme}.png`, the same source the settings theme picker uses.
- Org brand colour is `organization.theme` (a named value or a custom hex). Dark or light mode is a per-user UI preference, not onboarding data.

## Functional Requirements

### FR-1 Website input and safety
- Collect a website URL or a free-text description. Both are optional; skipping both falls back to the generic starter set.
- Validate and normalize the URL, reject reserved TLDs, and allow HTTP and HTTPS public domains only.
- Block SSRF and local-network targets. Enforce limits on page count, timeout and response size.
- Strip scripts and unsafe HTML before any page text reaches a model.

### FR-2 Brand extraction
- Derive the brand colour with this fallback order: explicit CSS or theme token, `<meta name="theme-color">`, dominant logo or favicon colour, then the default blue.
- Check contrast; if the colour is unsafe, adjust it and flag it in the preview.
- Suggest a logo from the site. The creator confirms or replaces it on the Customise step.

### FR-3 Starter course generation
- Generate starter courses from the business context as schema-validated JSON only. Include source traceability (which pages shaped which course).
- Every generated course is a draft. Nothing is published.
- The count and the curated fallback follow the decision in § Decisions needed.
- A curated demo set exists as a static constant in `@cio/db` for the skip path and for self-hosted instances with no model configured. No external calls are needed to seed it.
- "Skip AI" remains available and continues with the generic set.

### FR-4 Review and edit
- Starter content is editable from Customise (Starter content: rename or remove courses and the path) before the creator moves on.
- Changing any answer in step 3 and continuing re-runs preparation. Returning to step 3 and continuing unchanged keeps what the user removed.

### FR-5 Creating and seeding courses
- Use the existing course service layer. Create each course with a default section, lessons, notes and exercise stubs inside one transaction.
- Seeded courses are `isPublished: false` and `isTemplate: false`.
- **Idempotent:** a retried or double-submitted request must not create duplicate courses.
- **Failure never strands the user.** Seeding has a five-second timeout. On timeout or error, log a structured warning, return success with no seeded course ids, and let the user continue to an empty but working workspace. One retry or "Continue without them" is offered. No background retry in v1.

### FR-6 Workspace step ("Hi, {name}")
A split screen. The form is on the left, and the right panel is the same pale blue panel as steps 1 and 2 with a "Trusted by teams at" wall.

**Greeting.** A large monospace `Hi, {{ name }}` with a blinking caret. The placeholder is replaced by what the user types and returns if the field is emptied. The typed name is never rendered as HTML.

**Fields.**

| Field | Rules | Errors |
| --- | --- | --- |
| Full name | Required, at least 5 characters | Prototype copy: `Name required`; `Enter your full name (at least 5 characters).` Production shows its translated Zod message |
| Organization name | At least 5 characters, no leading or trailing hyphen. Prefilled from the website or business name when known | `Organization must contain 5 or more characters`; `Organization name cannot start or end with a hyphen` |
| Academy subdomain | Fixed `.classroomio.com` suffix. At least 5 characters, no leading or trailing hyphen, not reserved or taken. Follows the organization name until edited by hand | `Academy subdomain must contain 5 or more characters`; `Academy subdomain cannot start or end with a hyphen`; `Sitename already exists.` |

- The reserved list is `blockedSubdomain` in `packages/utils/src/constants/org.ts`: academy, app, apps, blog, build, campaign, church, cloud, community, conference, course, courses, demo, dev, embed, embeds, forum, group, groups, help, launch, launchweek, mobile, play, prod, production, schools, stage, staging, support, teacher, teachers, tech, training. `www`, `mail`, `api` and `admin` are not blocked today; add them if wanted.
- Availability feedback is announced to screen readers (`aria-live="polite"`): "Checking availability", then "Subdomain available" or the error.
- Today the check is client-side against the blocked list, and a taken name is only caught on submit (a 409 `SITENAME_EXISTS`). The prototype's live availability check needs a real, debounced endpoint that uses the same reserved list, and the name must still be re-checked on submit because it can be taken between the check and the click.
- Continue creates the organization and starts preparation. Back keeps every answer.
- Real customer logos on the right panel need permission. Without approved logos, remove the wall rather than ship placeholders.

### FR-7 Customise: themes and brand
- The preview is the real landing page for the applied theme, rendered read-only, and it re-renders as the name, logo and colour change. A theme the user is only previewing shows its stock preview image, labelled as such.
- A docked strip lists all eleven themes. Each tile shows Free or Premium. Preview is always allowed; a locked tile opens the upgrade prompt, and the API enforces the plan gate regardless of the UI.
- A floating pill holds the workspace name, logo, five colour presets and a custom colour (HEX or RGB).
- Persistence: write the chosen theme with a field-level patch so hero copy, navigation and footer are untouched. The endpoint is owner-only and idempotent.
- The default theme applies at organization creation, so a user who leaves before this step still has a working landing page.

### FR-8 AI course builder (step 6)
After Customise and before the dashboard, a two-column step: the AI chat on the left, the org's Courses dashboard on the right. This is the first time a new user sees what the product does.

**Welcome video.**
- A "Welcome to ClassroomIO" card opens over the preview and starts playing, muted. If the browser still blocks sound after the user has interacted, show a **Turn on sound** control.
- Captions are on by default. When the video ends, the card shrinks to the bottom-right corner and stays until closed. The card header has **Move to the corner** (also Escape or clicking the backdrop) and **Close**. **Watch intro** reopens it. With reduced motion, the move is instant.
- Load the video from `youtube-nocookie.com`, or host it ourselves. A cookie-banner rule may apply.

**Chat.** It mirrors the dashboard AI assistant so users learn one UI.
- Header: sparkle icon, "Assistant", the course title as a subtitle once a course exists, **New chat** and **Chat history**.
- Empty state: a suggested starter prompt with "Use this prompt", and quick-action chips (upload a document to create a course, draft a lesson, generate questions, summarize a lesson, help me publish).
- Starter prompts use the organization name: new customer onboarding, product training for support, feature adoption mini-course, compliance certification.
- Composer: Enter sends and Shift+Enter adds a line. Attach accepts PDF, DOCX, PPTX and ODT, up to 5 MB, and the dashboard assistant offers it on paid plans only, so onboarding needs a decision for free accounts. `@` mentions list the course's lessons, exercises and sections once a course exists. A model picker shows the dashboard's models and locks the paid ones for free accounts (Gemini 3.1 Flash Lite and Kimi K2.6 are free; GPT-5.4 Mini and Claude Sonnet 4.6 are paid). **Stop** replaces the picker while a response runs.

**Build sequence.** A rotating status line, a "Building your course" checklist (`outline.md`, `lessons/`, `checks/`) with a live "n of 3 steps complete" counter, then a closing message and two suggestion cards (connect your content, add features). Suggestions fill the composer; they do not send.

**Right panel.** The org Courses dashboard with the new course listed as Unpublished, under the address `app.classroomio.com/org/{site}/courses`. It is read-only inside the step: clicks do nothing, and the tour and welcome modal do not appear there.

**Publish.** The Publish button is enabled once a course exists. A coach tip points at it. Clicking it publishes the course, shows a confirmation toast and goes straight to the Courses page, which starts the product tour. There is no confirm dialog. **Skip to my courses** finishes onboarding without publishing, and the course stays a draft.

**Real build requirements.**
- Generation runs through the dashboard assistant's backend with schema-validated output and a visible failure state with retry.
- Stream the status line, the reasoning rows and the checklist. Each row maps to a real step.
- A locked model opens the upgrade prompt, not only a toast.
- An uploaded document is parsed server-side and used as the source. Define limits (file size, page count, formats) and show an error when they are exceeded.
- The new course is saved as an unpublished draft and goes through the normal publish flow.
- The user can leave at any time (Back, Skip) without losing the conversation or the draft, and can resume.

### FR-9 Persona routing
- Respect an explicit onboarding path over an inferred one. Paths: SaaS academy, customer enablement, compliance training.
- Without an explicit path, infer it from the website or description with a confidence score. If confidence is low, default to customer enablement and ask the user to confirm.
- Store the chosen path in onboarding metadata for later recommendations.
- Default course pairs per path:
  - **SaaS academy:** `Product Foundations`, `Advanced Workflows by Role`.
  - **Customer enablement:** `Customer Onboarding Essentials`, `Value Expansion and Advanced Features`.
  - **Compliance training:** `Mandatory Compliance Fundamentals`, `Role-Based SOP and Incident Handling`.

### FR-10 Setup suggestions
After the flow, a Next steps panel on the academy page lists, in order: make the page yours, review the starter courses, publish a course, share the academy link. The current step is open and the rest wait. Also suggest landing page headline copy, course tags, a publish checklist and first invites.

### FR-11 Observability
Track the funnel with additive events: onboarding started, each step viewed and completed, website analysis completed, starter courses generated or seeded (with count and latency), seeding failed, theme viewed and selected, welcome video opened, completed and closed, first prompt sent, starter prompt used, build completed, build failed, course published, step skipped. Also track time to first course created and time to first publish.

### FR-12 Self-host
- The curated set and the default theme work with no external service. Without a model key, the website analysis and AI builder are off and the flow uses the curated set.
- Whether self-hosted instances get the AI flow when they supply their own key is an open question below.

## Proposed API and service design

**Validation** (`packages/utils/src/validation/onboarding/`)
- `ZOnboardingSelectTheme`, using one shared theme list that the validator and the dashboard both import.
- `ZOnboardingBootstrapStart`, `ZOnboardingBootstrapStatusParam`, `ZOnboardingBootstrapApply`, `ZOnboardingBootstrapRegenerateCourse`.
- `ZOnboardingUpdateMetadata` keeps its shape. Only server behavior changes.

**Routes** (`apps/api/src/routes/onboarding/`)
- `POST /onboarding/select-theme`: auth, owner only.
- `POST /onboarding/update-metadata`: extended to seed starter courses (FR-5) and return the seeded course ids.
- `POST /onboarding/bootstrap/start`, `GET /onboarding/bootstrap/:jobId`, `POST /onboarding/bootstrap/:jobId/regenerate-course`, `POST /onboarding/bootstrap/:jobId/apply`.
- A subdomain availability endpoint for FR-6.

**Services** (`apps/api/src/services/`): `onboarding-bootstrap` for the async job, extraction and apply workflow; `onboarding/select-theme`; `onboarding/seed-demo-courses`.

**Queries** (`packages/db/src/queries/`): a field-level landing page theme patch; a transactional `createDemoCoursesForOrg`.

**Data** (`@cio/db`): a static curated set keyed as decided in § Decisions needed, typed so a new goal or outcome is a compile error.

**Dashboard** (`apps/dashboard/src/lib/features/onboarding/`): onboarding step constants and types, the API class, and one component per new step. Request types are inferred from the API, no types in `.svelte.ts` files, and all copy lives in `en.json`.

## Data Model Changes (Proposed)
- New table `onboarding_bootstrap_job`: `id`, `profileId`, `organizationId` (nullable until the org exists), `websiteUrl`, `status` (`PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELED`), `progressPercent`, `stage`, `extraction`, `blueprint`, `suggestions`, `error` (jsonb), timestamps.
- Profile metadata extension: `onboarding.appearanceMode`, `onboarding.websiteUrl`, `onboarding.bootstrapJobId`.
- Theme selection and starter courses reuse existing tables, so they need no schema change.

A migration is a single file per PR, and its `when` must be later than every migration on `main`.

## Security and quality constraints
1. No crawling of private IP ranges or localhost.
2. Strip scripts and unsafe HTML before page content reaches a model.
3. Cap token and page budgets to control cost.
4. Never auto-publish generated courses.
5. Keep source links for trust and editability.
6. The theme plan gate is enforced by the API. The UI gate is a convenience.

## Rollout
1. **Alpha:** internal, behind a feature flag.
2. **Partial cloud:** 10 to 25% of new signups, bucketed by user id hash.
3. **Default on cloud:** the legacy flow is deleted once there is no regression.
4. **Self-host:** ships with the next release. The AI parts stay off unless a model key is configured.

## Success Metrics
1. Onboarding completion rate improves by at least 15% relative.
2. "First course created in the first session" improves by at least 40% relative.
3. Median onboarding time stays under 8 minutes. The extra steps must not bloat the flow.
4. More than 60% of users keep at least one starter or generated course.
5. Track how many users who reach step 6 send a first prompt and how many skip it, so the target can be set after the first cohort.
6. Website analysis or seeding failures stay under 5%.

## Risks and Mitigations
1. **Low-quality or hallucinated outlines.** Schema-validated JSON, source-backed generation and a review step.
2. **Wrong brand colour.** A preview, manual override and a contrast guard.
3. **Stuck or slow jobs.** An async job model with stage and progress, retries and cancellation.
4. **Duplicate courses on retry.** Idempotency keys and an apply-step check.
5. **Seeded content mistaken for real templates.** Drafts only, welcome copy says "feel free to edit or delete", and a "Sample" badge is a v1.1 candidate.
6. **Seeded content goes stale.** The curated set lives in code, is reviewed each release, and is owned by the content team.
7. **A premium theme leaks onto the free plan.** The API rejects any non-free theme on the basic plan.
8. **Video cookies and the cookie banner.** Use `youtube-nocookie.com` or host the video.
9. **Choosing a theme gets overwritten by the default.** The org still starts on the default theme, and the select-theme patch runs after it and changes only the theme field.

## Open Questions
1. Do starter courses and the builder's course stack, or does the builder replace them? (See § Decisions needed.)
2. Which models are free in onboarding, and what is the generation limit for a new account?
3. Should appearance (light, dark, system) be user-only or an org default?
4. Should self-hosted instances get the AI flow if they supply their own key?
5. Which model and provider power generation in v1, and what is the per-user cost budget?
6. Should the welcome popup link straight into one starter course?
7. Should users on a non-English locale see a banner that sample courses are in English?
8. Does the Apply step create both courses, or can the user choose one?

## States still to design
- Generation failure or timeout, with retry and "continue without a course".
- Rate limit or credit exhaustion on the free plan.
- A rejected, oversized or unreadable document.
- The welcome video failing to load.
- Mobile layout for the builder (chat first, with the preview behind a toggle?).
- Keyboard and screen-reader behavior of the video card, the model menu, the mention list and the status line. The video card should move focus when it opens and return it when it closes.

## Acceptance criteria
- [ ] Steps run in the order of the journey table, and Back never loses an answer.
- [ ] The workspace step greets the user by name as they type, falls back to the `{{ name }}` placeholder, applies the production name and subdomain rules, and checks availability against a real endpoint.
- [ ] The Customise preview is the real landing page and updates live with name, logo and colour; a locked theme cannot be applied without upgrading.
- [ ] Starter courses are created as unpublished drafts, never duplicated on retry, and a seeding failure still lets the user finish onboarding.
- [ ] After Customise, the welcome video plays with captions, docks when it ends, and can be reopened and closed. Sound works, or a "Turn on sound" control shows.
- [ ] The builder supports starter prompts, free text, document upload, `@` mentions, the model picker with locked models, Stop, New chat and History.
- [ ] A first course is generated for real, shown on the Courses dashboard as a draft, and published from the Publish button with no extra dialog.
- [ ] Generation failure, rate limit, a bad document and a video failure each show a clear message and a way to continue.
- [ ] The flow works on mobile and with the keyboard and screen readers, and respects reduced motion.
- [ ] The analytics events in FR-11 fire.

## Verification Plan
1. **Build:** `pnpm --filter @cio/db build && pnpm --filter @cio/api build && pnpm --filter @cio/dashboard build`.
2. **Manual end to end, with a fresh user each run:** sign up, answer the business questions, set the name and subdomain, confirm the starter courses appear as drafts, pick a theme and check the public page and Settings agree, build a course in step 6, publish, and confirm the Courses page.
3. **Outcome coverage:** run once per value of whichever question keys the curated set (see Decisions needed).
4. **Idempotency:** replay the metadata request and confirm no duplicate courses.
5. **Failure path:** force the seed to throw and confirm the user still finishes onboarding and the failure is logged.
6. **Theme override:** change the theme several times and confirm the last choice wins and that a non-free theme is rejected on the free plan.
7. **Subdomain:** confirm a reserved name and a taken name show the right error, and that a race between check and submit is caught.

## Prototype
`prototypes/onboarding-flow/`. Run `cd prototypes/onboarding-flow && python3 serve.py 8899` and open `http://localhost:8899/flow.html`. The prototype README lists what is real and what is simulated: no website is fetched, no model is called and no course is saved beyond local state.
