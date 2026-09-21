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

| File | What it is |
| --- | --- |
| `index.html` | Screen 1: Zapier's main entry point, and the true start of this prototype. Opens directly into a Jotform-style directory landing: a heading, a functional search bar that filters the full 78-app catalog live, the three most popular integrations, and an "Add integration" CTA. No separate landing/welcome screen before it. Both the "Browse all apps" link near the search bar and the "View more apps" button under the popular integrations lead to the full App Directory |
| `prototype-map.html` | Reviewer-only prototype map, linking out to every screen. Not part of the user flow |
| `app-directory.html` | Screen 2: the full App Directory, reached from `index.html`. Sidebar search and category filters with counts (Jotform layout), Popular/A-Z sort, Popular / Recently added quick filters, and a "View more apps" button that paginates through all 78. Accepts `?category=` and `?q=` to arrive pre-filtered |
| `app-detail.html` | Screen 3: Per-app "ClassroomIO + {App}" page. What it enables, every ClassroomIO trigger, an example action, Connect CTA |
| `oauth-consent.html` | Screen 4: Authorize screen. Org picker, read/write scopes, Authorize / Deny |
| `zapier-handoff.html` | Screen 5: the page Authorize lands on, recreating a Zapier integration page for "ClassroomIO + {App}" with a "Continue to Zapier" CTA. Dynamic via `?startApp=` |
| `zapier-connected.html` | Screen 6: the Zapier tab, per the PRD's dashboard section list. Admin and plan gates, "Connect on Zapier" (private invite) and "Create a Zap in Zapier" CTAs, connected Zapier accounts table with per-grant Revoke, rate limits, setup guide, docs callout. `?returning=1` and `?fresh=1` set the demo state |
| `automation-overview.html` | Context screen: the org's Automation hub (MCP / API / Zapier cards) inside the real dashboard chrome. Not required to reach Zapier, but one click away from the "Automation" breadcrumb on every Zapier screen |
| `apps-catalog.js` | Shared data: the 78-app catalog (categories, colors, descriptions), the 5 ClassroomIO triggers, the 5 real ClassroomIO actions and 2 searches from the PRD's Action/Search Catalog (`ZI.CLASSROOMIO_ACTIONS` / `ZI.CLASSROOMIO_SEARCHES`), and the `ZI.badgeHTML()` helper every other file renders through. Single source of truth for the directory landing, the full App Directory, app-detail pages, and the connections page. Per-app `action` data and `ZI.getAction()` are left over from the removed builder and no longer used |
| `app-theme.css` | Shared theme, copied from `prototypes/learning-paths`. Mirrors `packages/ui/src/index.css` tokens |
| `zapier.css` | Components specific to this prototype (directory landing hero/search bar, popular-app cards, directory sidebar/cards, app-detail layout, grant table, picker cards, field mapping, wizard stepper, status dots) |
| `proto.js` | Theme toggle, mobile nav, shared toast, and `ziState`, the localStorage flag for whether the org has authorized Zapier |
| `brand-logos.js` | Hand-built, brand-colored approximations of real product marks (HubSpot, Salesforce, Slack, Zoom, Typeform, Intercom, Zendesk, Customer.io, Calendly, Google Sheets and more) plus a ClassroomIO mark. `ZI.badgeHTML()` uses them wherever an app appears |

## Running it

```bash
cd prototypes/zapier-integration && python3 -m http.server 8899
# → http://localhost:8899
```

Opening `index.html` over `file://` also works.

## The flow

ClassroomIO is the connection layer. Zapier is where automation happens.

App Directory (`index.html`, `app-directory.html`) → click an app → app detail → **Connect** → Authorize
(`oauth-consent.html`, unchanged) → **`zapier-handoff.html`** → **Continue to Zapier** (opens
https://zapier.com/app/editor in a new tab).

`zapier-handoff.html` is the destination after authorization, for every app. It is a recreation of a Zapier
integration page: Zapier-style top nav, a band with the ClassroomIO and app logos, "ClassroomIO + {App}"
integrations link, a headline and description, a "When this happens... / automatically do this!" trigger and
action pair, the orange CTA, a two-check strip, a "More things you can do" section with Triggers, Actions, and
Triggers & Actions tabs, expandable cards, Try It links, Load more, and a footer with a breadcrumb and Similar
apps. The app comes from `?startApp=`, so one page serves all 78 apps. A green banner confirms the organization
is connected and links to the Zapier tab (`zapier-connected.html`). Every Connect goes through the consent
screen.

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
- **The directory landing's search bar and popular-app cards stack to one column** below 640px, with
  the search pill going full width and the "Add integration" button stretching to match, instead of
  shrinking a three-column grid down until the text is unreadable.
- Verified directly: `document.documentElement.scrollWidth` equals `window.innerWidth` (no horizontal
  page overflow) on every screen in this prototype at a 375px viewport.

## Why the App Directory is the entry page, and why 78 apps, not 6,000

The brief asked for Zapier to open directly into an app directory, feeling like a native app
ecosystem rather than a settings page with one "Connect" button and a separate marketing screen in
front of it. `index.html` is modeled closely on **Jotform's own integrations directory**: a short
heading and subheading, a prominent search bar, and a small number of featured integration cards each
carrying a category ribbon, an icon, and a short description, rather than a long list. The structure
is reused closely; none of the visuals are. Every section is built from ClassroomIO's own tokens,
cards, badges, and form controls, the same as the rest of `prototypes/`.

The directory landing deliberately shows only **three integrations** (HubSpot, Zoom, Slack), not a
long grid, so the page reads as curated rather than overwhelming. These three are not simply the most
famous Zapier apps — they're the three V1 "must have" integrations identified in
[`prd/zapier/integration-research.md`](../../prd/zapier/integration-research.md), chosen because each
demonstrates a distinct, high-frequency customer education workflow (HubSpot: lifecycle-stage-triggered
enrollment; Zoom: live training/webinar registration; Slack: CS/CE team visibility into learner
activity) rather than a generic B2B automation. Stripe and Google Sheets, the two apps this slot
previously showed, remain in the full catalog (Stripe scored V1.5 in the research — real but secondary
to CRM-driven enrollment; Sheets is a genuine V1 pick but a weaker "this is a customer education
platform" first impression than a live-training or CRM workflow) and are reachable through search or
the full directory. Anyone who wants to look further has two ways in, both real: typing in the search
bar filters live across the full 78-app catalog and replaces the three cards with matching results
(with an honest empty state when nothing matches), or the "Browse all apps" link leads to the full
`app-directory.html` (sidebar search, category filters with live counts, sort, pagination) for anyone
who wants to scroll rather than search.

Representing all 6,000+ real Zapier apps isn't useful or buildable as a static prototype, and the
brief explicitly said not to try. `apps-catalog.js` defines **78 real, named apps** spread across the
15 categories Zapier actually organizes by (CRM, Marketing, Communication, Customer Support, Sales,
Productivity, Project Management, Forms & Surveys, Analytics, Email, Storage, Finance, Developer
Tools, Payments, HR), with **at least 5 apps in every category** so clicking any category in the
sidebar always shows a populated list, never an empty one. That's enough to prove the directory's
search, filter, sort, and pagination patterns hold up against a real-sized dataset, without
hand-building thousands of cards. The full App Directory shows 18 at a time and a **working "View
more apps" button** reveals the next 18 (not a placeholder: click it in `app-directory.html` and the
grid actually grows) until all 78 are visible. Two things keep the "sample, not the whole thing"
honest instead of implying a false ceiling:

- Once every local app is visible, a closing card (`#dirMore`) says *"That's every app in this
  sample... Zapier connects ClassroomIO to 6,000+ apps in total"* with a link straight into Connect.
  It only appears at the true end of the list, not underneath a "View more apps" button that still
  has more to give.
- Category counts in the sidebar are the **real count of cards in that category**, not an inflated
  number, unlike Jotform's reference screenshot (`CRM 182`), which would be a lie against this
  dataset.

Every app has a real category, a color, and a one-line directory description, and roughly 30 keep a bespoke
`detailBlurb`. Every app can be connected the same way, so adding an app to the catalog never needs new UI.

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
- The plan-gate toggle on `index.html` and the org picker on `oauth-consent.html` are UI-only. No real
  plan or multi-org backend supports them. The directory landing's search is real, in the sense that it
  actually filters the live `apps-catalog.js` data client-side; there's no server behind it because
  there's nothing to call.
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
