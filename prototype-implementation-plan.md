# Zapier prototype implementation plan

How to build every surface in the Zapier prototype into the dashboard, using the app's own components and
patterns. Written so any agent can pick up a phase and finish it without reading the conversation that
produced it.

- **Prototype (UX source of truth):** `prototypes/zapier-integration/` on branch
  `feat/zapier-prototype-connections-flow` ([classroomio/classroomio#1455](https://github.com/classroomio/classroomio/pull/1455)).
  The copy of that folder on `main` and on `feats/zapier-integration` is an older 78-app version. Do not
  build from it. Read the files with `git show origin/feat/zapier-prototype-connections-flow:prototypes/zapier-integration/<file>`.
- **Code base:** branch `feats/zapier-integration`. It already has the Zapier app (`apps/zapier`), the OAuth
  provider, webhook subscriptions (instant triggers), and a first dashboard Zapier tab. This plan extends that
  work; it does not start over.
- **Product spec:** [`prd/zapier/README.md`](prd/zapier/README.md).
- **Date of the Zapier facts below:** 2026-11-03. Re-check anything marked _unverified_ before relying on it.

## Contents

1. [Read first](#1-read-first)
2. [What Zapier allows, tested](#2-what-zapier-allows-tested)
3. [The flag](#3-the-flag-public_zapier_listing)
4. [Invite-first flow while private](#4-invite-first-flow-while-private)
5. [Target screens and routes](#5-target-screens-and-routes)
6. [Shared app catalog and recipes](#6-shared-app-catalog-and-recipes)
7. [Phases](#7-phases)
8. [Comes with live publish](#8-comes-with-live-publish)
9. [Never build](#9-never-build)
10. [Copy corrections against the prototype](#10-copy-corrections-against-the-prototype)
11. [Verification](#11-verification)
12. [Go-live and flag removal](#12-go-live-and-flag-removal)
13. [Open questions](#13-open-questions)

---

## 1. Read first

| Read | Why |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Route/service/query layering, frontend types, translations, `$effect` rules, org-scoped loading, skeletons, dialog buttons, `ScrollToTop`, `testId`, migrations |
| [`skills/writing-code/SKILL.md`](skills/writing-code/SKILL.md) | Mandatory comment policy |
| [`skills/classroomio-design/SKILL.md`](skills/classroomio-design/SKILL.md) | Tokens, components, voice. The prototype is a layout reference, not a visual spec |
| [`skills/public-api-review/SKILL.md`](skills/public-api-review/SKILL.md) | Security review for the new org routes that hold Zapier tokens |
| [`skills/add-docs-image/SKILL.md`](skills/add-docs-image/SKILL.md) | Only if you add Help Center pages or screenshots |
| `packages/ui/README.md` | `Page`, `Empty`, `Item`, `Card`, `Sheet`, `Dialog`, `ToggleGroup`, `Tabs`, `UnderlineTabs`, `BackButton`, `Search`, `Breadcrumb` |

House rules that matter most here:

- Do not run the dashboard vite build. Verify dashboard work with `svelte-check` (compare against a baseline;
  the repo has pre-existing errors) and targeted `vitest` runs. API and package builds are fine.
- All copy goes in `apps/dashboard/src/lib/utils/translations/en.json`, then `cd apps/dashboard && pnpm translate`.
- Dashboard types live in `lib/features/automation/utils/types.ts` and are inferred from the RPC client. Never
  import from `@cio/db/queries` in the dashboard and never define types in `.svelte.ts` files.
- One migration per PR. Fold the new table into the migration this branch already adds and check its `when`
  against `main` (CLAUDE.md, "Database migrations").
- Never commit agent attribution.

## 2. What Zapier allows, tested

Tested on 2026-11-03 by the integration owner, against private integration `249044` ("ClassroomIO Local",
version 1.0.1).

### Works now (private)

**Pre-filled Zap links.** This URL opens Zapier's editor with both steps chosen, and with the user's existing
ClassroomIO connection selected:

```
https://zapier.com/webintent/create-zap
  ?steps[0][app]=App249044CLIAPI@latest&steps[0][action]=course_completed&steps[0][type]=read
  &steps[1][app]=SlackCLIAPI@latest&steps[1][action]=channel_message&steps[1][type]=write
```

| Test | Result |
| --- | --- |
| ClassroomIO `course_completed` → Slack `channel_message` | Both steps pre-filled, account auto-selected |
| Calendly `invitee_created` → ClassroomIO `enroll_student` | Both steps pre-filled |
| ClassroomIO `new_course_enrollment` → `SlackAPI` | Works, but `SlackAPI` is "Slack (Deprecated)". Use `SlackCLIAPI` |
| App key with `@latest` | Resolves to the current version (1.0.1) |
| App key with no version (`App249044CLIAPI`) | "This version is no longer available." Always append `@latest` |
| Third-party key with no version (`SlackCLIAPI`) | "Deleted app". Always append `@latest` |
| Documented embed URL for our app (`api.zapier.com/v1/embed/App249044/create`) | **404** |
| Documented embed URL for a public app (`api.zapier.com/v1/embed/calendly/create`) | **302** to the `webintent` URL above |

The `webintent` URL is what Zapier's documented embed URL redirects to. It is not itself documented, so the
builder in Phase 1 uses it only while private and switches to the documented URL once public.

**Invite link.** Developer Platform → Manage → Sharing gives a link of the form
`https://zapier.com/developer/public-invite/249044/<token>/`. Anyone who opens it can use the private
integration. This is `PUBLIC_ZAPIER_CONNECT_URL`.

**App and action keys** are visible on each app's public page (`https://zapier.com/apps/<slug>/integrations`,
in the `__NEXT_DATA__` JSON: `selectedApi`, and `AppImplementationAction` entries with `type`, `label`, `key`).
Use this once, at development time, to fill the catalog in section 6. Never fetch it at runtime.

### Blocked until Zapier configures an OAuth application for us

Everything that needs the Workflow API or the Workflow Element:

| Check | Result |
| --- | --- |
| Embed → Settings → Credentials | Client ID box shows "Failed to load OAuth app data". The page's own request (`zapier.com/api/v4/oauth/applications/?service_slug=…`) returns **404 "Requested OAuth service does not exist"** |
| Embed → Settings → Redirect URIs / Embedding Domains | "Contact us to configure your OAuth application… Email partner support" (`mailto:partners@zapier.com`) |
| `GET api.zapier.com/v2/apps` without credentials | 403 |
| `GET /v2/apps?client_id=<our ZAPIER_OAUTH_CLIENT_ID>` | 403 `ClientIDInvalidError`. That ID is the one Zapier uses to sign in to us; it is not a Zapier client ID |
| Zapier docs, "User access token authentication" | "Your application's Client ID and Client Secret are only available after you've published your app as a public integration." Same for redirect URIs |

So the Zaps list, connections, Zapier profile, app logos from Zapier, and templates come with live publish,
unless partner support agrees to configure the OAuth app earlier (section 13).

### Unverified

- What a Zapier user who has **not** accepted the invite sees on a pre-filled link for our private app. Expected:
  the ClassroomIO step fails to load. Test with a second Zapier account before Phase 6 ships.
- Whether the invite link accepts a redirect parameter. Assume it does not.
- Workflow API response shapes. Build against the docs (`/v2/zaps`, `/v2/authentications`, `/v2/apps`,
  `/v1/profiles/me`) and re-record fixtures when credentials exist.

## 3. The flag: `PUBLIC_ZAPIER_LISTING`

One flag decides everything that differs between "private" and "live". It already exists in
`apps/dashboard/.env.example` (`PUBLIC_ZAPIER_LISTING=private`). Do not add a second flag.

| Value | Meaning |
| --- | --- |
| `private` (default) | Integration is invite-only. Live-publish features render **Coming soon**. Every link into Zapier goes through the invite-first flow (section 4). Pre-filled links use `webintent` |
| `public` | Integration is listed, Workflow API credentials are configured, and the live features have been tested. Coming-soon states and the invite step disappear. Pre-filled links use the documented embed URL |

Rules:

- Read it in exactly one place: `isZapierLive()` in `lib/features/automation/utils/zapier-utils.ts`. Every
  component asks that helper. This keeps removal to one search.
- The live features are fully implemented (API, service, query, API class, components) and covered by tests.
  Only the dashboard decides whether to show them. With the flag at `private` the dashboard never calls the
  Workflow API routes.
- The API does not read the dashboard flag. Its Zapier Workflow API routes fail closed with
  `ZAPIER_EMBED_NOT_CONFIGURED` when `ZAPIER_EMBED_CLIENT_ID` or `ZAPIER_EMBED_CLIENT_SECRET` is unset.
- "Coming soon" is one component, `zapier-coming-soon.svelte` (an `Empty` with a `Badge`), used everywhere a
  live feature would render. It takes a title and description key; it has no logic.

Environment variables touched by this plan:

| App | Variable | Notes |
| --- | --- | --- |
| dashboard | `PUBLIC_ZAPIER_LISTING` | The flag |
| dashboard | `PUBLIC_ZAPIER_CONNECT_URL` | Invite link. Private only |
| dashboard | `PUBLIC_ZAPIER_APP_KEY` | Our app key without a version, for example `App249044CLIAPI`. The builder appends `@latest`. Staging and production integrations have different keys |
| dashboard | `PUBLIC_ZAPIER_APP_SLUG` | New. Our public Zapier app slug for the documented embed URL. Empty until public |
| api | `ZAPIER_EMBED_CLIENT_ID`, `ZAPIER_EMBED_CLIENT_SECRET` | New. From Embed → Settings → Credentials |
| api | `ZAPIER_EMBED_REDIRECT_URI` | New. Must exactly match a redirect URI registered in Embed → Settings |

Add each new variable to the matching `.env.example` and to the env schema in `@cio/core/config/env`.

## 4. Invite-first flow while private

**Recommendation: yes, route every user through the invite link until the integration is public.** A private
integration does not exist in Zapier for anyone who has not accepted the invite, so a pre-filled link would
open a broken Zap for them. The flow is controlled by the same flag and disappears when it flips.

### Behavior

All links into Zapier render through one component, `zapier-open-button.svelte`. It takes the target URL and
the button content. Every CTA in this plan uses it: Create a Zap, Connect Apps' "Continue in Zapier",
"Connect {App} in Zapier", each card's "Try it", and the directory's end card.

| State | Click does |
| --- | --- |
| `isZapierLive()` | Opens the target in a new tab |
| Private, and the current admin already accepted the invite | Opens the target in a new tab |
| Private, invite not accepted yet | Opens `zapier-invite-dialog.svelte` |

"Already accepted" is true when either:

1. one of the org's Zapier connections (`zapierApi.overview.connections`) has
   `authorizedBy.profileId === $profile.id`. A user can only create a Zapier grant after accepting the invite,
   so this is proof; or
2. this browser remembers that the user opened the invite (`localStorage` key `cio:zapier-invite-opened:<profileId>`,
   read and written in `try/catch`). This is a convenience, not proof.

The dialog has two numbered steps, using `Dialog` with the house button hierarchy:

1. **Accept the ClassroomIO invite on Zapier.** Button opens `PUBLIC_ZAPIER_CONNECT_URL` in a new tab and
   stores the `localStorage` key. Short text: Zapier asks you to accept once; after that ClassroomIO appears in
   your Zapier account.
2. **Continue to your Zap.** Primary button, enabled after step 1 is clicked. Opens the original target.

Footer: `Cancel` (outline). Plus a text link "I've already accepted" that skips to step 2 and stores the key.

The Zaps page's empty-state primary action ("Connect Zapier") keeps pointing at the invite link directly, as
today, because accepting the invite is the first thing a new org must do.

### Removal

When the flag flips to `public`, `zapier-open-button.svelte` always opens the target. Section 12 lists what to
delete.

## 5. Target screens and routes

The prototype has four screens. Three become dashboard routes. The fourth is a copy of Zapier's own page and is
rebuilt as a sheet in our design.

| Prototype file | Becomes | Route |
| --- | --- | --- |
| `index.html` (Zaps, empty and non-empty) | Zaps page | `/org/[slug]/automation/zapier` |
| `app-directory.html` | App Directory | `/org/[slug]/automation/zapier/apps` |
| `zapier-handoff.html?startApp=<app>` | ClassroomIO + {App} page | `/org/[slug]/automation/zapier/apps/[app]` |
| `zapier-connections.html` (Zapier's Connections page) | "View connection" sheet, in our design | Sheet on the Zaps page |
| `automation-overview.html` | Already exists as the Automation tabs | No change |

All four render inside the existing Automation layout (`routes/(app)/org/[slug]/automation/+layout.svelte`).
Admin-only, cloud-only, plan-gated exactly as today's Zapier tab: self-hosted callout, `UpgradeBanner` when
`!$hasPublicApiAccess`, non-admin callout.

### 5.1 Zaps page (`index.html`)

Header: `Page.Header` with title "Zaps", subtitle, and a primary "Create a Zap" (`zapier-open-button`, target
`buildZapierZapUrl([])`, the empty editor). Keep the existing "Read docs" secondary action.

**Empty state** (the org has no Zapier connection): replace `zapier-connect-card.svelte` with an `Empty`
(variant `page`) showing the ClassroomIO mark, a plus, and the Zapier mark; title "No Zaps yet"; description;
two buttons: "Create a Zap" (primary, `zapier-open-button`) and "Connect apps" (outline, link to `/apps`).
Below it, keep the four setup steps.

**Non-empty state** (at least one connection):

1. Status banner (`Alert.Callout`, information): "{n} apps connected to ClassroomIO" when live; while private
   use today's "Zapier is connected" copy with trigger usage `{used}/{max}`. Keep the paused-by-plan warning.
2. **Connected apps** section:
   - **Live:** one `Item` row per partner app that appears in the current admin's Zaps: logo, name,
     "Connected · {first Zap title}" (+ "and {n} more"), and "View connection" (outline, small). Data from
     `GET /organization/automation/zapier/zaps` (Phase 7). Zaps whose apps are not in the catalog are grouped
     under "Other apps" with Zapier's own app title and logo. If the admin has not linked their Zapier account,
     show the "Link your Zapier account" card instead (Phase 7).
   - **Private:** `zapier-coming-soon` ("See which apps your Zaps use here") and, under it, what we do know:
     **Active ClassroomIO triggers**, one row per trigger in use across the org's connections (label, health
     badge, course filter, last delivery), from the existing overview. This replaces the triggers sheet as the
     main view; keep the sheet for per-connection detail.
3. **Zapier access to ClassroomIO** section (anchor `#zapier-access`): the existing
   `zapier-connections-table.svelte`, triggers sheet and remove dialog, unchanged. The prototype omits this, but
   the PRD requires per-grant revoke and the app page's trust strip points here.

The header CTA reads "Create more Zaps" in the non-empty state.

### 5.2 "View connection" sheet (replaces `zapier-connections.html`)

`zapier-app-connection-sheet.svelte`, opened from a Connected apps row. **Live only**; while private, the
row does not render, so the sheet cannot open.

- Header: app logo + "ClassroomIO + {App}".
- **Zaps:** each Zap that uses this app: title, On/Off badge (`is_enabled`), last updated, "Open in Zapier"
  (`https://zapier.com/editor/<zapId>`, new tab).
- **{App} connections in Zapier:** rows from `GET /organization/automation/zapier/connections?app=<slug>`:
  connection title, "Expired" badge when `is_expired`. Footer link "Manage connections in Zapier"
  (`https://zapier.com/app/assets/connections`).
- Footer actions: "Create a Zap with {App}" (primary, the app's primary recipe link) and "View app" (outline,
  link to the app page).

The prototype's "Create connection" search modal becomes a `Search` input in the sheet header area that
filters the catalog and links to app pages. Do not copy Zapier's table, sidebar, plan-usage box or header.

### 5.3 App Directory (`app-directory.html`)

`Page.Header` with `BackButton` (to the Zaps page), title "App Directory", subtitle, primary "Create a Zap in
Zapier" (`zapier-open-button`).

Two columns on desktop, one on mobile:

- **Filters column:** `Search` input (client-side filter on name and translated description); "Discover" group
  with All apps / Popular / Recently added and counts; "Categories" group with real counts (hide empty
  categories). Use `ToggleGroup` (vertical) or a list of `Button variant="ghost"` with a count `Badge`. Below
  860px the filter groups collapse into a `Collapsible` "Filters" control with an active-filter count badge,
  and close themselves after a selection. Search stays visible.
- **Results column:** result count ("20 apps", "Showing 18 of 20 apps", "matching “x”"), sort `ToggleGroup`
  (Popular / A–Z), card grid (`zapier-app-card.svelte`: logo, name, description, Popular or Recently added
  badge; whole card links to the app page), "View more apps" (page size 18).
- **No results:** `Empty` with "No apps match your search" and a `zapier-open-button` "Search in Zapier".
- **End card** (only when every result is shown): "That's every app we've picked. Zapier connects ClassroomIO
  to thousands more." with a `zapier-open-button` "Continue in Zapier". Do not hard-code Zapier's app count.

All state lives in the query string, written with `goto(url, { replaceState: true, keepFocus: true,
noScroll: true })` as the current catalog does: `q`, `category`, `quick` (`popular` | `recent`), `sort`
(`az`), `shown` (number of cards revealed). Reading an invalid value falls back to the default. Mount
`ScrollToTop`.

### 5.4 ClassroomIO + {App} page (`zapier-handoff.html`)

Route param `[app]` is the catalog slug. `+page.ts` returns `error(404)` for an unknown slug.

Do **not** reproduce the prototype's Zapier top navigation (Products, Solutions, Resources, Enterprise,
Pricing, the zapier wordmark, Explore apps, My Zaps). Use `Page.Header` with `BackButton` (to the directory,
`history.back()` when there is history) and a breadcrumb: Zapier › Apps › {Category} › ClassroomIO + {App}.

Sections, top to bottom:

1. **Hero** (`zapier-app-hero.svelte`)
   - Eyebrow: "ClassroomIO + {App}". "Official integration" badge only when `isZapierLive()`.
   - Headline and lead built from the app's **primary recipe** (section 6): for a recipe from ClassroomIO,
     "{Trigger verb} in ClassroomIO. See it in {App}."; for a recipe into ClassroomIO, "{App trigger} in
     {App}. Enroll them in ClassroomIO." Copy keys per recipe direction; the trigger/action labels come from
     the shared constants and the catalog.
   - **Live preview** (`zapier-live-preview.svelte`): two windows joined by a Zapier node. Left window lists
     recent example events for the recipe's trigger; right window lists the resulting example records. Every
     5.2 s a new row slides in on the left, the node pulses "New event → Running Zap → Zap ran", and the record
     appears on the right. Respect `prefers-reduced-motion` (render the final state, no timers), pause while
     `document.hidden`, and clear timers on destroy. Example values for ClassroomIO events come from
     `buildWebhookExampleEnvelope(eventType)` (`@cio/utils/validation/webhook`); a small fixed list of sample
     people adds variety. It is an illustration, labelled "Example", never the org's real data.
   - **CTA:** `zapier-open-button`, "Connect {App} in Zapier", target = primary recipe link. Under it:
     "{n} triggers · {m} actions · Instant" and "Takes about 2 minutes. Nothing runs until you turn the Zap on."
2. **Connected banner** (only when the org has a Zapier connection): "{Org} is connected to Zapier." plus the
   access level from `getZapierAccess(scopes)`; links "View connection in ClassroomIO" (Zaps page
   `#zapier-access`) and "View on Zapier" (connections page, new tab).
3. **Trust strip** (three `Item`s): access level, scoped to {Org}; "Revoke anytime, from Automation › Zapier";
   "Your Zaps live in Zapier".
4. **Triggers & actions** (`zapier-capability-grid.svelte`). **Superseded** by Part A of [`recipes-and-trigger-delivery-plan.md`](recipes-and-trigger-delivery-plan.md): build recipes,
   "Build your own" and a collapsed reference instead of this grid.
   - `Tabs`: Triggers ({n}), Actions ({m}), Triggers & Actions ({n+m}), default the last.
   - Items: every ClassroomIO trigger from `ZAPIER_TRIGGERS`, every ClassroomIO action from `ZAPIER_ACTIONS`
     and search from `ZAPIER_SEARCHES`, plus this app's recipe steps on the app side (for example Slack "Send
     Channel Message"), marked with the app's logo.
   - Card (`zapier-capability-card.svelte`, a `Collapsible`): icon, label, description; expanded detail shows
     "Sample data this trigger sends" (flattened `buildWebhookExampleEnvelope(eventType).data`, first 6 fields)
     or "Fields you map in Zapier" (from translations per action). Footer: Trigger/Action/Search label, mode
     ("Instant" for triggers, "Write" for actions, "Lookup" for searches), and "Try it" (`zapier-open-button`).
   - "Try it" target: a ClassroomIO trigger pairs with this app's first write step from the catalog; a
     ClassroomIO action pairs with this app's first read step; an app-side step pairs with the matching
     ClassroomIO step from its recipe. With no counterpart, link a one-step Zap.
   - Show 6, "Load more" adds 6, with "Showing x of y".
5. **Similar apps** (`zapier-similar-apps.svelte`): up to 4, same category first, then popular; each card shows
   both marks, "ClassroomIO + {App}", description. Link "See all {n} apps" to the directory.

Mount `ScrollToTop`. The page must not scroll horizontally at 375px.

### 5.5 Layout changes

- `routes/(app)/org/[slug]/automation/+layout.svelte`: `getCurrentTab` uses `endsWith`, so sub-routes lose the
  Zapier tab highlight. Match on `includes('/automation/zapier')` (and the same for the other tabs).
- The layout caps width at `max-w-4xl`. Keep it. The directory's filter column is 220px; the app page's live
  preview stacks vertically below 768px.

## 6. Shared app catalog and recipes

Move the 20-app catalog from `apps/dashboard/src/lib/features/automation/utils/zapier-apps.ts` into
`packages/utils/src/constants/zapier.ts`, because the API needs it in Phase 7 to group Zaps and look up logos.
The dashboard re-exports or imports it directly. Delete the dashboard copy.

```ts
export const ZAPIER_APP_CATEGORIES = ['crm', 'marketing', 'communication', 'customer-support', 'sales',
  'productivity', 'forms', 'analytics', 'community'] as const;

export type TZapierRecipeStep =
  | { app: 'classroomio'; type: 'read'; key: TZapierTriggerKey }
  | { app: 'classroomio'; type: 'write'; key: TZapierActionKey }
  | { app: 'partner'; type: 'read' | 'write'; key: string };

export type TZapierPartnerApp = {
  slug: string;
  name: string;
  zapierKey: string;
  category: (typeof ZAPIER_APP_CATEGORIES)[number];
  color: string;
  isPopular: boolean;
  isRecent: boolean;
  recipes: readonly (readonly [TZapierRecipeStep, TZapierRecipeStep])[];
};
```

`zapierKey` has no version; URL builders append `@latest`. `recipes[0]` is the primary recipe used by the hero
and the main CTA. Copy (description, blurb, recipe title, "fields you map") lives in translations under
`automation.zapier.apps.<slug>.*`, never in the constant.

The current dashboard catalog pairs every app with a ClassroomIO trigger and a ClassroomIO action
(`triggerKey`/`actionKey`), which cannot describe "Calendly booking → enroll in ClassroomIO". Replace it with
the recipes below.

### Recipes

**Superseded** by section A5 of [`recipes-and-trigger-delivery-plan.md`](recipes-and-trigger-delivery-plan.md), which has 2 to 6 recipes per app and replaces the hidden
Pendo action used below. Keep this table only as the history of the first pass.

Keys come from each app's public Zapier page (section 2). **Verified** means a pre-filled link was opened on
2026-11-03 and both steps loaded. Every other row must be verified with the same check (section 11) before
the phase that uses it is done.

| App | `zapierKey` | Primary recipe | Second recipe |
| --- | --- | --- | --- |
| HubSpot | `HubSpotCLIAPI` | HubSpot `updated_deal_stage` → CIO `enroll_student` | CIO `course_completed` → HubSpot `upsert_contact` |
| Salesforce | `SalesforceCLIAPI` | CIO `new_certificate` → Salesforce `create_record` | Salesforce `new_record` → CIO `enroll_student` |
| Mailchimp | `MailchimpCLIAPI` | CIO `new_course_enrollment` → Mailchimp `memberCreate` | Mailchimp `new_member` → CIO `add_student` |
| Customer.io | `CustomerIOV2CLIAPI` | CIO `course_completed` → Customer.io `track_event` | CIO `new_course_enrollment` → Customer.io `create_customer` |
| Slack | `SlackCLIAPI` | CIO `course_completed` → Slack `channel_message` (**verified**) | CIO `new_payment_request` → Slack `channel_message` |
| Microsoft Teams | `MSTeamsCLIAPI` | CIO `course_completed` → Teams `send_channel_message_from_user` | CIO `new_submission` → Teams `send_channel_message_from_user` |
| Google Meet | `GoogleMeetCLIAPI` | CIO `live_session_scheduled` → Meet `schedule_meeting` | none |
| Zoom | `ZoomCLIAPI` | CIO `new_course_enrollment` → Zoom `create_registrant` | Zoom `new_registrant` → CIO `enroll_student` |
| Zendesk | `ZendeskV2CLIAPI` | CIO `compliance_status_changed` → Zendesk `ticket` | Zendesk `user_v2` → CIO `enroll_student` |
| Intercom | `IntercomV2CLIAPI` | CIO `course_completed` → Intercom `send_message_to_contact` | Intercom `new_user_created` → CIO `enroll_student` |
| Calendly | `CalendlyCLIAPI` | Calendly `invitee_created` → CIO `enroll_student` (**verified**) | none |
| Cal.com | `CalComCLIAPI` | Cal.com `booking_created` → CIO `enroll_student` | none |
| Google Sheets | `GoogleSheetsV2CLIAPI` | CIO `course_completed` → Sheets `add_row` | Sheets `new_row_notify_hook` → CIO `enroll_student` |
| Notion | `NotionCLIAPI` | CIO `course_completed` → Notion `create_database_item` | none |
| Confluence | `ConfluenceCloudCLIAPI` | CIO `course_published` → Confluence `pageCreate` | none |
| Typeform | `TypeformCLIAPI` | Typeform `entries_resthook_v2` → CIO `enroll_student` | none |
| Jotform | `JotFormCLIAPI` | Jotform `new_submission` → CIO `enroll_student` | none |
| Pendo | `ReceptiveCLIAPI` | CIO `course_completed` → Pendo `create_update_end_user` | none |
| Mixpanel | `MixpanelCLIAPI` | CIO `course_completed` → Mixpanel `track` | none |
| Circle | `CircleCLIAPI` | Circle `new_member` → CIO `enroll_student` | CIO `new_certificate` → Circle `add_space_member` |

Popular (matches the prototype): HubSpot, Salesforce, Customer.io, Slack, Zoom, Zendesk, Intercom, Calendly,
Google Sheets, Typeform. Recently added: Google Meet, Zoom, Intercom, Cal.com, Notion, Confluence, Pendo,
Circle. Colors as in the prototype's `apps-catalog.js`.

Notes found while collecting keys (they change the prototype's copy, see section 10):

- Zapier's "Pendo" app is **Pendo Feedback** (`ReceptiveCLIAPI`). It has no product-usage or feature-adoption
  trigger, so the prototype's Pendo story cannot be built.
- Confluence has a Server/Data Center app (`ConfluenceCLIAPI`) and a Cloud app (`ConfluenceCloudCLIAPI`). Use
  Cloud. Its only action creates a page, so the recipe is "course published → page", not one page per
  completion.
- Cal.com has triggers only; Google Meet has one action; Mixpanel and Customer.io have actions only.

## 7. Phases

Each phase lists files, behavior, tests and "done when". Phases 1 to 6 ship value while private. Phase 7 is
the live-publish work, built now and hidden by the flag. Phase 8 is polish. Keep it all in the
`feats/zapier-integration` feature; it is one feature, not separate fixes.

### Phase 0: prerequisites (people, not code)

- [ ] Email `partners@zapier.com` and ask whether they will configure the Embed OAuth application for
      integration 249044 (and the production integration) while it is private. Their answer decides whether the
      flag can flip before public listing (section 13). Suggested text:

  > Hi, we're building ClassroomIO's Zapier integration (integration 249044, private). Embed → Settings
  > says our OAuth application isn't configured and to contact you. We'd like Workflow API access
  > (`zap`, `connection:read`, `profile` scopes) and the redirect URI
  > `https://app.classroomio.com/integrations/zapier/callback`. Can you configure it while the
  > integration is private, or only after it's published? Thanks.

- [ ] Copy the invite link from Developer Platform → Manage → Sharing into `PUBLIC_ZAPIER_CONNECT_URL` for each
      environment, and set `PUBLIC_ZAPIER_APP_KEY` (staging `App249044CLIAPI`; production key from its
      integration).
- [ ] Legal: confirm that showing third-party app logos returned by Zapier's `/v2/apps` is acceptable under
      the Powered by Zapier terms (they do not mention it). Until confirmed, ship monograms only.

### Phase 1: shared catalog, URL builder, flag helper

Files:

- `packages/utils/src/constants/zapier.ts`: `ZAPIER_APP_CATEGORIES`, `TZapierRecipeStep`,
  `TZapierPartnerApp`, `ZAPIER_PARTNER_APPS` (section 6), `getZapierPartnerApp(slug)`.
- `apps/dashboard/src/lib/features/automation/utils/zapier-utils.ts`:
  - `isZapierLive(): boolean` (the only reader of `PUBLIC_ZAPIER_LISTING`).
  - `buildZapierZapUrl(steps: TZapierRecipeStep[], app?: TZapierPartnerApp): string`. Private: `webintent`
    URL. Live: `https://api.zapier.com/v1/embed/<PUBLIC_ZAPIER_APP_SLUG>/create` with the same `steps[i][…]`
    params. Both append `@latest` to every app key, use `PUBLIC_ZAPIER_APP_KEY` for ClassroomIO steps, and set
    `steps[i][type]`. Empty `steps` returns the plain editor URL. Replace `buildZapierCreateUrl`, which builds a
    URL that 404s for our app.
  - `buildZapierRecipeUrl(app, recipeIndex = 0)`, `getZapierTryItTarget(app, item)`.
  - `getZapierInviteUrl()` (rename of `getZapierConnectUrl`), `hasAcceptedZapierInvite(connections, profileId)`,
    `rememberZapierInviteOpened(profileId)`.
  - Directory helpers: `filterZapierApps`, `sortZapierApps`, `countZapierApps` (all/popular/recent/category),
    `parseZapierDirectoryState(searchParams)`, `toZapierDirectorySearch(state)`.
- `apps/dashboard/src/lib/features/automation/utils/types.ts`: directory state type, capability item type.
- Delete `utils/zapier-apps.ts` after moving the catalog.

Tests (`vitest`, next to the utils): URL builder for private and live, `@latest` always present, both
directions, empty steps; Try-it pairing; directory parse/serialize round trip and invalid values; counts.

Done when: tests pass, `svelte-check` shows no new errors, nothing renders differently yet.

### Phase 2: routes and layout

Files:

- `routes/(app)/org/[slug]/automation/zapier/apps/+page.svelte` and `apps/[app]/+page.svelte`, `+page.ts`
  (404 for unknown slug). Same `Page.Header`/`Page.Body` pattern as `zapier/+page.svelte`, with
  `<svelte:head>` titles.
- `lib/features/automation/pages/zapier-directory.svelte`, `pages/zapier-app.svelte`; export both from
  `pages/index.ts`.
- `routes/(app)/org/[slug]/automation/+layout.svelte`: tab matching fix (section 5.5).

Done when: both routes render placeholders inside the Automation layout with the Zapier tab highlighted, gates
(self-hosted, non-admin, plan) behave like the Zapier tab.

### Phase 3: Zaps page

Files:

- Rewrite `pages/zapier.svelte` per section 5.1. Keep the org-scoped `$effect` loading pattern.
- New `components/zapier-zaps-empty.svelte` (replaces `zapier-connect-card.svelte`),
  `components/zapier-active-triggers.svelte`, `components/zapier-coming-soon.svelte`.
- Delete `zapier-app-catalog.svelte` and `zapier-app-sheet.svelte`; the directory and app page replace them.
  Remove the `?app=`, `?view=`, `?q=`, `?category=` handling from this page.

Done when: empty, connected, paused-by-plan, non-admin, upgrade and self-hosted states all render; the Connected
apps section shows Coming soon plus active triggers while private; revoke still works.

### Phase 4: App Directory

Files: `pages/zapier-directory.svelte`, `components/zapier-app-card.svelte`,
`components/zapier-directory-filters.svelte`, `components/zapier-app-mark.svelte` (update: accepts an optional
`logoUrl`; falls back to the monogram).

Done when: search, Discover filters, categories with counts, sort, View more, no-results and end card work; all
state survives reload and back/forward through the query string; mobile filter collapsible works at 375px.

### Phase 5: ClassroomIO + {App} page

Files: `pages/zapier-app.svelte`, `components/zapier-app-hero.svelte`, `components/zapier-live-preview.svelte`,
`components/zapier-trust-strip.svelte`, `components/zapier-similar-apps.svelte`, plus the recipe components in
section A7 of [`recipes-and-trigger-delivery-plan.md`](recipes-and-trigger-delivery-plan.md) (they replace `zapier-capability-grid.svelte` and `zapier-capability-card.svelte`).

Done when: all 20 slugs render; the hero CTA and every Try it open the expected pre-filled Zap (spot-check 5
apps in both directions); reduced motion shows a static preview; no horizontal scroll at 375px; the connected
banner shows only for connected orgs.

### Phase 6: invite-first flow

Files: `components/zapier-open-button.svelte`, `components/zapier-invite-dialog.svelte`; swap every link into
Zapier from Phases 3 to 5 to `zapier-open-button`.

Before shipping, run the unverified check from section 2 with a second Zapier account that has not accepted
the invite, and record what it sees in this file.

Done when: a user with no grant of their own sees the dialog once per browser; a user who authorized a grant
never sees it; with `PUBLIC_ZAPIER_LISTING=public` the dialog never appears.

### Phase 7: live-publish features (built now, hidden by the flag)

Everything here is complete and tested, but the dashboard shows `zapier-coming-soon` instead while
`!isZapierLive()`.

**7.1 Database.** New table `zapier_account` in `packages/db/src/schema.ts`, added to this branch's single
migration:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `organization_id` | uuid fk → organization, cascade | |
| `profile_id` | uuid fk → profile, cascade | The admin who linked it |
| `zapier_user_email` | text | From `/v1/profiles/me` |
| `zapier_user_name` | text | |
| `access_token` | text | Encrypted |
| `refresh_token` | text | Encrypted |
| `access_token_expires_at` | timestamptz | |
| `scopes` | text[] | |
| `created_at`, `updated_at` | timestamptz | |

Unique `(organization_id, profile_id)`. Zapier accounts are personal, so each admin links their own and sees
their own Zaps. Queries in `packages/db/src/queries/zapier/account.ts`: `getZapierAccount`,
`upsertZapierAccount`, `updateZapierAccountTokens`, `deleteZapierAccount`, each accepting an optional
`DbOrTxClient` and logging errors with the function name.

Encryption: add a purpose-scoped AES-256-GCM helper beside `packages/core/src/services/webhook/secret.ts`
(same construction, purpose `zapier-token`). Do not change the webhook secret's output.

**7.2 Zapier OAuth (ClassroomIO admin → Zapier).** Service `apps/api/src/services/zapier/account.ts`:

- `startZapierAccountLink(orgId, profileId)`: builds
  `https://api.zapier.com/v2/authorize?response_type=code&client_id=…&redirect_uri=…&scope=zap%20connection:read%20profile&response_mode=query&state=…`.
  `state` is an HMAC-signed, 10-minute token holding `orgId`, `profileId` and a nonce; store the nonce in Redis
  (or an equivalent single-use store) so a state can be redeemed once.
- `completeZapierAccountLink(profileId, code, state)`: verifies state and that the caller is the same profile
  and still an org admin; exchanges the code at `https://zapier.com/oauth/token/` (Basic auth with client ID
  and secret, `grant_type=authorization_code`; codes expire after 2 minutes); fetches `/v1/profiles/me`;
  upserts the row. Returns the org's `siteName` for the redirect.
- `unlinkZapierAccount(orgId, profileId)`: deletes the row. Zapier has no documented token revocation
  endpoint; say so in the UI copy ("Remove ClassroomIO from your Zapier account settings to revoke fully").
- Token refresh: access tokens last 10 hours; each refresh returns a **new** refresh token and invalidates the
  old one. Refresh when `access_token_expires_at` is under 5 minutes away or on a 401, inside a row lock
  (`select … for update`) so two requests cannot both spend the same refresh token. On refresh failure delete
  the row and throw `ZAPIER_ACCOUNT_REAUTH_REQUIRED`.

**7.3 Workflow API client.** `apps/api/src/services/zapier/workflow-api.ts`: a small `fetch` wrapper with
base `https://api.zapier.com`, bearer or `client_id` auth, 10 s timeout, JSON parsing, and mapping of Zapier
errors to `AppError` (`ZAPIER_EMBED_NOT_CONFIGURED`, `ZAPIER_ACCOUNT_REAUTH_REQUIRED`, `ZAPIER_UPSTREAM_ERROR`).
Add the codes to `packages/utils/src/constants/error-codes.ts`.

**7.4 Features.**

| Service | Zapier call | Returns |
| --- | --- | --- |
| `services/zapier/apps.ts` `getZapierPartnerAppLogos()` | `GET /v2/apps?query=<name>` per catalog app, with `client_id`; match on title | `{ slug, zapierAppId, logoUrl64, logoUrl128 }[]`. Cache 24 h (Redis). Record each `zapierAppId` in the catalog once known, then switch to `GET /v2/apps?ids=…` |
| `services/zapier/zaps.ts` `listZapierZaps(orgId, profileId)` | `GET /v2/zaps?expand=steps.action` with scope `zap` (only Zaps using our integration) | Zaps grouped by partner app: `{ app: { slug \| null, title, logoUrl }, zaps: { id, title, isEnabled, updatedAt, editUrl }[] }[]` |
| `services/zapier/connections.ts` `listZapierAppConnections(orgId, profileId, slug)` | `GET /v2/authentications?app=<zapierAppId>` (scope `connection:read`) | `{ id, title, isExpired }[]` |
| `services/zapier/account.ts` `getZapierAccountStatus(orgId, profileId)` | none (row) | `{ isLinked, email, name, linkedAt }` |

Do not request `zap:all`: `zap` returns only Zaps that use ClassroomIO, which is all the page needs and keeps
other workflows private. Step inputs for other apps come back `null` under `zap`, so the UI shows Zap titles,
not channel names.

**7.5 Routes** in `apps/api/src/routes/organization/automation.ts`, all `authMiddleware` +
`orgAdminMiddleware`, validation schemas in `packages/utils/src/validation/automation/` (create the folder if
it does not exist), one response type per route:

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/zapier/account` | account status |
| POST | `/zapier/account/authorize` | `{ url }` |
| POST | `/zapier/account/callback` | `{ siteName }` (body `{ code, state }`) |
| DELETE | `/zapier/account` | `{ removed: true }` |
| GET | `/zapier/zaps` | grouped Zaps |
| GET | `/zapier/connections?app=<slug>` | connections |
| GET | `/zapier/app-logos` | logos |

Run `pnpm --filter @cio/api build` after adding them so the RPC types update.

**7.6 Dashboard.**

- Callback route outside the org segment, because the redirect URI must be fixed:
  `routes/(app)/integrations/zapier/callback/+page.svelte` (check the existing non-org `(app)` routes such as
  `home` for the right group and guards). It reads `code` and `state`, calls the callback route, then
  `goto('/org/<siteName>/automation/zapier')`. On error it shows an `Empty` with a retry link.
- `api/zapier.svelte.ts`: `loadAccount`, `startAccountLink` (then `window.location.assign(url)`),
  `unlinkAccount`, `loadZaps`, `loadAppConnections(slug)`, `loadAppLogos`. Request types in
  `utils/types.ts`.
- Components: `zapier-account-card.svelte` (Link your Zapier account / Linked as {email} / Unlink),
  `zapier-connected-apps.svelte` (section 5.1 live rows), `zapier-app-connection-sheet.svelte` (section 5.2).
- `zapier-app-mark.svelte` gets `logoUrl` from `loadAppLogos` when live and legal has approved; otherwise the
  monogram.
- Every one of these renders only when `isZapierLive()`; otherwise `zapier-coming-soon`.

**Tests.** API: services with `fetch` mocked against the documented response shapes (store fixtures under
`apps/api/src/__tests__/fixtures/zapier/`); state signing and single use; refresh rotation and the row lock;
`ZAPIER_EMBED_NOT_CONFIGURED` when env is missing; route auth (non-admin 403). DB: query helpers against a
scratch database. Dashboard: API class state transitions.

Done when: everything passes with credentials absent (fail-closed path) and, once credentials exist, the
manual checks in section 11 pass with the flag set to `public` on staging.

### Phase 8: polish

- Copy pass against `skills/classroomio-design` voice rules; all keys translated with `pnpm translate` and
  placeholders checked.
- `testId`s: `zapier-create-zap`, `zapier-connect-apps`, `zapier-directory-search`, `zapier-app-card-<slug>`,
  `zapier-app-cta`, `zapier-try-it`, `zapier-invite-continue`, `zapier-view-connection-<slug>`.
- Accessibility: tabs with `role="tab"`, capability cards with `aria-expanded`, live preview `aria-live="polite"`
  on the node label only, visible focus on cards.
- Optional Help Center page for the directory and app pages, screenshots per `skills/add-docs-image`.

## 8. Comes with live publish

Built in Phase 7, shown only when `PUBLIC_ZAPIER_LISTING=public`:

| Feature | Prototype screen | Needs |
| --- | --- | --- |
| Connected apps list with Zap titles and logos | `index.html` non-empty state | Embed OAuth app, admin's linked Zapier account, scope `zap` |
| "View connection" sheet: Zaps per app and the app's Zapier connections | `zapier-connections.html` | Same, plus scope `connection:read` |
| Linked Zapier account (name, email, unlink) | none (needed for the above) | Scope `profile` |
| Real app logos | every screen | Client ID (no user login), legal sign-off |
| "Official integration" badge | `zapier-handoff.html` hero | Public listing |
| Documented pre-filled URL (`api.zapier.com/v1/embed/<slug>/create`) | every CTA | Public listing, `PUBLIC_ZAPIER_APP_SLUG` |
| No invite step | every CTA | Public listing |

Not in the prototype, available later if wanted: published Zap templates on the app page
(`GET /v1/zap-templates`), Zap on/off toggles (scope `zap:pause`), run history (`zap:runs`), the embedded
Workflow Element (needs Embedding Domains).

## 9. Never build

- Copies of Zapier's site chrome or pages: the prototype's Zapier top navigation on the app page, and the whole
  `zapier-connections.html` layout (header, sidebar, plan usage, table). Powered by Zapier Terms §2(c)(vi)
  forbid copying or displaying elements of Zapier's services without consent, and it would pass our page off
  as Zapier's. Use our chrome; the Zapier mark appears only in CTAs, per Zapier's brand guidelines.
- Restricting which apps users pair with ClassroomIO inside Zapier. We can only choose what our directory
  shows.
- Fetching Zapier app pages at runtime to get keys or logos.
- Shipping the prototype's `logos/` files or `brand-logos.js` marks. Several of the 20 brands (Microsoft,
  HubSpot, Slack, Salesforce) forbid logo use without permission.
- Knowing which app a user will pick when they authorize ClassroomIO in Zapier. The OAuth request carries no
  app.

## 10. Copy corrections against the prototype

| Prototype says | Build instead | Why |
| --- | --- | --- |
| 5 triggers, 5 actions, 2 searches (`apps-catalog.js`) | 14 triggers, 11 actions, 2 searches from `@cio/utils/constants/zapier` | The Zapier app ships these |
| "Polling · Zapier checks every few minutes" | "Instant" | Triggers are REST hooks (`apps/zapier/src/lib/event-trigger.ts`, `type: 'hook'`) |
| "Official integration" | Only when live | Not true while private |
| "Zapier connects ClassroomIO to 6,000+ apps" | "thousands of apps" | Avoid a number that goes stale |
| Pendo: enroll when Pendo shows a feature isn't adopted | Pendo Feedback recipes from section A5 of [`recipes-and-trigger-delivery-plan.md`](recipes-and-trigger-delivery-plan.md) | Zapier's Pendo app has no adoption trigger, and its only action is hidden |
| Confluence: log each completion to a page | Create a page when a course is published | Its only action creates a page |
| Every app gets a ClassroomIO-trigger story | Direction follows the recipe | Calendly, Cal.com, Typeform, Jotform, Circle start in the other app |
| "Acme Academy is connected… Read and write access" | Org name and access from the real grant | |

## 11. Verification

Automated, before each commit (Node 24, see CLAUDE.md):

```bash
pnpm --filter @cio/utils build
```

```bash
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
```

```bash
pnpm --filter @cio/api test
```

```bash
cd apps/dashboard && pnpm vitest run src/lib/features/automation
```

```bash
cd apps/dashboard && pnpm exec svelte-kit sync && pnpm exec svelte-check --threshold error
```

```bash
pnpm format:check
```

Compare `svelte-check` against a baseline run on the branch before your change. Do not run the dashboard vite
build.

Manual, in the browser, signed in to Zapier as an account that accepted the invite:

1. For every recipe in section 6, open `buildZapierRecipeUrl(app, i)` and confirm both steps load with the
   expected app and event. Mark the row verified in this file.
2. Directory: every filter, sort and pagination state survives reload and back/forward.
3. App page at 375px and 1280px, light and dark, reduced motion on and off.
4. Invite dialog with a second Zapier account that has not accepted the invite (record the result in section 2).
5. With `PUBLIC_ZAPIER_LISTING=public` on staging and Embed credentials set: link a Zapier account, see Zaps
   grouped by app, open a View connection sheet, unlink, force a token refresh, and confirm a non-admin gets 403
   from every Zapier route.

Each manual check creates draft Zaps in the tester's Zapier account. Delete them afterwards.

## 12. Go-live and flag removal

Go-live (staging first, then production):

1. Publish the integration in Zapier (submit for review; it enters Beta, then public).
2. Get Embed credentials (or partner support configures them earlier, section 13). Register
   `ZAPIER_EMBED_REDIRECT_URI`. Set `ZAPIER_EMBED_CLIENT_ID`, `ZAPIER_EMBED_CLIENT_SECRET`.
3. Run section 11 step 5. Record real Workflow API responses and update the test fixtures if they differ.
4. Fill `zapierAppId` for the 20 catalog apps; switch logo lookup to `ids=`.
5. Legal sign-off on logos.
6. Set `PUBLIC_ZAPIER_APP_SLUG`, then `PUBLIC_ZAPIER_LISTING=public`.

Flag removal, in one cleanup change once production has run cleanly on `public`:

- Delete `isZapierLive()` and every branch on it, keeping the live side.
- Delete `zapier-coming-soon.svelte`, `zapier-invite-dialog.svelte`, the `localStorage` key helpers, and
  `hasAcceptedZapierInvite`. `zapier-open-button.svelte` becomes a plain external link or is inlined.
- Delete the `webintent` branch of `buildZapierZapUrl`.
- Remove `PUBLIC_ZAPIER_LISTING` and `PUBLIC_ZAPIER_CONNECT_URL` from code and `.env.example`.
- Remove the coming-soon and invite translation keys from every locale.
- `grep -rn "isZapierLive\|PUBLIC_ZAPIER_LISTING\|webintent\|zapier-coming-soon\|zapier-invite" apps packages`
  returns nothing.

## 13. Open questions

| Question | Who answers | Effect |
| --- | --- | --- |
| Will Zapier configure the Embed OAuth app while we're private? | Zapier partner support | If yes, the live features can be tested before publishing. The flag still flips only at public listing, unless the product owner decides to split it |
| Can we show logos from Zapier's `/v2/apps`? | Legal | Monograms until yes |
| Per-admin Zaps (this plan) or one org-wide Zapier account? | Product | Per-admin matches how Zapier accounts work; org-wide would need one admin's token to represent the org |
| Do the 20 recipes match what customers want first? | Product. The prototype README cites `prd/zapier/integration-research.md`, which is not in the repo on any branch | Changes rows in section 6 only |
