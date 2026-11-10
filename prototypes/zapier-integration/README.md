# Zapier Integration: Prototype

Clickable UX exploration for a V1 Zapier integration. Grounded in the real spec at
[`prd/zapier/README.md`](../../prd/zapier/README.md) and the real sidebar IA in
`apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` (an `Automation` group with
`MCP` / `API` / `Zapier` as sibling items), not a generic Zapier mockup. The entry page is
UX-inspired by Jotform's own integrations directory: structure and interaction pattern only,
adapted to ClassroomIO's design system, never its visuals.

Which apps get built, and which three are featured on `index.html`, is not a design call — it's
answered by [`prd/zapier/integration-research.md`](../../prd/zapier/integration-research.md), a
product research doc that evaluates every candidate integration (including whether payment/billing
apps belong in V1 at all) against ClassroomIO's actual customer education workflows, scores each one,
and ranks them into V1 / V1.5 / V2 / Not Recommended. Read that doc first if you're wondering "why
this app and not that one."

## Current flow

1. `index.html`: Zaps page. Empty state has `Create a Zap` and `Connect Apps`. The non-empty state (`?returning=1`) lists connected apps, each with `View Connection`.
2. `Connect Apps` opens `app-directory.html`. Clicking an app opens `zapier-handoff.html?startApp=<app>`, whose CTA continues to Zapier.
3. `View Connection` opens `zapier-connections.html`, a simulation of [zapier.com/app/assets/connections](https://zapier.com/app/assets/connections). `Create connection` opens the search modal, and choosing an app opens its ClassroomIO + {App} page.

There is no ClassroomIO-hosted consent or connection-management screen in this flow. The older sections below that mention `oauth-consent.html`, `zapier-connected.html` or `app-detail.html` describe the earlier version and are out of date.

| File | What it is |
| --- | --- |
| `index.html` | Screen 1: Zapier's main entry point, and the true start of this prototype. An Empty State by default — no Zaps or connected apps yet, a dashed card with a "Create a Zap" and a "Connect Apps" CTA, styled on the same dashed-empty-state pattern the real dashboard already uses (see Widgets). A prototype-only dev-toggle ("Empty State" / "Non-Empty State") switches to the Non-Empty State: a list of already-connected apps (icon, name, a one-line description of what their Zap does, "View Connection"), plus a "Create More Zaps" CTA. Defaults to whichever state `ziState` reflects, so a real trip through `oauth-consent.html` lands back here already showing Non-Empty |
| `prototype-map.html` | Reviewer-only prototype map, linking out to every screen. Not part of the user flow |
| `app-directory.html` | Screen 2: the full App Directory, reached from `index.html`'s "Connect Apps". Sidebar search and category filters with counts (Jotform layout), Popular/A-Z sort, Popular / Recently added quick filters, and a "View more apps" button that paginates through all 20. Accepts `?category=` and `?q=` to arrive pre-filtered |
| `zapier-handoff.html?startApp=<app>` | Screen 3: the "ClassroomIO + {App}" page. Animated ClassroomIO and app windows joined by a Zapier node, `Continue to Zapier` CTA, triggers and actions tabs, similar apps. Reached from the App Directory and from the simulated Zapier connections page |
| `zapier-connections.html` | Screen 4 (simulated, hosted by Zapier in reality): Zapier's Connections page with the "Add new connection" search modal. Picking an app opens the ClassroomIO + {App} page. Reached from `index.html`'s "View Connection" |
| `automation-overview.html` | Context screen: the org's Automation hub (MCP / API / Zapier cards) inside the real dashboard chrome. Not required to reach Zapier, but one click away from the "Automation" breadcrumb on every Zapier screen |
| `apps-catalog.js` | Shared data: the 20-app catalog (categories, colors, descriptions), the 5 ClassroomIO triggers, the 5 real ClassroomIO actions and 2 searches from the PRD's Action/Search Catalog (`ZI.CLASSROOMIO_ACTIONS` / `ZI.CLASSROOMIO_SEARCHES`), and the `ZI.badgeHTML()` / `ZI.getAction()` helpers every other file renders through. Single source of truth for the App Directory, app-detail pages, the connections page, and `index.html`'s Non-Empty State list |
| `app-theme.css` | Shared theme, copied from `prototypes/learning-paths`. Mirrors `packages/ui/src/index.css` tokens |
| `zapier.css` | Components specific to this prototype (empty/non-empty state cards, directory sidebar/cards, app-detail layout, grant table, connection rows, status dots) |
| `proto.js` | Theme toggle, mobile nav, shared toast, and `ziState`, the localStorage flag for whether the org has authorized Zapier |
| `brand-logos.js` | Hand-built, brand-colored approximations of real product marks (HubSpot, Salesforce, Slack, Zoom, Typeform, Intercom, Zendesk, Customer.io, Calendly, Google Sheets and more) plus a ClassroomIO mark. `ZI.badgeHTML()` uses them wherever an app appears; the apps without a hand-built mark (Pendo, Cal.com, Circle, Google Meet, Confluence, Mixpanel) fall back to a colored monogram, the same as every app in the catalog before this pass |

## Running it

```bash
cd prototypes/zapier-integration && python3 -m http.server 8899
# → http://localhost:8899
```

Opening `index.html` over `file://` also works.

## The flow

ClassroomIO is the connection layer. Zapier is where automation happens.

`index.html` is the org's Zaps page, not a directory preview: **Empty State** (no Zaps yet, "Create a Zap" +
"Connect Apps") or **Non-Empty State** (a list of already-connected apps, each with "View Connection", plus
"Create More Zaps"), switched by a prototype-only dev-toggle and otherwise defaulting to whatever `ziState`
already reflects.

- **New customer:** Empty State → **Connect Apps** → `app-directory.html` → click an app → app detail →
  **Connect** → Authorize (`oauth-consent.html`, unchanged) → **`zapier-handoff.html`**, with that app already
  selected → **Continue to Zapier** (opens https://zapier.com/app/editor in a new tab) to pick the actual
  trigger and action. Empty State's **Create a Zap** button skips straight to the same external editor with no
  app preselected, for someone who already knows what they want to build.
- **Existing customer:** Non-Empty State → **View Connection** on any connected app → straight to
  `zapier-handoff.html` for that app (no re-authorization) → **Continue to Zapier** to manage it there. Or
  **Create More Zaps** → the external editor, same as the empty state's Create a Zap.

`zapier-handoff.html` is the shared destination for both "select an app" and "view an existing connection," and
for every app in the catalog. It is a recreation of a Zapier integration page: Zapier-style top nav, a band with
the ClassroomIO and app logos, "ClassroomIO + {App}" integrations link, a headline and description, a "When this
happens... / automatically do this!" trigger and action pair, the orange CTA, a two-check strip, a "More things
you can do" section with Triggers, Actions, and Triggers & Actions tabs, expandable cards, Try It links, Load
more, and a footer with a breadcrumb and Similar apps. The app comes from `?startApp=`, so one page serves all 20
apps. This is deliberate: ClassroomIO's role is to help a customer discover the right integration and start the
connection; picking the actual trigger and action is Zapier's job, and nothing here reproduces that builder UI. A
green banner confirms the organization is connected and links to the Zapier tab (`zapier-connected.html`), one
hop further for the grants/rate-limits/revoke view. Every fresh Connect still goes through the consent screen;
only `index.html`'s View Connection skips it, since that app is already authorized.

The Zapier tab (`zapier-connected.html`) follows the PRD's dashboard section order rather than a per-app model.
In the PRD a connection is an OAuth grant to a Zapier workspace, and third-party apps like HubSpot are connected
inside Zapier, so the tab shows: the admin and plan gates, a "Connect on Zapier" CTA that links to the shared
private invite URL, the connected Zapier accounts table (scopes, status, last used, connected, per-grant Revoke),
rate limits, the four-step setup guide, and a docs callout. Not authorized yet, it shows "Connect ClassroomIO to
Zapier" with the invite CTA. `?returning=1` marks the org authorized; `?fresh=1` resets to a first-time user.
State is one `localStorage` flag through `ziState` in `proto.js`. The invite URL is an illustrative placeholder in
the shape of Zapier's private invite links.

Nothing in the prototype simulates Zapier's own work. There is no Zap builder, template gallery, trigger or
action picker, field mapping, test step, or Zaps list here. The links to Zapier are `https://zapier.com/app/editor`
(create a Zap) and `https://zapier.com/app/zaps` (manage Zaps). The Trigger and Action cards on the handoff page
are an illustration, not something a user configures.

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
post-connection screen (`zapier-connected.html`) it points to `zapier-connected.html`, so clicking it from anywhere in the flow
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
the theme toggle and mobile nav elsewhere in the prototype, so it looks and behaves the same everywhere.

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
- **The organization access table becomes a labeled stacked card** below 700px
  (`.trow.zi-grant-row`), with a CSS `::before` on each cell supplying an
  "Access" / "Status" style label via `nth-child`, so nothing needed to change in the
  HTML or the JS that renders these rows.
- **Connection cards stack to one column** below 700px, and the "Create a Zap in Zapier" card turns into a
  full-width button so the handoff stays reachable without scrolling sideways.
- **`index.html`'s Empty and Non-Empty State cards stay single-column at every width** — there was never a
  multi-column layout to collapse there, so nothing phone-specific was needed beyond the app shell's own
  sidebar-drawer switch.
- Verified directly: `document.documentElement.scrollWidth` equals `window.innerWidth` (no horizontal
  page overflow) on every screen in this prototype at a 375px viewport.

## Why `index.html` is an empty/non-empty state, not a directory preview

Earlier passes of this prototype opened `index.html` directly into a Jotform-style app directory (search bar,
featured cards). That's now `app-directory.html`'s job exclusively, reached one click away via **Connect
Apps**. `index.html` itself represents what a real "Zapier" tab shows on day one: nothing has been connected
yet. The dashed-card Empty State reuses the same pattern the real dashboard already ships for an empty
collection (see `Widgets`, in the actual ClassroomIO app) rather than inventing a new one — an icon, a
heading, a one-line description, and the CTA(s) that get you unstuck, and nothing else. A prototype-only
dev-toggle in the top bar (styled and labeled the same way as the existing Admin/Member and plan toggles, so
it reads as a testing control rather than a feature) switches to the **Non-Empty State** for reviewing the
"existing customer" path without a second URL.

The three apps shown as already-connected in the Non-Empty State (HubSpot, Zoom, Slack) are the same three
the App Directory features as Popular — the three V1 "must have" integrations identified in
[`prd/zapier/integration-research.md`](../../prd/zapier/integration-research.md), chosen because each
demonstrates a distinct, high-frequency customer education workflow (HubSpot: lifecycle-stage-triggered
enrollment; Zoom: live training/webinar registration; Slack: CS/CE team visibility into learner activity)
rather than a generic B2B automation.

## Why 20 apps, not 78 or 6,000

`apps-catalog.js` used to carry a 78-app sample spanning categories (Finance, HR, Developer Tools) with no
customer-education use case at all, built to prove the App Directory's search/filter/sort/pagination held up
against a real-sized dataset. This pass replaces that sample with the **20 apps** named in the product
research: every one maps to a real customer education workflow for a SaaS company running ClassroomIO, not a
popularity ranking. The App Directory's UI is unchanged — sidebar search, category filters with live counts,
Popular/A-Z sort, "View more apps" pagination — it just now renders real counts against 20 instead of 78
(most categories show 2-4 apps rather than 5+, since curation, not category coverage, is the point now).

Two things still keep the "curated set, not the whole thing" honest:

- Once every app is visible, a closing card (`#dirMore`) says *"That's every app in this sample... Zapier
  connects ClassroomIO to 6,000+ apps in total"* with a link straight into Connect. It only appears at the
  true end of the list.
- Category counts in the sidebar are the **real count of cards in that category**, never inflated.

Every one of the 20 has a real category, a color, a one-line directory description, and a bespoke
`detailBlurb`; all but a handful (Calendly, Cal.com, Google Meet, Confluence — apps whose real Zapier action
set is thin or trigger-only, which their `detailBlurb` says explicitly) also carry a bespoke `action`, so the
"what ClassroomIO can make this app do" story on `app-detail.html` and `zapier-handoff.html` is specific to
that app rather than a generic per-category fallback.

## What's real vs. what this proposes

`prd/zapier/README.md` is the confirmed v1 scope: OAuth 2.0 authorization-code connect flow, a
dashboard page that lists and revokes OAuth grants, and **the actual Zap gets built on zapier.com**.
The dashboard doesn't host a Zap editor or an app directory in v1. That PRD's decisions are reflected
exactly here:

- **Auth is OAuth, not an API-key paste.** `oauth-consent.html` mirrors the PRD's consent-screen spec:
  org picker, `zapier:read` required plus `zapier:write` optional, redirect notice, Authorize/Deny.
- **Plan gating is binary at Early Adopter+.** `index.html`'s dev toggle shows the upgrade callout a
  Basic-plan org would see instead of the empty/non-empty Zaps view, matching the PRD's stated gate.
- **Rate limits and grant counts match `ZAPIER_AUTOMATION_LIMITS_BY_PLAN`** in
  `packages/utils/src/plans/automation.ts`: Basic gets 0 grants (Zapier is off entirely), Early
  Adopter gets 5 grants at 120 reads / 40 writes per minute, Enterprise gets 25 grants at 360 / 120.
  `zapier-connected.html` shows the Early Adopter numbers (1/5 active grants, 120 reads, 40
  writes) since that's the plan the prototype's org is on.
- **The v1 trigger catalog is exactly the PRD's 5 polling triggers:** `new_audience_member`,
  `student_enrolled_in_course`, `course_completed`, `certificate_issued`, `payment_request_created`.
  `exercise_submitted` and `lesson_completed` are deliberately absent; the PRD defers them to v1.1
  because they need webhooks to poll at sane volume.
- **The v1 action catalog is exactly the PRD's 5 real actions:** `enroll_student_in_course`,
  `add_student`, `update_student`, `remove_student`, `tag_student`, all `zapier:write` scoped
  (`ZI.CLASSROOMIO_ACTIONS` in `apps-catalog.js`). Each app-detail page lists them next to the 5 triggers as
  what ClassroomIO offers inside Zapier. They are informational only: choosing and configuring them happens on
  Zapier. `find_student_by_email` and `find_course` (the 2 v1 searches, `ZI.CLASSROOMIO_SEARCHES`) are
  documented in the catalog but not shown, since Zapier generates "Find or Create" steps itself.
- **Revoke is per-grant, from the dashboard.** There's no bulk "Disconnect Zapier" button, matching
  the PRD's stated reasoning that customers manage the integration from Zapier's side day to day.
- **Admin-permission and plan-downgrade gates are both real, toggleable states**, not just the plan
  gate. `index.html` and `zapier-connected.html` each carry an Admin/Member dev-toggle alongside the
  Early Adopter/Basic one: Member replaces the connect flow or the connections table with "you need
  admin access," matching the PRD's Dashboard Zapier Tab section order (admin callout first, plan
  callout second). Basic-plan on the connected page shows the exact PRD downgrade behavior: a toast
  ("all Zapier grants revoked") and a callout explaining the plan-gated failure, not just a blocked
  connect button. `oauth-consent.html` carries the equivalent for the consent screen itself: switching
  to "Signed in as member" removes the org from the picker entirely (PRD: only eligible orgs appear)
  and hides Authorize, leaving only Deny, matching the PRD's manual verification step for a non-admin
  OAuth attempt.

The PRD puts Zap-building on zapier.com in v1, and so does this prototype. Beyond the confirmed v1 scope are the
App Directory, the app-detail pages, and the Zapier-style landing page after authorization. The PRD's flow starts
in Zapier (a private invite link, then OAuth), so a ClassroomIO-initiated flow that begins in an app directory is
a proposal to scope, not something to implement literally. The consent screen and the Zapier tab are the parts
closest to the confirmed PRD.

## Known prototype-only shortcuts

- All data (grants, usage numbers) is hardcoded. Connections are stored in `localStorage`, not on a server.
- The App Directory reads `?category=` and `?q=` on load (so links into it can land pre-filtered), but
  filter/sort/"view more" clicks made *after* that don't write back to the URL. A real implementation
  should keep that state, including how far the user has paginated, fully in the query string, the
  same way `prototypes/learner-lifecycle` flags for its own filters.
- The plan-gate toggle, the Empty/Non-Empty State toggle on `index.html`, and the org picker on
  `oauth-consent.html` are all UI-only. No real plan, Zap-count, or multi-org backend supports them.
  `app-directory.html`'s search is real, in the sense that it actually filters the live `apps-catalog.js`
  data client-side; there's no server behind it because there's nothing to call.
- The back arrow's `history.back()` behavior depends on real browser history. Opening a page directly
  (typing its URL, or a fresh tab) falls back to the hardcoded `href` instead, which is the right
  previous screen in the flow but won't match a session where the user arrived some other way.
- Third-party app marks are simplified, hand-built approximations in `brand-logos.js`, not official brand
  assets, so none of them should ship. Apps without a mark fall back to a colored monogram. The ClassroomIO
  mark is also an approximation.
- The Create a Zap and Manage Zaps links open https://zapier.com/app/editor and https://zapier.com/app/zaps,
  which need a Zapier login. The private app is not published, so ClassroomIO won't appear in Zapier yet.
- The redirect URI shown on `oauth-consent.html` (`zapier.com/dashboard/auth/oauth/return/...`) is an
  illustrative example of Zapier's real callback URL shape, not a live one; the PRD leaves the actual
  value to `ZAPIER_OAUTH_REDIRECT_URIS`.
- The write-scope toggle on `oauth-consent.html` does affect the resulting connection (it flows through
  as `?scope=read` and flips the Access badge on `zapier-connected.html` to "Read only"), but there's no
  real scope enforcement behind it. A live `zapier:write` scope 403ing on write endpoints, per the PRD's
  manual verification step 5, needs a real API to test against.
