# Zapier Integration: Prototype

Clickable UX exploration for the Zapier integration. Grounded in the real spec at
[`prd/zapier/README.md`](../../prd/zapier/README.md) and the real sidebar IA in
`apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` (an `Automation` group with
`MCP` / `API` / `Zapier` as sibling items), not a generic Zapier mockup. The entry page is
UX-inspired by Jotform's own integrations directory: structure and interaction pattern only,
adapted to ClassroomIO's design system, never its visuals.

Which apps get built, and which three are featured on `index.html`, is not a design call. Each
candidate was judged against ClassroomIO's actual customer education workflows (payment and billing
apps are out of v1 entirely) and ranked; the result is the 20 apps in `apps-catalog.js`.

## Current flow

1. `index.html`: the org's Zaps page, inside the real dashboard chrome. An Empty State by default —
   no Zaps or connected apps yet, with `Create a Zap` and `Connect Apps`. A prototype-only dev-toggle
   switches to the Non-Empty State: the apps already connected, each with `View Connection`.
   `?fresh=1` and `?returning=1` open either state directly.
2. `Connect Apps` opens `app-directory.html`. Clicking an app opens
   `zapier-handoff.html?startApp=<app>`, a Zapier-styled "ClassroomIO + {App}" page whose CTA
   continues to Zapier's Zap editor.
3. `View Connection` opens `zapier-connections.html`, a simulation of
   [zapier.com/app/assets/connections](https://zapier.com/app/assets/connections). `Create
   connection` opens the search modal, and choosing an app opens the same ClassroomIO + {App} page.
4. `automation-overview.html` is the org's Automation hub (MCP / API / Zapier), one click from the
   `Automation` breadcrumb on every dashboard screen. `prototype-map.html` is a reviewer-only index
   of every screen.

The ClassroomIO-hosted consent screen and workspace picker are not reproduced here. The prototype
starts after authorization, so `zapier-handoff.html` opens with the org already connected, and the
only place connections are managed is Zapier's own Connections page (simulated). `index.html` only
shows whether the org has connected apps, not a grants table.

| File | What it is |
| --- | --- |
| `index.html` | Screen 1: the Zaps page, and the start of this prototype. An Empty State by default — no Zaps or connected apps yet, a dashed card with `Create a Zap` and `Connect Apps`, styled on the same dashed-empty-state pattern the real dashboard already uses (see Widgets). A prototype-only dev-toggle (`Empty State` / `Non-Empty State`) switches to the Non-Empty State: the apps already connected (icon, name, a one-line description of what their Zap does, `View Connection`), plus a `Create More Zaps` CTA in the header. Defaults to Empty; `?fresh=1` / `?returning=1` set the state directly |
| `prototype-map.html` | Reviewer-only prototype map, linking out to every screen. Not part of the user flow |
| `app-directory.html` | Screen 2: the full App Directory, reached from `index.html`'s `Connect Apps`. Sidebar search and category filters with counts (Jotform layout), Popular/A-Z sort, and a `View more apps` button that paginates through all 20. Accepts `?category=` and `?q=` to arrive pre-filtered |
| `zapier-handoff.html?startApp=<app>` | Screen 3: the "ClassroomIO + {App}" page, styled as Zapier's own integration page rather than ClassroomIO's dashboard. Hero with a live trigger → Zap → action preview, `Connect {App} in Zapier` CTA, a connected banner, a trust strip, Triggers / Actions / Triggers & Actions tabs, Load more, and a footer with breadcrumbs and Similar apps. Reached from the App Directory and from the simulated Zapier connections page. `?scope=read` renders the read-only variants of the banner and trust strip |
| `zapier-connections.html` | Screen 4 (a simulation of a page Zapier hosts in reality): Zapier's App connections list and the `Add new connection` search modal. Picking an app opens the ClassroomIO + {App} page. Reached from `index.html`'s `View Connection`; a banner links back to `index.html?returning=1` |
| `automation-overview.html` | Context screen: the org's Automation hub (MCP / API / Zapier cards) inside the real dashboard chrome. Not required to reach Zapier, but one click away from the `Automation` breadcrumb |
| `apps-catalog.js` | Shared data: the 20-app catalog (categories, colors, descriptions, per-app action blurbs), the `ZI.TRIGGERS` catalog, the ClassroomIO actions and searches (`ZI.CLASSROOMIO_ACTIONS` / `ZI.CLASSROOMIO_SEARCHES`), and the `ZI.badgeHTML()` / `ZI.getAction()` helpers every other file renders through. Single source of truth for the App Directory, the handoff page, the connections page, and `index.html`'s Non-Empty State list |
| `app-theme.css` | Shared theme, copied from `prototypes/learning-paths`. Mirrors `packages/ui/src/index.css` tokens |
| `zapier.css` | Components specific to this prototype (empty/non-empty state cards, directory sidebar/cards, handoff page, the simulated connections page) |
| `proto.js` | Theme toggle, mobile nav, a shared toast, and `ziState`, the localStorage flag behind `?fresh=1` / `?returning=1` |
| `brand-logos.js` | Real product marks for every app in the catalog plus ClassroomIO and Zapier, loaded from `logos/` (public brand icon sets or the vendor's own site, cropped to the icon where the source is a wordmark). `ZI.badgeHTML()` uses them wherever an app appears |
| `logos/` | One SVG (plus Jotform's PNG) per app in the catalog, plus ClassroomIO and Zapier |

## Running it

```bash
cd prototypes/zapier-integration && python3 -m http.server 8899
# → http://localhost:8899
```

Opening `index.html` over `file://` also works.

## The flow

ClassroomIO is the connection layer. Zapier is where automation happens.

`index.html` is the org's Zaps page, not a directory preview: **Empty State** (no Zaps yet, `Create a Zap` +
`Connect Apps`) or **Non-Empty State** (the apps already connected, each with `View Connection`, plus
`Create More Zaps`), switched by a prototype-only dev-toggle and otherwise defaulting to whatever
`ziState` already reflects.

- **New customer:** Empty State → **Connect Apps** → `app-directory.html` → click an app →
  `zapier-handoff.html` with that app already selected → **Connect {App} in Zapier** (opens
  https://zapier.com/app/editor in a new tab) to pick the actual trigger and action. Empty State's
  **Create a Zap** button skips straight to the same external editor with no app preselected, for
  someone who already knows what they want to build.
- **Existing customer:** Non-Empty State → **View Connection** on any connected app → Zapier's
  connections page (simulated) → open a connection or pick a new app → `zapier-handoff.html` →
  **Connect {App} in Zapier**. Or **Create More Zaps** → the external editor, same as the empty
  state's Create a Zap.

`zapier-handoff.html` is the shared destination for every app in the catalog. It is a recreation of
a Zapier integration page: Zapier-style top nav, a hero with the ClassroomIO and app logos joined by
a Zapier node, a headline and description, an animated source → Zapier → destination preview, the
orange CTA, a `connected` banner with links back to `index.html?returning=1` and to Zapier's real
connections page, a three-item trust strip (scope, revoke anytime, Zaps live in Zapier), a "More
things you can do" section with Triggers, Actions, and Triggers & Actions tabs, expandable cards,
Try It links, Load more, and a footer with a breadcrumb and Similar apps. The app comes from
`?startApp=`, so one page serves all 20 apps. This is deliberate: ClassroomIO's role is to help a
customer discover the right integration and start the connection; picking the actual trigger and
action is Zapier's job, and nothing here reproduces that builder UI.

`zapier-connections.html` is the other half of the handoff: a static recreation of Zapier's App
connections page (Zapier's own nav and sidebars, a connections table, and the `Add new connection`
modal) with a prototype banner that links back to `index.html?returning=1`. It exists to show the
intended redirect: choosing an app in Zapier leads to the ClassroomIO + {App} page, not to a
ClassroomIO-hosted grants table.

Nothing in the prototype simulates Zapier's own work. There is no Zap builder, template gallery,
trigger or action picker, field mapping, test step, or Zaps list here. The links to Zapier are
`https://zapier.com/app/editor` (create a Zap), `https://zapier.com/app/zaps` (manage Zaps), and
`https://zapier.com/app/assets/connections` (manage connections, from the handoff banner). The
Trigger and Action cards on the handoff page are an illustration, not something a user configures.

## Sidebar: shown inside the real dashboard, not as a standalone product

The ClassroomIO screens in this flow (`index.html`, `app-directory.html`, `automation-overview.html`)
render inside the actual dashboard chrome: the same `<aside class="sidebar">` a signed-in admin sees,
not a Zapier-only shell. This is deliberate. The point isn't to show feature screens in isolation,
it's to show stakeholders exactly where the feature lives inside the product and how a user gets to
it. `zapier-handoff.html` and `zapier-connections.html` deliberately drop that chrome for Zapier's
own navigation, because they represent leaving ClassroomIO for Zapier.

The sidebar structure matches the real navigation IA
(`apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`): `Dashboard`, `Stats`, and
`Setup` as top-level items, then grouped sections for `Content` (Courses, Cohorts, Media, Tags,
Widgets), `People` (Community, Audience), and `Automation` (MCP, API, Zapier), followed by
`Settings` and the signed-in user's profile pinned to the bottom. `Zapier` is the only working link
in this sidebar (every other item points to `#`, since this prototype is scoped to the Zapier flow,
not a full dashboard clone), it points at `index.html`, and it's marked active on every ClassroomIO
screen in this flow.

The `Automation` breadcrumb above `Zapier` points to `automation-overview.html`, the hub screen
showing MCP, API, and Zapier as sibling cards; its Zapier card's `Connect` button comes back to
`index.html`.

## Back navigation

`app-directory.html` and `zapier-handoff.html` each carry a back arrow icon button at the start of
the top bar, to the left of the breadcrumb or nav links. It calls `history.back()` when there's
history to go back to, and falls back to a sensible previous screen in the flow otherwise
(`app-directory.html` → `index.html`, `zapier-handoff.html` → `app-directory.html`). This is the
same `icon-btn` component used for the theme toggle and mobile nav elsewhere in the prototype, so it
looks and behaves the same everywhere.

`index.html` is the entry point and has no previous step. `automation-overview.html` is a context
screen reached from the breadcrumb rather than a step in the flow. `prototype-map.html` is a
reviewer page. `zapier-connections.html` is a Zapier surface, so it uses Zapier's own chrome and a
`Back to ClassroomIO` banner instead of a back arrow.

## Mobile

The ClassroomIO screens (`index.html`, `app-directory.html`, `automation-overview.html`) inherit the
app shell's sidebar-drawer and single-column switch at 860px from `app-theme.css`, with phone-specific
fine-tuning (headings, padding, touch targets) in `zapier.css`'s "MOBILE" section. `zapier-handoff.html`
drops Zapier's nav links and stacks its hero preview below 860px, then tightens the tabs below 640px. A few
adaptations that aren't just "make it one column":

- **Breadcrumbs collapse to the current page only** below 860px (`.crumbs > *:not(:last-child)` is
  hidden), and the "Prototype map" reviewer link drops out first, since a hamburger, a back arrow, a
  multi-segment breadcrumb, and top actions don't fit one 56px bar on a phone. The page's own `<h1>`
  still carries the context.
- **The App Directory's sidebar becomes a collapsible "Filters" drawer** (`#filterPanel` in
  `app-directory.html`), not a long wall of category buttons sitting above the app grid. It's closed
  by default, shows a badge when a filter is active, and auto-closes itself the moment a category is
  picked so the user lands straight on the filtered results. Search stays outside the drawer, always
  visible.
- **The handoff page's preview stage stacks** the two app windows and the Zapier bridge into one
  column, so the animation is readable without horizontal scrolling.

`zapier-connections.html` is a desktop-width simulation of Zapier's own page (its three-column shell
has no mobile breakpoints), so review it at desktop width. It is reference material for the redirect,
not a ClassroomIO screen that needs a phone layout.

## Why `index.html` is an empty/non-empty state, not a directory preview

Earlier passes of this prototype opened `index.html` directly into a Jotform-style app directory (search bar,
featured cards). That's now `app-directory.html`'s job exclusively, reached one click away via **Connect
Apps**. `index.html` itself represents what a real "Zapier" tab shows on day one: nothing has been connected
yet. The dashed-card Empty State reuses the same pattern the real dashboard already ships for an empty
collection (see `Widgets`, in the actual ClassroomIO app) rather than inventing a new one — an icon, a
heading, a one-line description, and the CTA(s) that get you unstuck, and nothing else. A prototype-only
dev-toggle in the top bar (styled and labeled the same way as the plan toggle beside it, so it reads as a
testing control rather than a feature) switches to the **Non-Empty State** for reviewing the
"existing customer" path without a second URL.

The three apps shown as already-connected in the Non-Empty State (HubSpot, Slack, Zoom) are the same three
the App Directory features as Popular — the three v1 "must have" integrations, chosen because each
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
  connects ClassroomIO to 6,000+ apps in total"* with a link straight into Zapier. It only appears at the
  true end of the list.
- Category counts in the sidebar are the **real count of cards in that category**, never inflated.

Every one of the 20 has a real category, a color, a one-line directory description, and a bespoke
`detailBlurb`; all but a handful (Calendly, Cal.com, Google Meet, Confluence — apps whose real Zapier action
set is thin or trigger-only, which their `detailBlurb` says explicitly) also carry a bespoke `action`, so the
"what ClassroomIO can make this app do" story on `zapier-handoff.html` is specific to that app rather than a
generic per-category fallback.

## What's real vs. what this proposes

`prd/zapier/README.md` is the confirmed v1 scope: an App Directory and ClassroomIO + {App} pages in the
dashboard, a ClassroomIO-hosted consent screen and workspace picker, a Zaps page that lists and revokes
connections, and **the actual Zap built on zapier.com**. These are the parts the prototype is drawn against:

- **Plan gating is binary at Early Adopter+.** `index.html`'s dev toggle shows the upgrade callout a
  Basic-plan org would see instead of the empty/non-empty Zaps view, matching the PRD's stated gate.
- **The limits come from the PRD's Access and Limits table:** Basic has no Zapier, Early Adopter gets
  50 trigger subscriptions at 120 reads / 40 writes per minute, Enterprise 250 at 360 / 120. The
  prototype draws the Early Adopter state.
- **The trigger and action catalog is data, not markup.** `ZI.TRIGGERS`, `ZI.CLASSROOMIO_ACTIONS` and
  `ZI.CLASSROOMIO_SEARCHES` in `apps-catalog.js` currently carry five triggers, five actions and two
  searches; `zapier-handoff.html` renders whatever those objects contain, so bringing the prototype up
  to the PRD's full 14-trigger / 11-action catalog is a data change. The two searches
  (`find_student_by_email`, `find_course`) are documented in the catalog but not shown as
  independent steps, since Zapier generates "Find or Create" steps itself.
- **Nothing here builds the Zap.** The PRD puts Zaps, triggers, actions and field mapping on
  zapier.com, and so does this prototype: the CTA opens Zapier's editor, and the cards below it are
  informational.
- **Consent, workspace selection, connection management, revoke and failed-event resend are out of
  scope here.** The PRD puts them on ClassroomIO's `/oauth/*` screens and the Zaps page; this
  prototype starts after authorization and only simulates Zapier's own connections page, so it never
  claims to show those ClassroomIO screens.

The PRD's discovery path now matches this prototype's: Automation → Zapier → Explore apps → App Directory
→ ClassroomIO + {App} → Zapier. The visible difference is chrome: the PRD renders the ClassroomIO + {App}
page inside the dashboard, while this prototype gives it Zapier's own navigation to make the handoff out of
ClassroomIO legible. Consent, workspace selection, the connection list and failed-event resend exist in the
PRD but are not reproduced here, so the prototype should not be read as covering them.

## Known prototype-only shortcuts

- All data (connections, usage numbers) is hardcoded. The only persisted state is the
  `ziState` flag behind `?fresh=1` / `?returning=1`, in `localStorage`.
- The App Directory reads `?category=` and `?q=` on load (so links into it can land pre-filtered), but
  filter/sort/"view more" clicks made *after* that don't write back to the URL. A real implementation
  should keep that state, including how far the user has paginated, fully in the query string, the
  same way `prototypes/learner-lifecycle` flags for its own filters.
- The plan-gate toggle and the Empty/Non-Empty State toggle on `index.html` are UI-only. No real plan
  or Zap-count backend supports them. `app-directory.html`'s search is real, in the sense that it
  actually filters the live `apps-catalog.js` data client-side; there's no server behind it because
  there's nothing to call.
- The back arrow's `history.back()` behavior depends on real browser history. Opening a page directly
  (typing its URL, or a fresh tab) falls back to the hardcoded `href` instead, which is the right
  previous screen in the flow but won't match a session where the user arrived some other way.
- Third-party app marks in `logos/` are public brand assets used for a prototype only, not approved
  press-kit files, so none of them should ship as-is. The ClassroomIO mark is also an approximation.
- The Create a Zap and Manage Zaps links open https://zapier.com/app/editor and
  https://zapier.com/app/zaps, which need a Zapier login. The private app is not published, so
  ClassroomIO won't appear in Zapier yet.
- `zapier-handoff.html` accepts `?scope=read` to render the read-only banner and trust strip, but
  nothing enforces scopes; a live `zapier:write` scope 403ing on write endpoints needs a real API to
  test against.
- `zapier-connections.html` is a visual simulation of Zapier's connections page, not a real Zapier
  integration: the search modal filters the local catalog and the table is static.
