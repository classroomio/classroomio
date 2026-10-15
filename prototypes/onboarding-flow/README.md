# Onboarding Flow — Prototype (round 2)

Clickable UX exploration for onboarding: sign-up, a business screen, a simulated preparation step,
customisation, and the admin's first look at their own academy: the real landing page with a short list of next steps.

It joins two drafted specs that currently overlap:
[`prd/onboarding-ai-bootstrap/`](../../prd/onboarding-ai-bootstrap/README.md) (website → AI-drafted courses → brand)
and [`prd/onboarding-platform-showcase/`](../../prd/onboarding-platform-showcase/README.md) (theme picker → seeded
demo courses). Read both before reviewing; §"Where the two specs disagree" needs a product decision.

| File | What it is |
| --- | --- |
| `index.html` | Prototype map — start here |
| `flow.html` | **Interactive.** Stage 1–2 (account, verify — unchanged), stage 3 (business), and the simulated preparation scene |
| `customize.html` | **Interactive.** Stage 4, theme-dock layout: full-width portal preview, a floating pill for brand name, logo and colour, a docked strip of the real themes; the upgrade popup; starter-content editor; the integrations modal |
| `motion.css` | Motion tokens, the one staggered entrance, and the reduced-motion switch |
| `brand.css` | The brand layer: logo lockup, mono eyebrows, swipe highlight, notch, wash and dotfield, Machine styles, blocks and the block loader, the preparation scene, step 3 blocks, customise chrome |
| `visuals.js` + `machines.js` | The system's own Machine illustration and block loader. `machines.js` is generated from `packages/ui` by `tools/extract-machines.py` |
| `fonts/` | Geist, self-hosted from `apps/dashboard/static/fonts/geist` exactly as the app does |
| `site.html` | **Where the flow ends.** The org's real landing page (the production Quartz theme, or whichever free or purchased theme is applied) with an admin-only layer: a bar, Edit points on each section, a note where the catalog is still empty, and a Next steps panel |
| `landing-editor.html` | The landing page editor the Edit buttons open: section list, Hero and Navigation forms, a live preview of the real page, and the compact Save bar. Other sections are listed but not editable here |
| `site-model.js` · `site.js` · `landing-editor.js` · `site.css` · `landing-editor.css` | Build the page props from the onboarding state, and the behaviour and styles for those two pages |
| `site/` | **Generated.** `bundle.js` is the repo's own `org-landing-page` Svelte components compiled for the browser, `ui.css` is the repo's Tailwind build, `classroomio.css` is the components' own styles. Rebuild with `tools/site-bundle/build.mjs` (see Running it) |
| `courses.html` | The real Courses page with the starter courses: open a card to edit it in a simulated editor, publish, delete, search, grid/list view, blank course |
| `dashboard.html` | The populated dashboard (reachable from the sidebar): stats, Top Courses and the learning-path preview |
| `design-options.html` | **Review.** Five design directions for each of the five post-verification screens (25 mockups), with the selected one and why |
| `states.html` | Validation, failure, empty and gated states |
| `flow.js` · `customize.js` · `dashboard.js` | Behaviour for each page |
| `proto.js` | Shared state, option lists, themes, plans, integrations, starter-content matcher, colour maths, shared renderers |
| `app-theme.css` | Shared theme, copied from `prototypes/learner-lifecycle` — mirrors `packages/ui/src/index.css` |
| `onboarding.css` · `design-options.css` | Components specific to this prototype; blocks name the `@cio/ui` primitive they map to |

## Running it

```bash
cd prototypes/onboarding-flow && python3 serve.py 8899
# → http://localhost:8899
```

`serve.py` is a static server that sends `Cache-Control: no-store`, so edits show on a normal reload. Plain
`python3 -m http.server` also works but browsers may keep stale scripts.

### Rebuilding `site/`

`site/bundle.js`, `site/ui.css` and `site/classroomio.css` are committed build output, so serving the folder is enough.
To regenerate them after `packages/ui` changes, the workspace needs its dependencies (`pnpm install`), then:

```bash
cd packages/ui && ./node_modules/.bin/tailwindcss -i ./src/index.css -o ../../prototypes/onboarding-flow/site/ui.css --minify
node prototypes/onboarding-flow/tools/site-bundle/build.mjs
```

The landing page is the repo's real component, not a copy, so it follows the product when the bundle is rebuilt. Copy that
the user did not write comes from the production defaults (nav, footer, labels); only the hero is personalised.

Theme preview images are hotlinked from `assets.cdn.clsrio.com`, the same CDN the real theme picker uses, so the
prototype needs a network connection to show them. Offline, each frame degrades to the theme's name and description.
"Restart" in the top bar clears the saved state.

## The journey

1. **Create your account** and 2. **Verify your email** — **unchanged** from round 1: layout, visual panel, testimonial
   carousel, validation, resend cooldown and interactions. The verify screen stays focused on the inbox; the discovery question lives in step 3.
2. **Your business** (stage 3) — one screen, no preview, built from idea 2 of the second round (`step3-ideas-2/`). A four-section accordion asks the first outcome, company (name and optional website), team (role and company size) and how customers learn today, then an optional fifth, **"How did you hear about us?"** (the production nine sources, an AI-assistant follow-up and an "Other" text box, with a Skip button). It sits last on purpose: it is the one question that gives the user nothing back, so it comes after the four that shape the workspace and never blocks Prepare. The section that needs an answer opens by itself and a finished one folds to a summary line: picking an outcome, a size, a role pair or a learning method advances after 300 ms, and the company section advances on Enter or Next. Each answer drops a notch block into a five-block workspace stack beside it (workspace, first outcome, team, role, today), with dashed blocks for what is still open. Nothing is preselected, so the minimum is four answers; Prepare my workspace opens the first unanswered section if one is missing. Nothing is fetched or analysed. The courses appear on the Courses page once prepared.
3. **Preparation** - one phase at a time in large type on the brand wash, while the drafted courses, the path and the workspace drop in as notch blocks (simulated, and says so on screen). With reduced motion it shows the finished state.
4. **Customise** (stage 4) — a full-width preview of the learning portal with a docked strip of the eleven real themes beneath it. A floating pill holds the workspace name and logo, the five real colour presets, and a custom colour (HEX or RGB). Each theme tile carries its Free or Premium tag; Preview is always allowed, and a locked tile opens the upgrade popup. A **Starter content** button opens a list to rename or remove the drafted courses and path.
5. **Done customising** lands on the Courses page and starts the product tour (`tour.js`) as a spotlight: the page dims except a cut-out around one real control (course list, first course, templates, Landing Page, Audience, Your Academy), with a glass tip beside it showing "n of m", **Back**, **Next** and **Skip tour**. The page stays clickable, so clicking the highlighted link counts as the step done, and the tour resumes on Courses when the user returns. Steps whose control is hidden at the current width are skipped; on phones the tip is a bottom sheet. **Skip to academy** (top of this step) goes straight to the academy landing page with no tour.
6. **Your academy** (`site.html`) — the real landing page, branded with the user's colour and theme, with a hero personalised from the first outcome. Production shows only published courses, so a new academy opens on the empty catalog; an admin-only dashed note says the starter courses are drafts and offers Publish all drafts or Review courses. A bar on top says this is the admin view, and a Next steps panel lists four things in order: make the page yours, review the starter courses, publish a course, share the academy link. The current step is open with one button and the rest wait; hiding the panel folds it to a pill. Hovering a section shows an **Edit** pill that opens the matching section in `landing-editor.html`.
7. **Landing page settings** (`landing-editor.html`) — the Edit buttons land here, mirroring the real editor under Settings: a section list, Hero and Navigation forms, a live preview and the Save bar. Saving ticks the first Next step.
The Dashboard and Courses pages are reachable from the admin bar and the sidebar.

Opening `flow.html` always starts at sign-up and clears any saved progress; only `flow.html?resume=1` (used by Back from the customise screen) keeps it.
State is one object in `localStorage` (`cioOnboardingState`), written on every change. Back never loses an answer, and
returning to stage 3 and continuing unchanged keeps any course you removed rather than regenerating.

## Where the data comes from

| In the prototype | Source |
| --- | --- |
| The eleven theme names, descriptions and their order | `apps/dashboard/src/lib/utils/translations/en.json` → `settings.landing_page.theme.cards`; order from `features/settings/pages/landingpage.svelte` |
| Theme preview images | `https://assets.cdn.clsrio.com/templates/{theme}.png` (`CDN_BASE` in `landingpage.svelte`) |
| **Only Quartz is free** | `FREE_LANDING_PAGE_THEMES = ['quartz']` in `packages/utils/src/constants/org.ts`; the API rejects any other theme for `PLAN.BASIC` |
| Premium label and "Upgrade" affordance | the blue pill and `openUpgradeModal()` in `landingpage.svelte` |
| Pricing card layout (plan cards, billing toggle) | modelled on `apps/dashboard/src/lib/features/ui/upgrade-modal.svelte`, now with five plans |
| Brand colour: five presets + custom hex, one value | `features/settings/pages/org.svelte` (`themes`, `ColorPicker`) and `app.css` `body[data-theme=…]`; custom hex via `injectCustomTheme()` in `lib/utils/functions/theme.ts` |
| Logo | `organization.avatarUrl` (`UploadImage` in `org.svelte`) |
| Quartz rendering | `packages/ui/src/custom/org-landing-page/quartz/vars.ts` — accent and buttons use `var(--primary)`, so brand colour drives them |
| Sidebar groups and order | `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` (`GROUP_ORDER`) |
| **Plan names, prices, limits, features** | **The five-plan pricing supplied by the product owner** (Free / Starter $29 / Growth $69 / Scale $139 / Enterprise). Stored in `proto.js` as `PLANS`. **It is a proposal that differs from what ships** — see § Pricing |
| Integration availability | see next section |
| Resend cooldown, verify-by-link | `features/onboarding/components/verify-email-modal.svelte` |

## Integration status

Round 1 got this wrong, so it is spelled out. Only two integrations actually work.

| Integration | Status | Evidence |
| --- | --- | --- |
| MCP | **Works** | `features/automation/pages/mcp.svelte` — create keys, snippets for Claude Code, Codex, Cursor, OpenCode |
| Public API | **Works, plan-gated** | `api.svelte`; shipped gate is `canUsePublicApi()` (today Early Adopters or Enterprise). The prototype uses the proposed pricing: Growth and up |
| SAML / OIDC SSO | **Works, Enterprise** | `settings/auth/sso`; `prd/enterprise-sso` is done |
| Zapier | **Coming soon** | `zapier.svelte` renders `automation.coming_soon`; `prd/zapier` is a draft ("no Zapier app exists") |
| Webhooks | **Planned** | `prd/webhooks` — "ClassroomIO has no outbound webhook product" |
| HubSpot, Slack | **Do not exist** | no code anywhere; would need Zapier or webhooks first |

The modal shows exactly that, with a status badge on each card. Only live and un-gated cards offer **Connect**; everything
else offers **Notify me**, which is simulated and stores nothing. A plan-gated card names the plan on a disabled button and
never opens a second popup. Telegram is deliberately absent: its settings page exists but the connect handler is a `TODO`.

## Pricing

The pricing card (`pricing.js`) opens whenever the user clicks any premium item, and always shows the same five plans, with the
wording supplied by the product owner. Annual prices are per month billed annually; the Monthly toggle shows the higher
monthly-billing price (35 / 85 / 169). Growth is marked as the main plan. A plan that does not include the clicked item shows a
disabled "Doesn't include this" button, and **Free** is always a way out. Upgrading is simulated: no checkout, no payment details.

**This is not what ships today.** `packages/utils/src/plans/data.ts` has Basic ($0, 20 students), Early Adopters ($35, 10K
students) and Enterprise (request pricing). Several things on the new tiers are not built either (Zapier, webhooks, native CRM
integration, sandbox, SCIM, SCORM/xAPI, multi-academy). The card is a design for the proposed pricing, not a statement of what
exists. Currency is assumed to be USD because the source gave bare numbers.

Which premium items open the card, and the lowest plan that includes each (`PREMIUM_ITEMS` in `proto.js`):

| Premium item | Where it appears | Included from | Source |
| --- | --- | --- | --- |
| Premium themes (all but Quartz) | Theme dock tiles, "Use this theme" in a preview | Starter | **Assumption** — the tier list does not mention themes, so they unlock on the first paid plan, as the product gates them today |
| REST API (read and write) | Integrations modal → Public API | Growth | Growth tier |
| Learning paths with prerequisites | Not surfaced in the app (see below) | Growth | Growth tier |
| Full branding removal | "Powered by ClassroomIO" in the portal footer; disappears once on Growth | Growth | Growth tier |
| SSO (SAML and OIDC) | Integrations modal → SSO | Enterprise | Enterprise tier |

Not gated, but worth a decision: the tier list puts **custom branding on Starter**, yet the prototype lets a Free user set a logo
and brand colour (the shipped product does not gate them either). If those should be premium, they become two more entries in
`PREMIUM_ITEMS` and the brand pill would open the card. The prepared learning path is a
Growth feature to manage.

## Learning paths

Learning paths are **specced and prototyped, not shipped**: `prd/learning-paths` is "Draft (prototyped, ready for engineering
review)" and the schema has no learning-path table.

What *is* shipped and groups courses: **Programs** (`program` / `programCourse` tables; `prd/programs` is marked done, and
they are explicitly unordered), and **Cohorts**, which the dashboard nav exposes and which has its own `cohort` /
`cohortCourse` / `cohortMember` tables. **I did not establish how Programs and Cohorts relate in the UI**, so the prototype
claims only that Cohorts are "the closest feature in the product today".

The prototype still shows a starter path because the brief asks for one, but flags it: the nav item and the path card both
carry a **Preview** tag. If a starter path has to ship before learning paths do, the realistic first
version is a Cohort holding the starter courses; confirm that with whoever owns Cohorts before building.

## What is simulated

Labelled on screen wherever it happens, not only here.

- **No website is fetched and no model is called.** The business screen keyword-matches the company name, website string
  and description against seven categories in `proto.js` (project management, fintech, analytics, developer tools,
  compliance, commerce, HR) plus a generic fallback. Goals then reshape the result: they swap courses in from the end of the
  list and choose the path's name. The four-phase preparation is a timer.
- **Real AI exists but is not reused here.** `prd/ai-course-assistant` is done and `apps/api/src/services/course-import`
  exists. A frontend-only prototype cannot call them, so generation is a simulation. The real implementation should call
  those services; `prd/onboarding-ai-bootstrap` FR-3 specifies schema-validated output.
- **Email verification** is advanced by a labelled prototype button. **Google sign-up** fills the form; no OAuth.
- **Upgrade** records a plan choice. No checkout runs and no payment details are collected.
- **Connecting a tool** opens a dialog that states it is simulated and requests nothing.
- Testimonials and starter-course copy are written for this prototype; companies are marked `(placeholder)`.

## The theme preview limitation

Quartz is rendered live from its real tokens, so your name, logo, colour and courses appear in it. The other ten themes can
only be shown as their stock preview image, because rendering them live would need the real Svelte components. The banner says
so ("stock preview image, not your content"), and an applied premium theme says your content fills it in when published.

The real picker has the same split: **Preview** is always allowed, **Apply** is not for a locked theme. The prototype keeps
both, and clicking a locked card opens the upgrade popup rather than silently doing nothing.

## Decisions

**Verification is a link, not a code.** `verify-email-modal.svelte` sends a link and waits for the click; there is no code to
enter. Stage 2 is unchanged and says so on screen.

**Business information is one screen, not two.** Round 1 split "about you" and "your product". They are now one screen — outcome
tiles plus a compact details row, with no live preview — which is why the old stage 4 and the preparation-review
screen are gone: preparation hands straight to customisation, and the user then goes straight to the Courses page, where the courses
already are. There is no separate "your workspace is ready" preview screen; the product itself is the reveal.

**Selected directions** (reasons are on `design-options.html`): business — outcome tiles plus a compact details row (option 1 of the second round of five, `step3-ideas/`; replaces the earlier sentence composer); **preparation — option 5,
cinematic, chosen by the product owner**; **customisation — option 2, theme dock, chosen by the product owner**; integrations —
centred dismissible modal, backed by a checklist item so skipping it is not final.

The earlier recommendations for preparation (workspace assembles) and customisation (real dashboard + inspector) are still in the
gallery as alternatives. The theme dock gives up the real dashboard chrome on this screen; the dashboard itself, which follows,
is unchanged and uses it.

**Image generation was not used for the design options.** The Canva tools available in this environment generate designs in
the user's Canva account and cannot render ClassroomIO's real interface or its real theme previews. The brief's fallback
applies: 25 high-fidelity HTML mockups on the real tokens and chrome, which are also closer to implementable.

## Corrections to round 1

Round 1 shipped several things that were wrong or invented. All are fixed; the old README claims no longer hold.

- **Themes were invented.** It offered five themes labelled Minimal / Modern / Bold / Elegant / Playful, rendered from
  hand-simplified tokens and relabelled from `saas`, `editorial` and `vibrant`. The real names are SaaS, Editorial and
  Vibrant, and only Quartz is free. Now the real eleven, real previews, real split.
- **Integrations were misrepresented.** Zapier was "Available now"; HubSpot, Slack and Intercom were "Through Zapier". None of
  that is true (see above).
- **Controls with nowhere to live.** Accent colour, background colour and portal light/dark were offered. The org has one
  brand colour and no per-org dark mode. They are gone.
- **Plan selection was a full screen**; it is now the contextual popup the brief asks for.

## Enum gaps this still surfaces

The role and goal lists do not fit the current enums, so several options have nowhere to go but `other`.

`ONBOARDING_JOB_ROLES` is `founder | product-ops | cs-education | developer | other`:

| Option | Maps to | Fits? |
| --- | --- | --- |
| Founder or CEO | `founder` | yes |
| Customer Success | `cs-education` | collides with Customer Education |
| Customer Education | `cs-education` | collides with Customer Success |
| Product | `product-ops` | yes |
| Marketing or Growth | `other` | **no home** |
| Support | `other` | **no home** |
| Operations | `product-ops` | approximate |

`ONBOARDING_USE_CASES` is `customer-training | customer-certification | partner-training | team-training | sell-courses | other`.
"Cut repetitive tickets" and "Build an education hub" fall to `other`; three goals collapse into `customer-training`.
Shipping the screen as designed means extending both enums and their locale keys. `proto.js` carries the mapping on each
option (`maps`) so the gap is visible in code.

## Where the two specs disagree

`onboarding-ai-bootstrap` FR-3: generate **exactly two** courses from the product context. `onboarding-platform-showcase`
FR-2: seed **two curated demo courses** matched to the goal. Run both and you get four with no stated relationship.

This prototype produces **four starter courses and one path**, in line with the brief's example. Three are drafted from the
product and the goals can swap in one or two goal-matched courses (badged "Matched to your goal"). **A proposal, not a
decision** — settle it before either spec is built.

## Alignment with the two PRDs (final recheck)

Both PRDs are drafts; the shipped onboarding (`ONBOARDING_STEPS` in `features/onboarding/utils/constants.ts`) is already
`org-setup` then five question steps, with no theme step and no course seeding. Status of each requirement in the prototype:

| Requirement | Prototype | Status |
| --- | --- | --- |
| Showcase: theme picker is a real step, persisted | Theme dock on Customise (stage 5), all eleven real themes, only Quartz free | Aligned in intent; **later in the order** and eleven themes, not eight (the PRD list is stale: `landingPageThemes` has eleven) |
| Showcase: step order org-setup, theme, metadata, seed | Business questions (3), workspace/org setup (4), preparation, Customise | **Differs.** Questions come before org setup so the company name prefills the workspace name and site slug. Needs a product decision |
| Showcase: preview of pre-loaded courses beside the picker | The preparation scene and the Courses page show them | Aligned in outcome; no tiles beside the picker |
| Showcase: goal drives seeded courses, drafts, not published | Goals swap in goal-matched courses, every card says Draft | Aligned |
| Showcase: seed failure never strands the user (FR-4) | `states.html` only | Aligned, off the main path |
| Showcase: welcome popup after redirect names the sample courses | A welcome dialog on the Courses page lists the sample courses (Later / Take the tour), then the tour starts | Aligned |
| Showcase: Sample badge | A "Sample" badge on starter courses in the list and grid | Aligned (a v1.1 item in the PRD) |
| Showcase: locale banner | Not shown | Open question in the PRD |
| Bootstrap: website URL, analysis, brand colour | Website is optional and never fetched; keyword match; colour is chosen on Customise | Simulated, labelled on screen |
| Bootstrap: blueprint review with edit, regenerate, remove lessons | Starter content editor renames, removes and **regenerates** courses and the path; no lesson editing | **Partial** |
| Bootstrap: appearance light, dark or system | Not offered: the org has no dark mode and the brand has no dark theme | **Dropped** on purpose |
| Bootstrap: persona path selector | Optional SaaS academy, Customer enablement and Compliance training chips under Your business; Compliance forces the compliance set, the others use the inferred category | Aligned, simulated |
| Bootstrap: Skip AI | "Skip website analysis" on Your business uses the generic starter set | Aligned |
| Bootstrap: exactly two courses; Showcase: two curated | Four courses and one path | **Conflict between the PRDs**, see "Where the two specs disagree" above |

## Known prototype-only shortcuts

- Starter course content is a title and description. The real seed carries sections, lessons and markdown notes.
- Keyword matching includes the website *string* (a domain like `lumen-analytics.io` matches "analytic"). It never loads the site.
- "Regenerate" was removed with the review screen; changing any input on stage 3 and continuing re-runs the preparation.
- The preparation-failure state is in `states.html` only (`prd/onboarding-platform-showcase` FR-4: five-second timeout, never
  strand the user).
- Logo files are held as data URLs in `localStorage`; a large image can exceed the quota. The write is wrapped in `try/catch`.
- Out-of-scope controls (sidebar links, Edit, Publish, Invite a teammate) raise a toast naming where the real thing lives.
- The course editor behind a card's Edit is simulated; the real one lives at `/courses/{id}/lessons`.

### The prepared learning path has no home in the product

The preparation scene drafts a learning path and the customise screen lets you rename or remove it,
but neither the Courses page nor the dashboard shows it. That is deliberate: the real dashboard puts
**Recent certifications** in that slot, and learning paths are not shipped, so a path panel there
would be inventing a feature. The path still exists in state and in the starter-content editor. If
it should be visible, the honest place is a new surface, not a borrowed one.

## Visual direction

**The prototype is built on the ClassroomIO brand system**, `skills/classroomio-design`. It is read,
not reinvented:

- **Palette** (`tokens/colors.css`, `tokens/app.css`): one blue, `#0233BD`, with sky `#ADC3FF` as the
  highlight, on warm paper `#FDFBF7`, page `#FAFAFA` and sand `#F6F2E9 / #F1EEE7 / #E3DACA`, with
  warm ink `#17140F`, `#2A251D`, `#6B6152`. `app-theme.css` maps these onto the shadcn token names the
  prototype uses, so the app screens carry the brand colours as well.
- **Type** (`tokens/typography.css`): Geist for everything, Geist Mono for eyebrows, tags and labels
  (uppercase, tracked). Display is 800 weight at -0.05em. Both faces are self-hosted from the
  system's own font files.
- **Logo**: the three-shape mark and the lowercase `classroomio` wordmark, on every screen including
  the app sidebar.
- **The notch** is the signature shape. It is cut from the panel, the testimonial card and every
  block, using the same mask the product ships (`@utility notch-cutout`).
- **Illustrations are the brand's own.** Sign-up shows the training-line Machine (lessons, a quiz and
  an assignment on a conveyor, one accent moving part), lifted verbatim from `packages/ui`
  (`tools/extract-machines.py`). Verification and preparation use the **block loader**: notch blocks
  that drop, stack and clear. On preparation the blocks are the user's own drafted courses, the path
  and the workspace.
- **The hero background** is the brand wash with the blue dotfield, the only gradient the system
  allows. There are no glows, no glass and no decorative shadows: hairline borders and flat colour do
  the work. Floating menus keep the app's `shadow-md`, as the product's menus do.
- **Voice** (`docs/content.md`): sentence case, no emoji, no exclamation marks, no em or en dashes,
  none of the banned words, sentence-case buttons. Testimonials are number-free placeholders and say
  nothing the brand has not approved. The product's own strings (the dashboard greeting, plan feature
  lists) are left as the product writes them.
- **Colour use**: blue is the one accent per surface. Status colours (success, warning) stay for real
  states only, and integration marks are neutral sand tiles rather than a colour per tool.

**The brand has no dark theme** (the system README: dark tokens are not mapped), so the prototype is
light only and the theme toggle is gone.

**Brand colours on the app screens.** The Courses and dashboard pages keep the product's structure,
spacing and components, and wear the brand palette from `tokens/app.css`, as that file intends: code
supplies geometry, the brand supplies colour and type. The default academy colour is the brand blue.
Organisation colour presets (the colour a customer picks for their own portal) are unchanged.

**Motion** is one staggered entrance (`m-rise`), the swipe highlight, the Machine's own SMIL
animation and the block drop (`cio-ld-drop`, copied from `tokens/schemes.css`). Under
`prefers-reduced-motion` entrances and their delays are removed and the loader and machine show a
still frame.

### Not reproduced

- **Use-case multi-select and "Other" text boxes.** Production asks five use cases (choose all) plus Other; the prototype keeps one first outcome. The four outcome tiles map onto `customer-training` and related values.
- **Locale.** Production saves the interface language with the profile; the prototype has no language picker.
- **The welcome modal** (production opens it after `welcomePopup=true`); the prototype lands on the academy's landing page with a Next steps panel instead.

- **What's New card.** Main now puts a changelog card above Upgrade in the sidebar footer. It is
  fed by a remote endpoint, so showing it would mean inventing changelog entries.
- **The early-adopter callout** in the real upgrade modal. The prototype's pricing card is the
  five-plan proposal, not the shipped three-plan modal, so the callout does not apply.


## Workspace stage, academy and course pages

- Stage 4 is the workspace screen (production fields and validation); five concepts are kept in `workspace-ideas/`.
- Org shell pages: `dashboard`, `setup` (Get Started), `courses`, `templates`/`template`, `settings`, `org-settings`, `audience`, `landing-editor`.
- Course shell (`course.html`): Content, lesson and exercise pages (`course-lesson.js`), Settings (`course-settings.js`), Landing (`course-landing.js`), People.
- Public and learner pages: `public-courses`, `public-course`, `enroll`, `learn`.
- Bundles: `node tools/site-bundle/build.mjs`, `node tools/academy-bundle/build.mjs`, `tools/editor-bundle`. Rebuilding one can overwrite `site/classroomio.css`; rebuild the academy bundle last.
- Simulated: all data is localStorage; sign-up, enrolment, publishing, certificates and Notify me are local only. Not reproduced: learner profile pages, News Feed, Marks, Attendance, Compliance, analytics, the AI assistant. Navigation is between separate pages, not client-side.

## Ending

- The customise screen's primary button ("Go to my courses") lands on `courses.html`, the production Courses page with the prepared starter courses. "Skip to academy" does the same. `site.html` is still reachable from "Your Academy".

