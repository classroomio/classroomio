# Zapier Integration: Prototype

Clickable UX exploration for a V1 Zapier integration. Grounded in the real spec at
[`prd/zapier/README.md`](../../prd/zapier/README.md) and the real sidebar IA in
`apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` (an `Automation` group with
`MCP` / `API` / `Zapier` as sibling items), not a generic Zapier mockup. The entry page is
UX-inspired by Jotform's own integrations directory: structure and interaction pattern only,
adapted to ClassroomIO's design system, never its visuals.

| File | What it is |
| --- | --- |
| `index.html` | Screen 1: Zapier's main entry point, and the true start of this prototype. Opens directly into a Jotform-style directory landing: a heading, a functional search bar that filters the full 77-app catalog live, the three most popular integrations, and an "Add integration" CTA. No separate landing/welcome screen before it. Both the "Browse all apps" link near the search bar and the "View more apps" button under the popular integrations lead to the full App Directory |
| `prototype-map.html` | Reviewer-only prototype map, linking out to every screen. Not part of the user flow |
| `app-directory.html` | Screen 2: the full App Directory, reached from `index.html`. Sidebar search and category filters with counts (Jotform layout), Popular/A-Z sort, Popular / Recently added quick filters, and a "View more apps" button that paginates through all 77. Accepts `?category=` and `?q=` to arrive pre-filtered |
| `app-detail.html` | Screen 3: Per-app "ClassroomIO + {App}" page. What it enables, every ClassroomIO trigger, an example action, Connect CTA |
| `oauth-consent.html` | Screen 4: Authorize screen. Org picker, read/write scopes, Authorize / Deny |
| `zapier-connected.html` | Screen 5: Connected state. Grant info, usage vs plan limits, connections table, setup guide |
| `zap-templates.html` | Screen 6: Five ready-made Zap templates plus start from scratch |
| `zap-builder.html` + `zap-builder.js` | Screens 7-10: One guided flow. Trigger, action, test, review and enable |
| `manage-zaps.html` | Screen 11: Active / paused / error Zaps, with a working pause/resume action |
| `automation-overview.html` | Context screen: the org's Automation hub (MCP / API / Zapier cards) inside the real dashboard chrome. Not required to reach Zapier, but one click away from the "Automation" breadcrumb on every Zapier screen |
| `apps-catalog.js` | Shared data: the 77-app catalog (categories, colors, descriptions), 15 category-level default actions, the 5 ClassroomIO triggers, and the `ZI.badgeHTML()` / `ZI.getAction()` helpers every other file renders through. Single source of truth for the directory landing, the full App Directory, app-detail pages, and the builder |
| `app-theme.css` | Shared theme, copied from `prototypes/learning-paths`. Mirrors `packages/ui/src/index.css` tokens |
| `zapier.css` | Components specific to this prototype (directory landing hero/search bar, popular-app cards, directory sidebar/cards, app-detail layout, grant table, picker cards, field mapping, wizard stepper, status dots) |
| `proto.js` | Theme toggle, mobile nav, shared toast |

## Running it

```bash
cd prototypes/zapier-integration && python3 -m http.server 8899
# → http://localhost:8899
```

Opening `index.html` over `file://` also works.

## The flow

Zapier (App Directory landing, `index.html`) → *(search, or pick one of the three popular apps, or
Browse all apps into the full App Directory)* → app detail → Authorize → Connected → Create a Zap →
pick a trigger and filters → pick an app and map fields → test → review → Turn on Zap → Manage Zaps.
Every step is reachable by clicking through, and every screen after `index.html` has a back arrow in
the top bar so the flow works in reverse too. `index.html`'s "Add integration" button starts the OAuth
flow generic, with no app pre-selected (for a user who wants to build a Zap from scratch), while any
app-detail page's "Connect" carries `?startApp=<slug>` through Authorize → Connected, so a user who
picked Slack in the directory lands back on "Continue building your Slack Zap" instead of a generic
connected screen.

## Sidebar: shown inside the real dashboard, not as a standalone product

Every screen in this flow (except `oauth-consent.html`, see below) renders inside the actual
ClassroomIO dashboard chrome: the same `<aside class="sidebar">` a signed-in admin sees, not a
Zapier-only shell. This is deliberate. The point isn't to show Zapier screens in isolation, it's to
show stakeholders exactly where the feature lives inside the product and how a user gets to it.

The sidebar structure matches the real navigation IA
(`apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`): `Dashboard`, `Stats`, and
`Setup` as top-level items, then grouped sections for `Content` (Courses, Cohorts, Media, Tags,
Widgets), `People` (Community, Audience), and `Automation` (MCP, API, Zapier), followed by
`Settings` and the signed-in user's profile pinned to the bottom. `Zapier` is the only working link
in this sidebar (every other item points to `#`, since this prototype is scoped to the Zapier flow,
not a full dashboard clone), and it's marked active on every screen in this flow.

The one thing that changes between screens is what `Zapier` links back to: on the pre-connection
screens (`index.html`, `app-directory.html`, `app-detail.html`) it points to `index.html`, and on the
post-connection screens (`zapier-connected.html`, `zap-templates.html`, `zap-builder.html`,
`manage-zaps.html`) it points to `zapier-connected.html`, so clicking it from anywhere in the flow
always lands on "wherever this org currently is" with Zapier, connected or not. The `Automation`
breadcrumb above `Zapier` points to `automation-overview.html`, the hub screen showing MCP, API, and
Zapier as sibling cards.

`oauth-consent.html` intentionally keeps its own minimal header (brand mark and a couple of top
actions, no full sidebar), matching how real OAuth authorize screens work: Zapier's own consent
screen doesn't carry the authorizing app's navigation chrome either, and dropping the sidebar there
also correctly signals a context switch out of the ClassroomIO dashboard proper.

## Back navigation

Every page except `index.html` (the true entry point of this flow, and the only screen with no
previous step to go back to) and `automation-overview.html` (the automation hub, a context screen
reachable from the breadcrumb rather than a step in the flow) has a back arrow icon button at the
start of the top bar, to the left of the breadcrumb. It calls `history.back()` when there's history
to go back to, and falls back to a sensible previous screen in the flow otherwise (for example,
`app-detail.html` falls back to `app-directory.html`). This is the same `icon-btn` component used for
the theme toggle and mobile nav elsewhere in the prototype, with the chevron path already used by the
Zap builder's own "back to templates" button, so it looks and behaves the same everywhere. The Zap
builder's four steps (trigger, action, test, review) already had their own "Back" buttons between
steps before this pass; those are unchanged.

## Mobile

Every screen is adapted for phone widths, not just shrunk. The breakpoints: 860px picks up the
sidebar-drawer / single-column switch `app-theme.css` already defines for the whole app shell; 700px
and 640px handle phone-specific fine-tuning (headings, padding, touch targets) inside `zapier.css`'s
"MOBILE" section at the end of the file. A few adaptations that aren't just "make it one column":

- **Breadcrumbs collapse to the current page only** below 860px (`.crumbs > *:not(:last-child)` is
  hidden), and the "Prototype map" reviewer link drops out first, since a hamburger, a back arrow, a
  multi-segment breadcrumb, and two more buttons don't fit one 56px bar on a phone. The page's own
  `<h1>` still carries the context.
- **The App Directory's sidebar becomes a collapsible "Filters" drawer** (`#filterPanel` in
  `app-directory.html`), not a long wall of category buttons sitting above the app grid. It's closed
  by default, shows a badge when a filter is active, and auto-closes itself the moment a category is
  picked so the user lands straight on the filtered results. Search stays outside the drawer, always
  visible.
- **The Connections table and the Manage Zaps table become labeled stacked cards** below 700px
  (`.trow.zi-grant-row`, `.trow.zi-zap-row`), with a CSS `::before` on each cell supplying an
  "Access" / "Trigger" / "Status" style label via `nth-child`, so nothing needed to change in the
  HTML or the JS that renders these rows.
- **The Zap builder's 4-step stepper**, built as four fixed 110px nodes for desktop, would overflow
  any phone width as-is. On mobile the nodes flex to share the row instead, and long labels ("Review
  & enable") ellipsize rather than wrap and break the stepper's height.
- **Field mapping rows stack label-above-input**, and the **review step's trigger → action flow
  stacks vertically** with the connecting arrow rotated 90°, instead of squeezing a fixed 160px label
  column or a side-by-side flow into a narrow screen.
- **The directory landing's search bar and popular-app cards stack to one column** below 640px, with
  the search pill going full width and the "Add integration" button stretching to match, instead of
  shrinking a three-column grid down until the text is unreadable.
- Verified directly: `document.documentElement.scrollWidth` equals `window.innerWidth` (no horizontal
  page overflow) on every screen in this prototype at a 375px viewport.

## Why the App Directory is the entry page, and why 77 apps, not 6,000

The brief asked for Zapier to open directly into an app directory, feeling like a native app
ecosystem rather than a settings page with one "Connect" button and a separate marketing screen in
front of it. `index.html` is modeled closely on **Jotform's own integrations directory**: a short
heading and subheading, a prominent search bar, and a small number of featured integration cards each
carrying a category ribbon, an icon, and a short description, rather than a long list. The structure
is reused closely; none of the visuals are. Every section is built from ClassroomIO's own tokens,
cards, badges, and form controls, the same as the rest of `prototypes/`.

The directory landing deliberately shows only **the three most recognizable integrations** (Google
Sheets, Slack, Stripe, picked from the catalog's `popular` flag to span data, communication, and
payments), not a long grid, so the page reads as curated rather than overwhelming. Anyone who wants to
look further has two ways in, both real: typing in the search bar filters live across the full 77-app
catalog and replaces the three cards with matching results (with an honest empty state when nothing
matches), or the "Browse all apps" link leads to the full `app-directory.html` (sidebar search,
category filters with live counts, sort, pagination) for anyone who wants to scroll rather than
search.

Representing all 6,000+ real Zapier apps isn't useful or buildable as a static prototype, and the
brief explicitly said not to try. `apps-catalog.js` defines **77 real, named apps** spread across the
15 categories Zapier actually organizes by (CRM, Marketing, Communication, Customer Support, Sales,
Productivity, Project Management, Forms & Surveys, Analytics, Email, Storage, Finance, Developer
Tools, Payments, HR), with **at least 5 apps in every category** so clicking any category in the
sidebar always shows a populated list, never an empty one. That's enough to prove the directory's
search, filter, sort, and pagination patterns hold up against a real-sized dataset, without
hand-building thousands of cards. The full App Directory shows 18 at a time and a **working "View
more apps" button** reveals the next 18 (not a placeholder: click it in `app-directory.html` and the
grid actually grows) until all 77 are visible. Two things keep the "sample, not the whole thing"
honest instead of implying a false ceiling:

- Once every local app is visible, a closing card (`#dirMore`) says *"That's every app in this
  sample... Zapier connects ClassroomIO to 6,000+ apps in total"* with a link straight into Connect.
  It only appears at the true end of the list, not underneath a "View more apps" button that still
  has more to give.
- Category counts in the sidebar are the **real count of cards in that category**, not an inflated
  number, unlike Jotform's reference screenshot (`CRM 182`), which would be a lie against this
  dataset.

Every app has a real category, a color, and a one-line directory description; roughly 30 keep their
bespoke `detailBlurb` and hand-written action (1-3 mapped fields). The rest fall back to one of 15
**category-level default actions** (`CATEGORY_DEFAULT_ACTIONS` in `apps-catalog.js`, for example
every Developer Tools app defaults to "Create Issue") via `ZI.getAction(slug)`: the same "one primary
create action" pattern real, simpler Zapier integrations ship with. That's what makes the "Connect"
CTA on *any* of the 77 apps, not just a curated few, actually land in a working builder step 2 via
`zap-builder.html?startApp=<slug>`, verified end to end for both a hand-written app (Salesforce) and
a generic-fallback one (Zoom) with no console errors either way.

## What's real vs. what this proposes

`prd/zapier/README.md` is the confirmed v1 scope: OAuth 2.0 authorization-code connect flow, a
dashboard page that lists and revokes OAuth grants, and **the actual Zap gets built on zapier.com**.
The dashboard doesn't host a Zap editor or an app directory in v1. That PRD's decisions are reflected
exactly here:

- **Auth is OAuth, not an API-key paste.** `oauth-consent.html` mirrors the PRD's consent-screen spec:
  org picker, `zapier:read` required plus `zapier:write` optional, redirect notice, Authorize/Deny.
- **Plan gating is binary at Early Adopter+.** `index.html`'s dev toggle shows the upgrade callout a
  Basic-plan org would see instead of the directory landing, matching the PRD's stated gate.
- **Rate limits and grant counts match `ZAPIER_AUTOMATION_LIMITS_BY_PLAN`** in
  `packages/utils/src/plans/automation.ts` (1 / 5 / 25 grants, 120 reads and 40 writes per minute on
  Early Adopter).
- **The v1 trigger catalog is exactly the PRD's 5 polling triggers:** `new_audience_member`,
  `student_enrolled_in_course`, `course_completed`, `certificate_issued`, `payment_request_created`.
  `exercise_submitted` and `lesson_completed` are deliberately absent; the PRD defers them to v1.1
  because they need webhooks to poll at sane volume.
- **Revoke is per-grant, from the dashboard.** There's no bulk "Disconnect Zapier" button, matching
  the PRD's stated reasoning that customers manage the integration from Zapier's side day to day.

Where this prototype goes further than the confirmed v1 scope is the App Directory, app-detail pages,
the template gallery, the trigger/action builder, field mapping, the test step, and Manage Zaps. The
PRD explicitly puts Zap-building on zapier.com in v1. This prototype instead explores **Zapier's
Partner API and embedded editor**, a real product Zapier ships that partners like Webflow and Unbounce
use today ([zapier.com/developer-platform/partner-embeds](https://zapier.com/developer-platform/partner-embeds)).
It lets a host app render its own app directory, trigger/action picker, and field mapping natively,
and read or toggle a customer's Zaps without leaving the host app. That's a bigger build than the
confirmed v1 since it needs the Partner API integration, not just OAuth, so treat the App Directory
and everything after it as **the case for a fuller v1.1 worth scoping**, not as something to implement
literally from these mocks. Authorize and Connected (screens 4 and 5) are close enough to the
confirmed PRD that they could inform the real `zapier.svelte` build directly.

One deliberate gap: the "New HubSpot deal → Enroll in course" template
(`zap-templates.html` → `zap-builder.html?template=crm-enroll`) triggers from HubSpot, not
ClassroomIO, so it can't run through this trigger-first wizard. Rather than fake a HubSpot trigger
picker, that template opens a short hand-off screen explaining the Zap starts on HubSpot's side and
ClassroomIO shows up as the action app. That's the honest answer, not an invented one.

## Known prototype-only shortcuts

- All data (grants, usage numbers, sample trigger records, the seeded Zaps list) is hardcoded.
- The App Directory reads `?category=` and `?q=` on load (so links into it can land pre-filtered), but
  filter/sort/"view more" clicks made *after* that don't write back to the URL. A real implementation
  should keep that state, including how far the user has paginated, fully in the query string, the
  same way `prototypes/learner-lifecycle` flags for its own filters.
- The builder's "Test trigger" / "Test action" calls are timed `setTimeout`s, not real requests. The
  "Simulate a failed test" link exists specifically to make the error state reachable.
- `manage-zaps.html`'s row menu just toggles Active and Paused locally; there's no real "Edit in
  Zapier" destination or delete.
- The plan-gate toggle on `index.html` and the org picker on `oauth-consent.html` are UI-only. No real
  plan or multi-org backend supports them. The directory landing's search is real, in the sense that it
  actually filters the live `apps-catalog.js` data client-side; there's no server behind it because
  there's nothing to call.
- The back arrow's `history.back()` behavior depends on real browser history. Opening a page directly
  (typing its URL, or a fresh tab) falls back to the hardcoded `href` instead, which is the right
  previous screen in the flow but won't match a session where the user arrived some other way.
- Third-party app marks are simplified, prototype-only approximations, not official brand assets or
  reproduced logos: a colored monogram, one `.app-badge` shape tinted per app via `color` in
  `apps-catalog.js` and rendered through `ZI.badgeHTML()`, used everywhere an app appears.
