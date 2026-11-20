# Onboarding PRD

## Status
- Draft. Prototyped in `prototypes/onboarding-flow/` (round 2). Build is tracked in [#1340](https://github.com/classroomio/classroomio/issues/1340).

## Date
- November 16, 2026

## Sources merged here
This PRD is the single spec for the new onboarding. It merges:
1. `onboarding-ai-bootstrap` (February 19, 2026): website URL, AI-generated starter courses, brand detection.
2. `onboarding-platform-showcase` (May 20, 2026): theme picker, pre-loaded sample courses.
3. Issue #1340, which already combined those two and added the account, workspace, builder, tour and owner edit bar steps.
4. The prototype changes made on November 16, 2026, marked **(changed)** below where they differ from the issue as written.

The two source PRDs are removed in the same change.

## Purpose
Replace the current six-step onboarding (an organization step, then five short questions) with a guided setup. A new user creates a branded academy with four draft courses made from their website, then builds a first course with an AI assistant. They finish on a dashboard that already has courses in it.

## Problem Statement
Onboarding collects profile and organization details, then drops the user on an org dashboard with no courses (a welcome dialog offers to create one). New users:
- have no reference for what a good course looks like,
- never see the landing page themes, which live in Settings,
- must define course structure, branding and first actions by hand,
- see no evidence the platform does more than list courses.

The result is a high time to first value and low activation. Creators who already have content on a website are the likeliest to leave, because the content exists and the product still makes them start from nothing.

## ICP (Primary)
1. SaaS founders launching a product academy.
2. Customer-success and enablement teams running customer education.
3. Operations teams running employee and compliance training (hospital, hotel, restaurant).
4. Independent creators selling self-paced courses.

## Target Jobs-To-Be-Done
1. Turn existing website or product content into structured training quickly.
2. Launch a branded learning experience without setting everything up from scratch.
3. See what a good course looks like without building one first.
4. Reach a publishable state in a single session.

## Goals
1. Capture what the creator offers during onboarding, from a website or a short description.
2. Create starter courses so the workspace is populated when onboarding ends.
3. Show the creator their own academy in the real landing page theme before they commit.
4. Let the creator generate a first course of their own with AI, from a prompt or a document.
5. **The AI course generation must be real, not simulated.**
6. Never strand the user: every AI or seeding failure has a way to continue.

## Non-Goals (v1)
- Autonomous publishing. Generated and starter courses stay drafts until the creator publishes.
- Deep multi-domain crawling or migrating full docs.
- Custom theme editing inside onboarding beyond name, logo and brand colour. The full editor stays in landing page settings.
- Multi-language starter content. v1 content is English; locale affects UI chrome only.
- Replacing long-form import providers (Teachable, Thinkific, SCORM, CSV).

## User flow
1. Create account
2. Verify email
3. Your business
4. Hi, {name}: name, organization and subdomain
5. Customise academy (the "Generate starter courses" loading screen comes before it and is not a counted step)
6. Welcome video and AI course builder
7. Dashboard and guided tour

The progress bar has six segments: Account, Verify, Your business, Workspace, Customise, Build. The owner edit bar (section 8) is not part of onboarding. It belongs to the public academy and is here because the prototype includes it.

### 1. Create account
Two ways to sign up: Continue with Google, or full name, email and password with a checkbox to accept the terms. Create the user here. **Do not create an organization yet.**

**UI:**
- Two columns: the form on the left, a pale blue panel on the right.
- The right panel has a dotted background, a headline, a stack of lesson blocks and a testimonial card that changes by itself at set intervals and by the dots under it, ending with a line about open source, self-hosted and cloud.
- Do not show the PROTOTYPE badge in production.
- Use real testimonials with permission. With no approved quotes, remove the testimonials.

### 2. Verify email
- Ask the user to check their inbox. Send an email with a verification link.
- Check the status and move the user on automatically once verified.
- Show **Resend email** after 2 minutes. Until then show a countdown such as "Resend in 1:45".
- Let the user use a different email address. If the link has expired, say so and let them ask for a new one.
- Remove the prototype-only "Simulate clicking the link" button.

### 3. Your business
Five short questions in a numbered accordion, 01 to 05.

| # | Title | What we ask |
| --- | --- | --- |
| 01 | First outcome | What they want to achieve first with their academy |
| 02 | Your business | A website URL, or a short description of the business |
| 03 | Your team | Role and company size |
| 04 | How customers learn today | How their customers learn to use the product now |
| 05 | How did you hear about us? | Optional. If they pick an AI assistant, ask which one |

**Options:**
- First outcome: Onboard new customers, Understand the product, Drive adoption, Deflect support questions.
- Company size: Just me, 2-9 people, 10-50 people, 51-200 people, 200+ people.
- How customers learn today: They figure it out on their own; Live onboarding sessions or calls; Help docs and support; We don't have training yet.
- How they heard about us: Blog or article; AI assistant; Search engine; GitHub or open source; YouTube or podcast; Social media; Product Hunt or a review site; Friends, family, or a colleague; Other (tell us).
- AI assistants: ChatGPT, Claude, Gemini, Grok, Perplexity, Other (tell us).

**Question 02.** A toggle switches between "Website URL" and "Describe your business". The user must give one of the two to continue, or skip the analysis, which uses sample content. The website lets ClassroomIO read the site and make relevant starter courses; the description gives context when there is no website.

**Behavior:**
- Where possible, pick an answer instead of typing. First-outcome options are a 2x2 grid of numbered cards (selected is solid blue). Other options are pills (selected has a light blue fill and a blue border).
- The open question has a "NOW" tag and a blue outline. An answered question collapses and shows a check and the answer.
- Save answers as the user goes, so a refresh does not lose them.
- Continue is enabled when all required questions are answered. Question 05 is optional.
- No Back button on this step.

**Workspace stack (right side) (changed).** The issue described five blocks. It is now **six**, one per answer, plus the workspace:

| Block (top to bottom) | Source | Tone |
| --- | --- | --- |
| Today | Question 04 | Blue |
| Role | Question 03 | Soft blue |
| Team | Question 03 | Sand |
| First outcome | Question 01 | Soft blue |
| Your business | Question 02: the website, the description, or "Generic starter set" if skipped | Blue |
| Workspace | The organization name once known | Black |

- An unanswered block is dashed with a placeholder ("Choose a size"). An answered block takes its tone, so the stack mixes the brand colours in a fixed rhythm.
- A new block settles in place with a short fade and scale. It does not fall from above. Reduced motion shows no animation.
- The Your business block fills when its section folds, not on each keystroke.
- Show a counter: "YOUR WORKSPACE, N OF 6 BLOCKS".

### 4. Hi, {name}: name, organization and subdomain
A split screen. The form is on the left and a panel on the right.

**Headline.** A large monospace greeting reads `Hi, {{ user.name }}` with a blinking caret. The placeholder is replaced by the name as the user types, and returns if the field is emptied. **Never render the typed name as HTML.**

**Fields:**

| Field | Label | Rules |
| --- | --- | --- |
| Full name | "What's your full name?" | Required, at least 5 characters. A "Name required" hint shows until the user types. Prototype copy: `Name required`; `Enter your full name (at least 5 characters).` Production shows its translated Zod message |
| Organization | "What's the name of your organization?" | At least 5 characters, no leading or trailing hyphen. Errors: `Organization must contain 5 or more characters`; `Organization name cannot start or end with a hyphen`. Prefill from the website title or business name from step 3 |
| Academy subdomain | "Academy subdomain" | Fixed `.classroomio.com` ending and the hint "Letters and numbers only" |

**Subdomain behavior:**
- It follows the organization name as the user types: lower-cased, spaces become hyphens, anything that is not a letter, number or hyphen is removed. Once edited by hand, it stops following.
- Rules and messages: `Academy subdomain must contain 5 or more characters`; `Academy subdomain cannot start or end with a hyphen`; `Sitename already exists.` for a reserved name; `Site name '{name}' already exists` for a taken one.
- The reserved list is `blockedSubdomain` in `packages/utils/src/constants/org.ts`: academy, app, apps, blog, build, campaign, church, cloud, community, conference, course, courses, demo, dev, embed, embeds, forum, group, groups, help, launch, launchweek, mobile, play, prod, production, schools, stage, staging, support, teacher, teachers, tech, training. **The issue also listed `www`, `mail`, `api` and `admin`, which the code does not block today. Add them** (see Decisions).
- Show the result under the field with `aria-live="polite"`. While checking, show a spinner and "Checking availability", then a green "Subdomain available" or a red error.
- **Today the check is client-side against the blocked list, and a taken name is only caught on submit (409 `SITENAME_EXISTS`).** The live check needs a real endpoint with a short delay between keystrokes and the same reserved list, and the server must check again on submit. The prototype waits 550 ms to simulate this.

**Buttons.** **Continue** (full width, primary): Enter in any field also continues, all three fields are checked, each error shows under its field and focus moves to the first invalid one. **Back** returns to step 3 and keeps every answer. Continue creates the organization and starts the AI course-generation job.

**Right panel.** The label "Almost there", the headline "Your academy, named and live in minutes." ("named" highlighted), the line "Pick the name and address your customers will see. You can change both later in settings.", the training-line illustration, and "Trusted by teams at" with a wall of company names. The prototype uses made-up names. In production, use real customer logos with permission, or remove the wall.

### Loading screen: generate starter courses
After the workspace is created, show a full-screen gradient panel with a checklist. It is not a counted step, and the progress bar is not shown.

Checklist: Understanding your product; Preparing your customer education content; Organising your starter learning path; Setting up your workspace. Each is done (check), in progress (dashed spinner) or waiting (empty circle), with a short monospace label. On the right, the course cards appear one by one and cards further back fade out. The prototype also drafts a starter path and shows it as a block.

**Requirements:**
- Read the user's public website and generate the courses with an AI model. Show each course as soon as it exists.
- If the site cannot be read or analysis fails, show a clear message and let the user continue with sample courses.
- **Continue must be available within 60 seconds, whether generation works or fails.**
- With no website, or if the user skips analysis, use sample content without reading a site.
- On self-hosted installs without a model key, turn off the AI steps and use sample courses.
- Remove the prototype-only "SIMULATED" footer.

**Courses.** Every user gets the same four: Getting Started with {Product}; Core Workflows, Step by Step; Collaborating with Your Team; Getting Help and Next Steps. Each has three sections of three lessons. The model returns schema-validated JSON, and source URLs are stored with the generated content.

### 5. Customise academy
A live preview of the user's academy, a floating pill over it, and a strip of themes below.

**Top bar:** the logo, the step counter, the progress bar and "CUSTOMISE" in blue; the selected theme's name and whether it is Free or Premium; **Starter content**; **Back** (to step 4, nothing lost); **Skip to academy** (applies defaults, creates the four draft courses, opens the academy); **Continue** (saves name, theme and brand colour, creates the four courses as unpublished drafts and opens the builder, not the courses page).

**Live preview (changed).** The preview is the **real landing page** for the applied theme, the same components the public academy renders, shown read-only (not clickable) in a browser-style frame at `https://{slug}.classroomio.com`. It shows what a visitor sees: navigation with a sign-in button, a hero with the academy name, course filters and search, and a course grid. It updates as the user changes the name, logo, brand colour or theme.
- A theme the user is only **previewing** (not applied) shows its stock image with the note "Stock preview image, not your content" and a **Back to {theme}** button.
- The prototype's earlier hand-drawn copy of Quartz, which had a clickable "Powered by ClassroomIO" upgrade link, is removed. Inside the read-only preview, that link is not clickable.

**Floating pill:**
- Academy name: the logo or initials, the editable name, a pencil.
- Brand colour: five presets (Blue, Rose, Green, Orange, Purple) and **Custom** (HEX or RGB). Blue is the default.
- **Reset** brings back the brand colour found on the user's website.
- Start from the brand colour found during analysis when there is one. Save it to `organization.theme` when the customisation is applied. Brand colour detection falls back in this order: an explicit CSS or theme token, `<meta name="theme-color">`, the dominant logo or favicon colour, then the default blue. Check contrast and adjust an unsafe colour, flagging it in the preview.

**Themes.** A row of cards below the preview that scrolls sideways, each with a thumbnail, name, preview icon and a Free or Premium tag.
- There are 11 themes. **Quartz is free** and is the default. The other ten are premium: Minimal, Bold, Classic, SaaS, Tech, Studio, Corporate, Terminal, Editorial and Vibrant.
- **A paid theme cannot be used until the organization pays for it.** A free-plan user can preview a premium theme but cannot apply it, save it, or leave onboarding with it. Choosing one opens an upgrade prompt that lists the plans and a **Preview {theme} first** button. Quartz stays applied until the organization upgrades. **Continue** and **Skip to academy** never save a premium theme on a free plan.
- **Premium access is enforced on the server, not only in the UI.** The API rejects a non-free theme on the basic plan (403 `UPGRADE_REQUIRED`). The tag and the prompt are only hints, and a request that skips the UI gets the same rejection.
- Preview images come from `assets.cdn.clsrio.com/templates/{theme}.png`, the same source the settings picker uses.
- Persist the theme with a field-level update so hero copy, navigation and footer are untouched. The endpoint is owner-only and idempotent. The default theme applies at organization creation, so a user who leaves early still has a working landing page.

**Starter content dialog.** Shows the starter courses and the starter path. The user can rename or remove any of them (everything stays a draft), press **Regenerate** for a new set (in production this calls the real model) and press **Done**.

### 6. Welcome video and AI course builder
After Customise and before the dashboard. It shows a new user what the product does: a short video, then a chat that builds a first course while they watch.

**Layout.** A top bar, then two columns: the AI chat on the left, and on the right, **the org's Courses dashboard (changed)**. The issue had the right panel show the new course's public page. The user now sees the dashboard they will land on, with the new course listed as Unpublished, at the address `app.classroomio.com/org/{site}/courses`. The panel is read-only inside this step: clicks do nothing, and the guided tour and welcome dialog do not appear in it.

**Top bar:** the logo, the progress bar fully filled and labelled "Build", **Back** (to Customise) and **Skip to my courses** (finishes onboarding and opens Courses).

#### 6a. Welcome video
- On arrival, a card titled "Welcome to ClassroomIO" opens in the middle of the preview over a dimmed backdrop and starts playing. The prototype loads a YouTube video from `youtube-nocookie.com` with captions on.
- Browsers only autoplay muted video, so it starts muted. If the user has already clicked or pressed a key, sound is turned on after it starts. If the browser still blocks it, a **Turn on sound** button shows in the card header.
- When the video ends the card shrinks to the bottom-right corner and stays until closed. The header has **Move to the corner** (Escape or a click on the backdrop does the same) and **Close**, which stops the video and removes the card.
- **Watch intro** in the preview bar reopens it from the start. With reduced motion, the move to the corner is instant.
- A YouTube embed sets third-party cookies. Use `youtube-nocookie.com` or host the video, and check the cookie-banner rule.

#### 6b. AI chat
The chat copies the existing dashboard AI assistant so users learn one screen.

- **Header:** a sparkle icon, "Assistant", the course title as a subtitle once a course exists, **New chat** (off while empty or working) and **Chat history** (a popover of this session's chats, or "No previous chats yet.").
- **Empty state:** "Ask me to help with your course content: draft lessons, generate questions, or plan a course from a document." Then a **Suggested for you** card with the first starter prompt and a "Use this prompt" button, and five chips: Upload a document to create a course, Draft a lesson, Generate questions from this lesson, Summarize this lesson, Help me publish this course.

**Starter prompts** (all use the organization name):

| Starter | Course it builds | Lessons |
| --- | --- | --- |
| Product training for support (default) | {Org} product training for support | 6 |
| New customer onboarding | Getting started with {Org} | 7 (a video, readings, an assignment, two quizzes) |
| Feature adoption mini-course | Get more from {Org} | 6 |
| Compliance certification | {Org} compliance training | 6 |

**Free text.** Text starting with build, create, make, turn, plan or "generate a course" builds a course titled from the text with a generic six-lesson outline. Other text sent before a course exists gets "There is no course in this workspace yet, so I have nothing to work on" with a button to build the suggested starter.

**Message box.**
- "Ask the AI assistant...". Enter sends and Shift+Enter adds a line.
- **Attach** accepts PDF, DOCX, PPTX and ODT, shown as a removable chip. Sending only a file asks to "Build a course from {file}". The dashboard assistant limits attachments to 5 MB and offers them on **paid plans only**. Onboarding keeps that rule: on a free plan the attach button opens the upgrade prompt.
- **@ mentions** list the course's lessons, exercises and sections once a course exists, filtered as the user types. Arrow keys move, Enter inserts, Escape closes. Before a course exists, `@` does nothing.
- **Model picker.** Kimi K2.6 and Gemini 3.1 Flash Lite are free. GPT-5.4 Mini and Claude Sonnet 4.6 are paid and locked for free accounts; choosing one opens the upgrade prompt.
- **Stop** replaces the picker while a reply runs and posts "Stopped. Nothing was changed. Send another message when you are ready."

**First build** (about 12 seconds in the prototype):
1. The message appears. A status line cycles through "Pondering the question", "Reading your brand settings", "Outlining the lessons", "Drafting lesson content", "Writing the quiz", "Hang tight, nearly there". The right panel shows a block loader.
2. The assistant says: "I'll use starter content so you can see it working. Connect your own material after."
3. Two collapsed rows: **Thought for 4 seconds** (why the course is shaped this way) and **Read workspace · 3 items** (brand colour, theme applied, number of starter courses).
4. A **Building your course** card with a checklist (`outline.md`, `lessons/`, `checks/`) and an "n of 3 steps complete" counter. Each row goes from a spinner to a check.
5. **(changed)** The right panel shows the Courses dashboard with the new course in the list.
6. A closing message names the course, gives the lesson count and says it has two sections and **that it is on the Courses dashboard now, next to the other courses**, ending with "Saving draft: Saved as a draft. Learners cannot see it until you publish."
7. Two suggestion cards: **Connect your content** (Connect a website, Connect Google Drive, Browse integrations) and **Add features** (Add a certificate on completion, Add a quiz after each lesson, Add a drip schedule). Clicking a suggestion fills the message box; it does not send.
8. **Publish** turns on and a tip points to it: "When you're ready, click Publish. Share the course with your learners and control who has access." with a **Got it** button.

**Follow-ups** (once a course exists): a certificate sets a 70% pass mark and downloadable certificates; a quiz adds a "Quick check" exercise to every section; a drip schedule edits the draft; "publish" points at the Publish button; questions, summaries and lesson drafts reply that they work on the open lesson; anything else is acknowledged with no change.

**Publish (changed).** The issue had a "Publish your academy" dialog with a **Who can enrol** select (Anyone with the link, Invited learners only), **Not yet** and **Publish**. **That dialog is removed.** Clicking **Publish** publishes the course straight away, shows a "Published" confirmation and opens the Courses page, which starts the guided tour. The choice of who can enrol is no longer asked here; it stays in the course's own settings. **Skip to my courses** does the same without publishing, and the course stays an unpublished draft.

**Production requirements:**
- Generate for real through the dashboard assistant's backend, with schema-validated output and a visible failure state with retry.
- Stream the status line, collapsed rows and checklist, each matching a real step.
- The model picker follows the plan, and a locked model opens the upgrade prompt.
- Parse an uploaded document on the server and use it as the source. Set limits (size, page count, formats) and show an error over them.
- Save the new course as an unpublished draft that appears on the Courses page. Publishing uses the same flow as the rest of the dashboard.
- Mentions list lessons from real course data.
- The user can leave at any time (Back, Skip) without losing the chat or the draft, and can come back.

**Simulated in the prototype:** no model is called. Answers, timings, outlines and lesson lists are scripted, the course is saved nowhere except local state, only the follow-ups above change the draft, and the video is a placeholder embed.

### 7. Dashboard and guided tour
After onboarding, open the Courses page with the four starter courses (and the builder's course) already there, when the user publishes from the builder or picks Skip to my courses.

- Use the existing production course card. Do not build a new one.
- Each card shows a unique banner image, a Self Paced tag, Unpublished and Sample labels, and lesson and student counts. The sample courses must not share one banner.
- A welcome dialog over the dimmed dashboard has **Later** and **Take the tour**.

**The tour has six steps.** Each is a popover with a step counter, **Skip tour**, **Next** and a blue outline. "Click" steps move on when the user clicks the highlighted item.

| # | Title | Text | Highlights |
| --- | --- | --- | --- |
| 1 | Explore your courses | Your starter courses live here. They stay as drafts until you publish them. | Course list |
| 2 | Open a course | Open the first course to see its lessons and edit them. (click) | First course card |
| 3 | Create another course | Start from a blank course or pick a template from the gallery. | Templates area |
| 4 | Design your landing page | Choose a theme, edit the sections and see the preview change as you type. (click) | Landing Page in the sidebar |
| 5 | Invite your learners | Add students and tutors, and see who has joined. (click) | Audience in the sidebar |
| 6 | Preview your academy | Open your academy to see what learners see. (click) | Your Academy |

The tour remembers which steps are done and resumes where the user left off. On a small screen the popover uses a compact layout.

### 8. Owner edit bar on the public academy
When an org owner views their own public academy, a floating pill at the bottom centre says "Viewing as owner" and links to the right dashboard screen. Learners and signed-out visitors never see it, and it is not in the page for them at all.

| Page | Links |
| --- | --- |
| Catalog (`/courses`) | **Edit courses** (primary, the dashboard Courses list) and **Edit page design** (the landing page editor) |
| Course (`/course/:id`) | **Edit landing page** (primary, the course Landing Page tab), **Edit lessons** and **Settings** |

- Decide on the server from the signed-in user's role in the current org.
- Dashboard links use the admin app host (`getAppBaseUrl()`), never the org's custom domain or subdomain.
- Add it once per public shell, not on every page.
- Out of scope: learning paths and editing inside the public page.
- Open: whether tutors and admins see it or only the owner; whether a custom domain needs a sign-in handoff; whether the bar can be hidden for a clean screenshot. Known gap: on a narrow window it slightly overlaps the "Powered by ClassroomIO" badge.

The full ticket is `TICKET-academy-owner-edit-bar.md`.

## Persona routing
Starter content follows an onboarding path.
- Respect an explicit path over an inferred one. Paths: SaaS academy, customer enablement, compliance training.
- Without an explicit path, infer it from the website or description with a confidence score. If confidence is low, default to customer enablement and ask the user to confirm. Store the choice in onboarding metadata for later suggestions.
- Default course pairs per path, as suggestions for content:
  - **SaaS academy:** Product Foundations; Advanced Workflows by Role.
  - **Customer enablement:** Customer Onboarding Essentials; Value Expansion and Advanced Features.
  - **Compliance training:** Mandatory Compliance Fundamentals; Role-Based SOP and Incident Handling.

## Shared UI and design requirements
Keep one look on every screen: a warm off-white background, blue primary buttons, small uppercase monospace text for labels and status, cards with a small tab notch at the top-left, and headlines with a soft blue highlight behind key words. Decide whether the card notch becomes a new card variant or is removed.

- Use `@cio/ui/base/card` for cards, the `ui:` prefix for tokens and `@cio/ui/custom/*-field` wrappers instead of native inputs and labels.
- Reuse production components, especially the course card.

### Progress bar
Six segments, with the count on the left and the current step on the right ("Step N of 6").
- Finished segments and the current step are filled: three at step 3, five at step 5, six at the builder.
- The bar does not change while the user answers the five questions in step 3. The block counter shows progress inside that step.
- No Back button on step 3. Back appears on steps 4, 5 and 6.
- Account creation and email verification are steps 1 and 2. Show the bar from the account screen on, but not on the loading screen.
- Finished segments are not clickable. Users go back only with Back.
- Use shared constants for step numbers, totals and labels, and update `ONBOARDING_STEPS` to cover all six steps. Restore the right progress after a refresh. Put all labels in `en.json`. Make the bar accessible to screen readers and respect reduced motion.

## Starter course seeding
- Use the existing course service layer. Create each course with a default section, lessons, notes and exercise stubs **inside one transaction**.
- Starter courses are `isPublished: false` and `isTemplate: false`.
- **Idempotent.** A retried or double-submitted request must not create duplicate courses (idempotency key, or skip when the org already has non-template courses).
- **Failure never strands the user.** Seeding has a five-second timeout. On timeout or error, log a structured warning, return success with no seeded course ids and let the user continue to an empty but working workspace, offering one retry or "Continue without them". No background retry in v1.
- A curated sample set ships as a static constant in `@cio/db` for the skip path and for self-hosted installs without a model key. It needs no external service.

## Proposed API and service design

**Validation** (`packages/utils/src/validation/onboarding/`): `ZOnboardingSelectTheme` (one shared theme list used by the validator and the dashboard); `ZOnboardingBootstrapStart`, `ZOnboardingBootstrapStatusParam`, `ZOnboardingBootstrapApply`, `ZOnboardingBootstrapRegenerateCourse`. `ZOnboardingUpdateMetadata` keeps its shape.

**Routes** (`apps/api/src/routes/onboarding/`): `POST /onboarding/select-theme` (auth, owner only); `POST /onboarding/update-metadata` (extended to seed starter courses and return the seeded ids); `POST /onboarding/bootstrap/start`, `GET /onboarding/bootstrap/:jobId`, `POST /onboarding/bootstrap/:jobId/regenerate-course`, `POST /onboarding/bootstrap/:jobId/apply`; and a debounced subdomain availability endpoint.

**Services** (`apps/api/src/services/`): `onboarding-bootstrap` (the async job, extraction, generation and apply), `onboarding/select-theme`, `onboarding/seed-demo-courses`. **Queries** (`packages/db/src/queries/`): a field-level landing page theme update and a transactional course creation helper.

**Dashboard** (`apps/dashboard/src/lib/features/onboarding/`): step constants and types, the API class and one component per new step. Types are inferred from the API and never defined in `.svelte.ts` files. All copy lives in `en.json`.

## Data Model Changes (Proposed)
- New table `onboarding_bootstrap_job`: `id`, `profileId`, `organizationId` (nullable until the org exists), `websiteUrl`, `status` (`PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELED`), `progressPercent`, `stage`, `extraction`, `blueprint`, `suggestions`, `error` (jsonb) and timestamps.
- Profile metadata: `onboarding.appearanceMode`, `onboarding.websiteUrl`, `onboarding.bootstrapJobId`.
- Theme selection and starter courses reuse existing tables.

A migration is one file per PR, and its `when` must be later than every migration on `main`.

## Security and quality constraints
1. Allow HTTP and HTTPS public domains only. Block private IP ranges, localhost and other SSRF targets.
2. Enforce limits on page count, timeout and response size when crawling.
3. Strip scripts and unsafe HTML before page content reaches a model.
4. Cap token and page budgets to control cost.
5. Never auto-publish generated courses. Keep source links for trust and editability.
6. Enforce premium themes on the server, not only in the UI.

## Error, loading and small-screen states
Design and build:
- **Invalid email**, and **invalid name, organization or subdomain** (the inline errors in step 4).
- **Subdomain unavailable**, saying whether it is taken or reserved.
- **Expired verification link**, with a way to get a new one.
- **Starter course generation fails**: retry or continue with sample courses.
- **Builder fails or times out**: retry, or continue without a course.
- **Builder rate limit or no credits on the free plan**: explain the limit and offer an upgrade or a way to continue.
- **Document rejected, too large or unreadable** in the builder.
- **Welcome video does not load** (blocked or offline): continue without it.
- **Loading** feedback when users click Continue or create the workspace.
- **Premium theme** and **locked AI model**: open the upgrade prompt.
- **No website**: design the screen for users who give none.
- **Small screens**: every screen and side panel works on mobile. The builder's two columns are not designed for mobile yet; decide whether mobile shows the chat first with the preview behind a toggle.
- **Accessibility**: keyboard and screen reader support for the accordion, option pills, colour swatches, the video card (move focus in when it opens and back when it closes), the model menu, the `@` list and the status line.

Every error and loading state must be clear, match the rest of ClassroomIO and give the user a way to keep going.

## Rollout
1. **Alpha:** internal, behind a feature flag.
2. **Partial cloud:** 10 to 25% of new signups, bucketed by user id hash.
3. **Default on cloud:** the legacy flow is deleted once there is no regression.
4. **Self-host:** ships with the next release. The AI parts stay off unless a model key is configured.

## Success metrics
- Raise onboarding completion by 25%.
- Keep median onboarding time under eight minutes. The builder adds a step, so check this again.
- Raise the share of users who create a first course in the same session by 40%.
- Keep website analysis failures under 5%.
- Track how many users who reach the builder send a first prompt and how many skip it, to set a target after the first cohort.

Before the rollout, confirm the baseline and how each metric is measured.

## Risks and Mitigations
1. **Low-quality or hallucinated outlines.** Schema-validated JSON, source-backed generation and a review step.
2. **Wrong brand colour.** A preview, manual override and a contrast guard.
3. **Stuck or slow jobs.** An async job model with stage and progress, retries and cancellation.
4. **Duplicate courses on retry.** Idempotency keys and an apply-step check.
5. **Sample courses mistaken for real templates.** Drafts only, welcome copy says to edit or delete, and a "Sample" label on the card.
6. **Sample content goes stale.** It lives in code, is reviewed each release and is owned by the content team.
7. **A premium theme reaches the free plan.** The API rejects any non-free theme on the basic plan.
8. **Video cookies.** Use `youtube-nocookie.com` or host the video.
9. **The default theme overwrites the user's choice.** The org starts on the default and the select-theme update runs after it, changing only the theme field.

## Decisions
**Made**
1. **The builder adds to the starter courses.** The builder's course is saved next to the four starter courses and never replaces them. Its default suggestion is "Product training for support", so it does not duplicate starter course 1, "Getting Started with {Product}". If a user asks for a course whose title matches an existing one, the builder says so and asks before creating it.
2. **Free accounts can use the builder, with limits.**
   - They can use the free models (Gemini 3.1 Flash Lite and Kimi K2.6). GPT-5.4 Mini and Claude Sonnet 4.6 stay locked and open the upgrade prompt.
   - Generations are capped. The cap is a cost decision, to be set before launch. At the cap, the rate-limit state offers an upgrade or a way to continue.
   - Document upload stays paid-only, as in the dashboard assistant. On a free plan the attach button opens the upgrade prompt.
3. **No key for the curated set in v1.** Every user gets the same four starter courses, so nothing needs to key the set. If variants are wanted later, key them on the first outcome. Replacing the shipped `useCases` question with the first-outcome question is a separate decision.
4. **Add `www`, `mail`, `api` and `admin` to the reserved subdomains.** The issue listed them, the code does not block them, and they read like infrastructure hostnames. Confirm which of them ClassroomIO uses before merging.
5. **Paid themes cannot be used until the organization pays.** See Customise.

**Still open**
- Is light, dark or system a user setting only, or an org default?
- Do self-hosted instances get the AI flow if they supply their own key, and which model and provider power generation, with what cost budget?
- Should non-English users see a banner that sample courses are in English?
- Should the welcome popup link straight into one starter course?
- What is the generation cap for free accounts in the builder?

## Where the prototype and this spec differ
- The prototype README proposes **four starter courses and one path**, with goal-matched swaps. This spec follows #1340: **the same four courses for every user**, plus the starter path.
- The prototype's default builder suggestion is still "New customer onboarding", which duplicates starter course 1. This spec makes "Product training for support" the default.
- The prototype's chat builder, welcome video, "Hi, {name}" step and owner edit bar come from #1340 and are simulated.

## Acceptance criteria

**Flow and progress**
- [ ] The full six-step flow works in production, from account creation to the AI course builder.
- [ ] Answers and progress are saved and restored after a refresh.
- [ ] The progress bar has six segments, shows the right step, is hidden on the loading screen, and Back appears only on steps 4, 5 and 6.
- [ ] Progress, animations and step labels support screen readers and respect reduced motion.

**Account and email**
- [ ] Users can sign up with Google, or with name, email and password.
- [ ] The verify screen moves on by itself, shows Resend after 2 minutes, lets the user change email and handles an expired link.

**Your business**
- [ ] The five questions work as described, and Continue turns on only when the required ones are answered.
- [ ] The user gives a website URL or a description, or skips the analysis.
- [ ] The workspace stack has six blocks, shows "N OF 6 BLOCKS", and its tones follow the table above.

**Name, organization and subdomain**
- [ ] The greeting shows the user's name as they type, and `{{ user.name }}` when empty.
- [ ] The fields follow the rules and show the exact errors above, and the subdomain follows the organization name until edited.
- [ ] Availability is checked with a real endpoint, using the same reserved list as the API, and checked again on submit.
- [ ] Continue creates the organization and starts course generation.

**Starter courses**
- [ ] Every new workspace gets the same four courses with three sections of three lessons, as unpublished drafts that are never duplicated on retry.
- [ ] Users can continue from the loading screen within 60 seconds, even if generation fails.
- [ ] With no website, or no model key on a self-hosted install, sample courses are used.

**Customise**
- [ ] The preview is the real landing page, read-only, and updates live with name, logo, colour and theme.
- [ ] A theme only being previewed shows its stock image and a Back button.
- [ ] Quartz is free and the other ten are premium. A free-plan user can preview a paid theme but cannot apply or save it until they pay, Continue and Skip to academy never save one, and the server rejects it even if the UI is bypassed.
- [ ] The Starter content dialog lets users rename, remove and regenerate courses.
- [ ] Continue creates unpublished drafts without duplicating existing courses and opens the builder. Skip to academy applies the defaults.

**Welcome video and builder**
- [ ] The welcome video opens and plays with captions, moves to the corner when it ends, and can be reopened, moved and closed. Sound works or a "Turn on sound" button shows.
- [ ] The chat supports starter prompts, free text, document upload, `@` mentions, the model picker with locked models, Stop, New chat and History.
- [ ] A first course is really generated and appears on the Courses dashboard in the right panel as an unpublished draft.
- [ ] Publish publishes straight away with no extra dialog and opens the Courses page. Back and Skip never lose the chat or the draft.

**Dashboard, tour and edit bar**
- [ ] The dashboard shows the starter courses with the existing course card, a unique banner on each, and the right labels and counts.
- [ ] The welcome dialog and all six tour steps work, and the tour resumes where the user left off.
- [ ] The owner edit bar shows only to the owner, links to the right screens on the admin host and does not overlap the free-plan badge at 390px, tablet and desktop widths.

**States, quality and checks**
- [ ] Loading, error, verification, subdomain, builder failure, rate limit, bad document and video failure states each give a clear way to continue.
- [ ] All screens work on mobile and with the keyboard and screen readers.
- [ ] Analytics events and feature flags exist: video opened, completed and closed; first prompt sent; starter prompt used; build completed; build failed; course published; step skipped.
- [ ] Existing product features are not affected, and migration, API and dashboard build checks pass.

## Verification plan
1. **Build:** `pnpm --filter @cio/db build && pnpm --filter @cio/api build && pnpm --filter @cio/dashboard build`.
2. **Manual end to end, with a fresh user each run:** sign up, verify, answer the business questions, set the name and subdomain, confirm the four draft courses appear, pick a theme and check the public page and Settings agree, build a course in step 6, publish, and confirm the Courses page.
3. **Idempotency:** replay the metadata request and confirm no duplicate courses.
4. **Failure paths:** force the seed to throw, and the generation to time out, and confirm the user still finishes and the failure is logged.
5. **Theme gate:** change the theme several times and confirm the last choice wins and a non-free theme is rejected on the free plan.
6. **Subdomain:** confirm reserved and taken names show the right error and a race between check and submit is caught.

## Prototype
`prototypes/onboarding-flow/`. Run `cd prototypes/onboarding-flow && python3 serve.py 8899` and open `http://localhost:8899/flow.html`. The prototype's README lists what is real and what is simulated: no website is fetched, no model is called and no course is saved beyond local state.
