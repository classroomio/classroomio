# Build notes for the academy pages

You are building part of a high-fidelity, clickable prototype of the **ClassroomIO production app**, in
`prototypes/onboarding-flow/` (static HTML, CSS and classic `<script>` files, no bundler for page code). It is
served at `http://localhost:8899/` (a `serve.py` is already running; files are not cached, so reload to see edits).
Never touch production code under `apps/` or `packages/` (read it freely; it is the source of truth).

## The goal

Every page must reproduce the **real product screen** it stands in for: same structure, sections, controls, labels,
empty/loading/error states and flows. Read the production source first, then build. Do not invent features, do not
replace a real screen with a generic form, and do not leave a visible control that does nothing: every action must
change the shared prototype state or navigate to a real prototype page. Where the real screen depends on something the
prototype cannot do (network, payments, AI, email), simulate it honestly and say so in the UI where the real product
would show a result (for example a toast that ends with "(simulated)").

Production paths you will use (relative to `apps/dashboard/src` unless noted):
- Routes: `routes/(app)/org/[slug]/...`, `routes/(app)/courses/[id]/...`, `routes/(org-site)/...`
- Feature code (where the real UI mostly lives): `lib/features/<feature>/{pages,components,utils,api}`
- Shared UI primitives: `packages/ui/src/{base,custom}/...`
- Copy: `lib/utils/translations/en.json` (use these exact strings for product UI text)
- Real template and sample data: `packages/db/src/utils/seed/platform-templates/fixtures.ts`

## How the prototype is organised

- `proto.js` – `window.proto` (P): `loadState()`/`saveState(S)` (one object in localStorage), `escapeHtml`, `icon(name,size)`,
  `slugify`, `brandNameOf(S)`, `initials`, `toast(message,{action,onAction})`, themes, plans, `brandVars`.
  The state `S` holds the onboarding answers, `S.courses[]`, `S.primary` (brand colour), `S.theme`, `S.logoDataUrl`,
  `S.steps` (setup flags), `S.landing` (landing page settings), `S.fullname`, `S.email`.
- `model.js` – `window.model` (M): **`M.R`** is the route table. Link only through `M.R.*`; never hard-code a file name.
  Also: `M.orgInfo(S)`, `M.courses(S)`, `M.findCourse(S,id)`, `M.ensureCourse(course)`, `M.lessonsOf(course)`,
  `M.findLesson(course,lessonId)`, `M.createCourse(S,fields)`, `M.setPublished(S,id,bool)`, `M.deleteCourse(S,id)`,
  `M.counts(course)`, `M.setupSteps(S)` (production's six-step Get Started checklist), `M.newId(prefix)`.
  **Course shape** (read `model.js`): `{id, slug, title, desc, type: 'SELF_PACED'|'LIVE_CLASS'|'COMPLIANCE', published,
  visibility, sections:[{id,title,lessons:[{id, kind:'lesson'|'exercise', title, html, published}]}] , ...}`.
  You may add optional fields to a course (document them in a comment at the top of your file); do not rename existing ones.
  Always call `M.ensureCourse(course)` before reading `course.sections`, and `P.saveState(S)` after changing state.
- **Admin pages** use the shared shell in `dashboard.js` (org sidebar and header). A page file registers
  `window.PAGES['<nav key>'] = { title, html(S), wire(S, {commit, rerender}) }` before `dashboard.js` loads and sets
  `<body data-page="<nav key>">`. Nav keys: `dashboard, courses, settings, audience, setup, landing`. See `setup.html`
  + `setup-page.js` (currently stubs) and `courses.js`.
- **Course pages** (`course.html?id=<course id>&tab=<tab>`) use the course shell in `course.js` (course sidebar with the
  content tree, header with Published badge, View course site, actions menu). A tab file registers
  `window.COURSE_TABS.<tab> = { nav, title, html(ctx), wire(ctx) }`; read the contract at the top of `course.js`.
  `ctx` gives you `S, course, params, M, P, $, $$, esc, ic, commit, say, confirm, rerender, publish(bool), remove()`.
  Tabs already stubbed: `lessons` (course-lessons.js), `lesson` (course-lesson.js, also used for exercises),
  `settings` (course-settings.js), `landingpage` (course-landing.js), `people` (course-people.js).
- **Public (visitor/learner) pages** are standalone documents that load `site/ui.css` + `site/classroomio.css`
  (the production Tailwind build and component styles) and `site/bundle.js` (the repo's real `org-landing-page`
   Svelte components compiled for the browser; see `site.html`, `site.js` and `site-model.js`).
  Do **not** load `site/ui.css` on an admin page (its Tailwind reset clashes with `app-theme.css`/`onboarding.css`).
- Styling: admin pages load `app-theme.css`, `onboarding.css`, `brand.css`, `dashboard.css`; classes available include
  `.btn .btn-primary .btn-outline .btn-ghost .btn-sm .btn-lg .btn-destructive`, `.input`, `.field`, `.label`, `.chip`,
  `.badge`, `.modal .scrim .modal-actions` (render into `#modal-host`), `.note`, `.card`. Tokens are CSS variables
  (`--primary`, `--border`, `--muted-foreground`, ...). Put **new CSS only in your own CSS file** (named in your brief),
  prefix new classes with a short page-specific prefix to avoid collisions, and match the production proportions
  (read the Tailwind classes in the Svelte source: `p-4`=16px, `gap-2`=8px, `text-sm`=14px, `rounded-lg`, etc.).
  The app uses brand colours (a single blue accent, warm paper neutrals), Geist type, hairline borders, almost no shadow.
- Global names collide across classic scripts: wrap your page code in an IIFE or prefix top-level names.
- `window.PAGES` / `window.COURSE_TABS` registrations must run before `dashboard.js` / `course.js`; the HTML files
  already include your script before the shell script.

## Rules

- Own only the files in your brief. If you need a change in a shared file (`proto.js`, `model.js`, `dashboard.js`,
  `course.js`, `course.html`, `site.js`), do not edit it; write the request in your final report instead, unless it is a
  one-line additive change that cannot break others (then say exactly what you added).
- Product UI text is the product's: use `en.json` strings verbatim (including "!" or capitalised words), even where the
  onboarding prototype's own brand voice rules differ. Prototype-only notices (such as "simulated") should be plain.
- Every list/grid has its empty state; every form has validation like production; destructive actions confirm; saves give
  the production feedback (snackbar/toast). Unsaved-changes behaviour matches production where it exists.
- Responsive: usable at 1440, 1024 and 375 wide. No horizontal page overflow.
- Verify in the browser: load each page you built at `http://localhost:8899/...` (state is created by running the flow
  at `flow.html`; to skip, seed localStorage `cioOnboardingState` the way `flow.js`/`customize.js` do: `stage:5`,
  `completedAt`, company/brandName, `courses` from `P.recommend(S).courses`). Check the console for errors, click every
  control you added, and check a phone width. Then run `node --check <file>` on every script you wrote.
- Do not run git commands that change history; do not commit. Do not run formatters (the owner formats at the end).
- Finish with a short report: what you built (files), which production sources you mirrored, what is simulated, anything
  you could not reproduce and why, and any requested shared-file changes. Be honest about gaps.
