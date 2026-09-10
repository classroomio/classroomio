# Landing Page Learner Menu PRD

## Status

- Draft

## Prototypes — the UX source of truth

UX for this feature comes from the prototype folder, not from prose. Where this document and a prototype disagree on a UI detail, **the prototype wins** and this document must be corrected.

```text
prototypes/landing-learner-menu/index.html
```

| Surface | Prototype file |
| --- | --- |
| Start page / screen map | `prototypes/landing-learner-menu/index.html` |
| Quartz landing page — enrolled learner (menu open) | `prototypes/landing-learner-menu/learner-member.html` |
| Quartz landing page — logged in, not a member | `prototypes/landing-learner-menu/learner-non-member.html` |
| Quartz landing page — logged out (unchanged baseline) | `prototypes/landing-learner-menu/learner-logged-out.html` |
| All menu states side by side (member / non-member / loading / no-avatar / mobile) | `prototypes/landing-learner-menu/menu-states.html` |
| The menu rendered in 4 other landing themes (bold, terminal, editorial, vibrant) | `prototypes/landing-learner-menu/themes.html` |

## Purpose

A customer-education academy is a marketing site and a product entrance at the same time. Today the org landing page treats every visitor as anonymous: the nav shows one button, and a learner who is already signed in gets no acknowledgement that they are signed in, no way to see which account they are using, and no way to sign out without first entering the LMS. This PRD adds a **learner account menu** — an avatar in the far right of the landing nav that opens a popover with identity, learner destinations, theme preference, and log out — alongside the existing primary CTA.

The reference experience is the account popover on developer-tool marketing sites (Vercel, Linear, Resend): avatar on the far right, name + email at the top, a short list of destinations, a theme row, log out, and a filled CTA pinned to the bottom of the card. The screenshot supplied by the user is the visual reference; the CTA there reads "Upgrade to Pro", and for a customer-education academy the equivalent bottom CTA is **Continue Learning**.

## Problem Statement

- A signed-in learner on `acme.classroomio.com` sees no evidence they are signed in. The nav looks identical to a cold visitor's, so the page reads as "log in again".
- There is no way to tell **which** account is signed in. On shared or corporate machines, learners routinely complete training under the wrong account, and the only way to check today is to enter the LMS and open the sidebar.
- There is no log out on the public site at all. Signing out requires navigating into `/lms`, opening the sidebar footer menu, and choosing Log Out.
- Certificates — the artifact a compliance or customer-education learner actually comes back for — are three clicks deep and invisible from the academy's front door.
- Theme preference can only be changed inside the app shell, so a learner who prefers dark mode enters the LMS in the wrong theme and has to fix it after arrival.
- `getOrgLandingAuthAction()` (`apps/dashboard/src/lib/features/org/utils/org-landing-auth-action.ts`) compresses every possible signed-in state into a single button label. It cannot express "signed in as X, and here is what you can do".

## Confirmed Decisions

1. **Nav shape: CTA button + avatar.** When a learner is signed in and a member of the academy being viewed, the nav renders the existing primary CTA (`Continue Learning`) **and** an avatar trigger to its right. The avatar does not replace the button. One-click LMS access is preserved; the popover is for identity and secondary destinations.
2. **The popover repeats the CTA.** `Continue Learning` appears as a filled, full-width button pinned to the bottom of the popover card, mirroring the reference screenshot's "Upgrade to Pro" slot.
3. **CTA target is `/lms`.** No deep-link-to-last-lesson in v1, and no progress data is fetched on the public site. (This reverses an earlier answer in the same clarification session — resume-last-lesson was chosen first, then explicitly cut to keep v1 small. Recorded as a deliberate scope cut, see Non-Goals.)
4. **Menu items for members:** identity block (name + email), `My Courses` → `/lms`, `My Certificates` → `/lms/certificates`, `Account Settings` → `/lms/settings`, a `Theme` row, `Log Out`, then the `Continue Learning` CTA.
5. **Logged in but not a member of this academy:** the avatar still renders — hiding it when the person is demonstrably signed in is the confusing case. The CTA becomes `Join Academy` (in the nav and in the popover), and the learner-scoped items (`My Courses`, `My Certificates`) are dropped. `Account Settings`, `Theme` and `Log Out` remain. When the academy is invite-only, has `disableSignup`, or the learner has a pending invite, **no CTA renders at all** — the avatar and popover still do, minus the CTA button. This preserves the existing `getOrgLandingAuthAction()` gating exactly.
6. **Staff see exactly what learners see.** An admin or tutor of the academy viewing its public landing page gets `Continue Learning` → `/lms`, the same as a learner. No "Dashboard" CTA and no "Edit landing page" shortcut in v1. The one exception already in the code — self-hosted admins/tutors getting `Dashboard` → `/org/<siteName>` — is preserved unchanged.
7. **The theme toggle sets the app/LMS theme, not the landing page.** Landing themes are fixed single palettes (`packages/ui/src/custom/org-landing-page/*/vars.ts` — there is no dark variant and no `prefers-color-scheme` handling anywhere in that folder). The existing `ThemeToggle` (light / dark / system via `mode-watcher`) is reused as-is; it sets the preference the LMS and dashboard will render with. The landing page's own appearance does not change when it is used. See Risks for the disclosure requirement.
8. **One shared component across all 11 themes.** A single `learner-menu.svelte` lives in `packages/ui/src/custom/org-landing-page/`, styled entirely from `--landing-*` variables, and is dropped into every theme's `nav.svelte` (bold, classic, corporate, editorial, minimal, quartz, saas, studio, tech, terminal, vibrant). No per-theme forks in v1.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Landing nav auth affordance | Single `LandingButton` driven by `authAction` | `packages/ui/src/custom/org-landing-page/*/nav.svelte`; prop shape at `types.ts:359` |
| Auth action logic | `getOrgLandingAuthAction()` | Returns `{label, href, loading?}` or `undefined`; handles logged-out, loading, member, self-hosted staff, invite-only, `disableSignup`, pending invite |
| Signed-in identity on landing | None | No avatar, no name, no email anywhere on the public site |
| Log out from landing | None | Only via `/lms` sidebar footer → `menu.svelte` |
| Profile data availability | Available | Root `+layout.svelte` runs `appInitApi.setupApp()` for org-site routes too; `$profile` (`fullname`, `email`, `avatarUrl`) and `appInitApi.data.organizations` are populated |
| Avatar primitive | `UserAvatar` | `packages/ui/src/custom/user-avatar/` — wraps `base/avatar`, falls back to `/images/avatar.svg` |
| Popover primitive | `base/popover` and `base/dropdown-menu` (bits-ui) | Both portal their content to `document.body` |
| Theme toggle | `ThemeToggle` | `apps/dashboard/src/lib/features/ui/sidebar/footer/theme-toggle.svelte` — light/dark/system, `setMode` + `markColorModeExplicit()` |
| Account menu reference implementation | `menu.svelte` | `apps/dashboard/src/lib/features/ui/sidebar/footer/menu.svelte` — identity block, theme row, separators, log out |
| Landing theme variables | `themeStyle(theme)` | `packages/ui/src/custom/org-landing-page/theme-style.ts` — serialises a theme's `--landing-*` vars to an inline style string. Applied by `landing-theme-scope.svelte` |
| Landing dark mode | Does not exist | No `.dark` selector or `prefers-color-scheme` query in `org-landing-page/` |
| Landing page edit preview | `edit-context.ts` + `editable-section.svelte` | Settings preview renders the same theme components; interactive chrome must be inert there |
| LMS destinations | Exist | `/lms`, `/lms/certificates`, `/lms/settings`, `/lms/mylearning`, `/lms/community`, `/lms/explore` |

## Product Goals

1. A signed-in learner can tell, from the academy's front door, that they are signed in and which account they are using.
2. Entering the LMS stays one click; everything else a returning learner wants is one click plus one.
3. Certificates become reachable from the public site — the single strongest return-visit motivator for customer-education and compliance academies.
4. Log out is possible without entering the app.
5. The menu looks native in all 11 landing themes, driven by theme variables rather than hard-coded colour.
6. No behaviour change whatsoever for logged-out visitors.

## Non-Goals (v1)

- **Resume-last-lesson deep links.** No last-activity or progress lookup on the public site (Decision 3). `Continue Learning` goes to `/lms`.
- **Progress display in the popover.** No course title, no percentage, no progress bar.
- **Dark variants for the landing themes.** Adding a dark palette to each theme's `vars.ts` is a separate PRD.
- **Switch-academy list.** Learners in multiple academies are not offered a switcher here.
- **Staff shortcuts.** No "Dashboard", no "Edit landing page" (Decision 6).
- **Notifications, "What's new", feedback, docs, or support entries.** Those stay in the app shell menu.
- **Org-configurable menu items.** The item list is fixed; academies cannot add or reorder entries.

## Functional Requirements

### FR-1 — Nav trigger (all themes)

Prototype: `learner-member.html`, `themes.html`.

- The avatar renders as the last element in the landing nav's right-hand cluster, after the CTA button, with a `12px` gap.
- Trigger is a `32px` circular button showing `UserAvatar`; on hover and on open it gains a ring in `--landing-border`; focus-visible gets a `--landing-accent` ring, matching `LandingButton`.
- Accessible name comes from a translation key with the account interpolated, so a screen-reader user learns which account is signed in without opening the card: `landing.learner_menu.trigger_label` → "Account menu, signed in as {email}" (falls back to "Account menu" when the email is null). `aria-haspopup="dialog"`, `aria-expanded` reflects open state.
- The trigger renders **only** when the learner is signed in and `appInitApi` has initialised. States:
  - **Logged out** — no avatar, nav is byte-identical to today.
  - **Signed in, not yet initialised** — a `32px` skeleton circle in `--landing-border-soft` occupies the slot, so the nav does not reflow when data lands. The existing loading behaviour of the CTA button (`authAction.loading`) is unchanged.
    **This state must be driven by the server-known session, not by `$user.isLoggedIn`.** `defaultUserState.isLoggedIn` is `false` and root `+layout.svelte` only flips it inside `onMount`, independently of `appInitApi`. Keying off the store would render three successive nav layouts for a signed-in learner — nothing, then skeleton, then avatar — which violates AC-9. The builder takes the session from `data.locals.user` (available on the first server render) and uses `appInitApi.isInitializedAndReady` only to decide skeleton vs. avatar.
  - **Signed in, initialised** — avatar renders.
- On mobile (`< 768px`) the nav's centre links are already hidden; the avatar stays visible and the CTA button collapses to icon-only. The popover anchors to the right edge with an `8px` viewport inset.

### FR-2 — Popover content, member of this academy

Prototype: `learner-member.html`, `menu-states.html` (panel 1).

Card is `280px` wide, `--landing-card` background, `--landing-border` hairline, `--landing-radius-card` corners, `--landing-shadow-card`, aligned to the trigger's right edge with a `8px` offset.

| Row | Content | Behaviour |
| --- | --- | --- |
| Identity | `fullname` in `--landing-fg`, 15px semibold; `email` in `--landing-fg-muted`, 13px, truncated | Not a link. If `fullname` is empty, the email moves up and the muted line is omitted |
| Divider | `--landing-divider` | |
| My Courses | `landing.learner_menu.my_courses` | → `/lms` |
| My Certificates | `landing.learner_menu.my_certificates` | → `/lms/certificates` |
| Account Settings | `landing.learner_menu.account_settings` | → `/lms/settings` |
| Divider | | |
| Theme | `landing.learner_menu.theme` label left, 3-button segmented control right with per-mode labels (`landing.learner_menu.theme_light`, `.theme_dark`, `.theme_system`) | Sets app/LMS preference; popover stays open on click |
| Divider | | |
| Log Out | `settings.profile.logout` (existing key) with a `log-out` icon on the right | → `/logout` |
| CTA | Full-width filled `LandingButton variant="primary"`, label and href taken verbatim from `authAction` (`landing.learner_menu.continue_learning` → "Continue Learning") | → `/lms` |

- Every row except Theme closes the popover on activation.
- Item rows are `36px` tall, `14px` text in `--landing-fg`, hover background `--landing-button-tertiary-bg-hover`.
- **Focus model.** The card is a labelled `dialog`, not a `menu`: the content mixes destination links with a theme `radiogroup` and a CTA button, which `menu` semantics cannot express. The three zones are scoped rather than mixed:
  - The link rows (`My Courses`, `My Certificates`, `Account Settings`, `Log Out`) are plain anchors grouped by `data-slot="lm-link"` and form a **single roving-tabindex group**: exactly one carries `tabindex="0"`, arrow keys move between them and wrap, `Home`/`End` jump to the ends.
  - The theme segmented control and the CTA button are **not** links in the roving group. They sit alongside it as ordinary tab stops, in visual order: roving group → theme control (its three buttons are a `radiogroup`, arrow keys move within it) → CTA.
  - So `Tab` moves *between* those three zones, and arrow keys move *within* whichever zone has focus. `Tab` does not step through every link row.
  - The identity block is presentational: `aria-hidden` from the dialog's perspective, not focusable, and announced instead through the trigger's `aria-label` (`Account menu, signed in as <email>`).
  - `Escape` closes from anywhere in the card and returns focus to the trigger. Focus is trapped inside the card while open.

### FR-3 — Popover content, signed in but not a member

Prototype: `learner-non-member.html`, `menu-states.html` (panel 2).

- Identity block, `Account Settings`, `Theme`, `Log Out` — unchanged.
- `My Courses` and `My Certificates` are **absent** (not disabled).
- CTA reads `navigation.join_academy` → `/join-academy`.
- When the academy is invite-only, has `disableSignup`, or the learner has a pending invite, the CTA button and the nav CTA are both omitted; the popover ends at `Log Out`.
- Self-hosted non-members follow the existing `getOrgLandingAuthAction()` fallbacks unchanged: a managed org yields `Dashboard` → `/org/<siteName>`, otherwise no CTA.

### FR-4 — Theme fidelity

Prototype: `themes.html`.

- The card, dividers, text, hover states and CTA read **only** from `--landing-*` variables. No `ui:text-muted-foreground`-style app tokens, no literal hex.
- The theme's own personality carries through automatically: square corners in quartz (`--landing-radius-card: 0px`), heavy borders in bold, monospace in terminal.
- Because bits-ui portals popover content to `document.body`, outside `landing-theme-scope`'s inline style, the popover content element must re-apply `style={themeStyle(theme)}` itself. Each theme's `nav.svelte` passes its own `theme` key to `LearnerMenu`.

### FR-5 — Landing page editor preview

- In the settings landing-page preview and the `/settings/landingpage/edit` screen, the avatar renders (so the academy owner sees the real nav) but the popover does **not** open, matching how `disableCourseLinks` neutralises course links today.
- `aria-disabled` and non-focusability are **not** sufficient — they do not block pointer, `Enter`, `Space`, or programmatic activation. When `account.inert` is true the component must additionally: never mount `Popover.Root` in an openable state (render the trigger as a plain `<span>`, not a `<button>`), and render every row and the CTA as non-interactive elements rather than `<a href>`/`<button>` — so no code path can reach `/logout` or `/lms` from a preview.
- The `navigation` editable section cap continues to select the nav as a whole.

### FR-6 — Coverage

The menu appears anywhere a landing `nav.svelte` renders:

- Org landing page — `apps/dashboard/src/routes/+page.svelte` (org-site) and `$features/org/components/landing-page/landing-page.svelte`
- Public catalog — `apps/dashboard/src/routes/(org-site)/courses/+page.svelte`
- Public course landing page — `$features/ui/course-landing-page/course-landing-page.svelte`

## Technical Design

### Data

No new tables, no new columns, no new endpoints. Every value the menu renders is already in the client:

| Value | Source |
| --- | --- |
| `fullname`, `email`, `avatarUrl` | `$profile` (`apps/dashboard/src/lib/utils/store/user.ts`) |
| `isLoggedIn` | `$user.isLoggedIn` |
| initialisation | `appInitApi.isInitializedAndReady` |
| membership | `appInitApi.data.organizations` matched against `org.id` |
| gating | `org.settings.signup.inviteOnly`, `org.disableSignup`, `appInitApi.pendingOrgInvite` |

### Prop shape

`OrgLandingPageProps` gains one optional field beside `authAction` (`packages/ui/src/custom/org-landing-page/types.ts`):

```ts
export interface LandingLearnerAccount {
  fullname: string;
  email: string;
  avatarUrl?: string;
  /** Learner-scoped destinations; empty when the viewer is not a member of this academy. */
  items: { key: 'myCourses' | 'myCertificates' | 'accountSettings'; label: string; href: string }[];
  logoutLabel: string;
  logoutHref: string;
  themeLabel: string;
  triggerLabel: string;
  /** True while the account payload is still loading — render a skeleton trigger. */
  loading?: boolean;
  /** True in the settings preview — render the trigger but do not open the popover. */
  inert?: boolean;
}

export interface OrgLandingPageProps {
  // …existing fields
  authAction?: { label: string; href: string; loading?: boolean; disabled?: boolean };
  learnerAccount?: LandingLearnerAccount;
}
```

The UI package receives finished labels and hrefs, never translation keys and never raw membership data — copy stays in the dashboard, matching how `labels` and `authAction` already work.

### Builder

New pure helper beside the existing auth-action helper:

```ts
// apps/dashboard/src/lib/features/org/utils/org-landing-learner-account.ts
export function getOrgLandingLearnerAccount({
  isLoggedIn, isInitialized, profile, org, organizations, inert
}: OrgLandingLearnerAccountOptions): LandingLearnerAccount | undefined {
  if (!isLoggedIn) return undefined;

  if (!isInitialized) {
    return { /* identity blank */ loading: true, /* …labels */ };
  }

  const isMember = organizations.some((organization) => organization.id === org.id);
  const items = isMember ? buildLearnerItems() : [buildAccountSettingsItem()];

  return { fullname: profile.fullname, email: profile.email ?? '', avatarUrl: profile.avatarUrl ?? undefined, items, /* …labels */ inert };
}
```

- **`authAction` stays the single source of truth for the CTA.** The popover renders the label and href `getOrgLandingAuthAction()` returns, passed straight through, so the nav button and the popover CTA can never diverge by locale or by state.
- `getOrgLandingAuthAction()` changes in exactly one place: the member branch returns `t.get('landing.learner_menu.continue_learning')` instead of `t.get('navigation.goto_lms')`. `navigation.goto_lms` keeps its current copy ("Go to LMS") and its other consumers — `components/Navigation/index.svelte` and `routes/invite/[hash]/+page.svelte` — are untouched.
- The three call sites that build an `authAction` inline for the `/lms` case (`course-landing-page.svelte`, `settings/pages/landingpage.svelte`, `settings/landingpage/edit/+page.svelte`) switch to the same key, so every landing surface says "Continue Learning".
- **`profile.email` may be `null`** (`TProfile.email` is nullable). The builder coerces to `''` and the component omits the muted line, the same fallback the missing-`fullname` case uses.

#### Producer paths

There are **six** places that build landing props, and only four go through `buildOrgLandingPageProps()`. The two that bypass it need the same wiring or the menu silently disappears from surfaces FR-6 requires:

| # | Call site | Builder | `learnerAccount` |
| --- | --- | --- | --- |
| 1 | `routes/+page.svelte` (org-site root) | `buildOrgLandingPageProps()` | live |
| 2 | `features/org/components/landing-page/landing-page.svelte` | `buildOrgLandingPageProps()` | live |
| 3 | `features/settings/pages/landingpage.svelte` (preview) | `buildOrgLandingPageProps()` | `inert: true` |
| 4 | `routes/(app)/org/[slug]/settings/landingpage/edit/+page.svelte` (preview) | `buildOrgLandingPageProps()` | `inert: true` |
| 5 | `routes/(org-site)/courses/+page.svelte` (public catalog) | **none** — passes `authAction` straight into `NavComponent` | live, passed directly as a new `NavComponent` prop |
| 6 | `features/ui/course-landing-page/course-landing-page.svelte` | **`buildCourseLandingPageProps()`** (separate builder in `course-landing-page/utils.ts`) | live, via a new optional argument on that builder |

`buildOrgLandingPageProps()` and `buildCourseLandingPageProps()` each take `learnerAccount` as a new optional argument; paths 5 and 6 are the ones an implementer is most likely to miss.

### Component

```text
packages/ui/src/custom/org-landing-page/learner-menu.svelte
```

- Props: `account: LandingLearnerAccount`, `authAction?`, `theme: OrgLandingPageTheme`.
- Uses `base/popover` for the shell, `custom/user-avatar` for the trigger, `LandingButton variant="primary"` for the CTA.
- `Popover.Content` carries `style={themeStyle(theme)}` so the portalled card inherits the landing palette.
- The theme segmented control is a small local sub-component reading `userPrefersMode` and calling `setMode` from `@cio/ui/base/dark-mode` — the same API `ThemeToggle` uses. `markColorModeExplicit()` lives in the dashboard, so it is passed in as an `onThemeChange` callback rather than imported into the UI package.
- All classes carry the `ui:` prefix.
- Ships with a Storybook story at `packages/storybook/src/molecules/landing-learner-menu/` covering: member, non-member, non-member with no CTA, loading, missing avatar, missing fullname, inert, and each of the 11 themes.

### Wiring

Every `nav.svelte` gains the same two lines: accept `learnerAccount` and render `<LearnerMenu … theme="<key>" />` after the existing `authAction` block.

### Translations

New keys under `landing.learner_menu` in `apps/dashboard/src/lib/utils/translations/en.json`: `trigger_label` (takes an `{email}` placeholder), `trigger_label_anonymous`, `my_courses`, `my_certificates`, `account_settings`, `theme`, `continue_learning`. Existing keys reused: `settings.profile.logout`, `navigation.join_academy`, `navigation.goto_dashboard`. All other locale files updated via `cd apps/dashboard && pnpm translate`.

## Implementation Order

1. **Types + builder.** Add `LandingLearnerAccount` to `types.ts`; add `org-landing-learner-account.ts`; add the translation keys and run `pnpm translate`.
2. **Component.** Build `learner-menu.svelte` + the theme segmented control. Run `pnpm --filter @cio/ui prefix` and verify with `pnpm --filter @cio/ui prefix:check`.
3. **Storybook.** Add the story file and `fields.ts` in the same change.
4. **Quartz wiring.** Thread `learnerAccount` through `buildOrgLandingPageProps()` and into `quartz/nav.svelte`. Verify against `prototypes/landing-learner-menu/learner-member.html`.
5. **Remaining 10 themes.** Same two lines per `nav.svelte`; check each against `themes.html`.
6. **Call sites.** Wire all six producer paths from the table in Technical Design → Builder, including the two that bypass `buildOrgLandingPageProps()` (`(org-site)/courses/+page.svelte`, which passes props straight to `NavComponent`, and `course-landing-page.svelte`, which uses `buildCourseLandingPageProps()`). Both settings previews get `inert: true`.
7. **Verify.**

   ```bash
   export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
   test -f apps/dashboard/.env || cp apps/dashboard/.env.example apps/dashboard/.env
   pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
   pnpm --filter @cio/ui prefix:check
   pnpm format:check
   ```

8. **Manual pass** in cloud mode against the seeded tenants: `?org=udemy-test` as `student@test.com` (member), as `enterprise-student@test.com` (non-member), and logged out.

## Acceptance Criteria

1. Logged out, the landing nav renders exactly as it does today in all 11 themes — no avatar, no skeleton, no layout shift.
2. Signed in as a member, the nav shows the CTA button and an avatar; the popover opens with identity, three learner items, theme row, log out, and a `Continue Learning` CTA (`landing.learner_menu.continue_learning`) to `/lms`.
3. Signed in as a non-member of an open academy, the popover omits `My Courses` and `My Certificates` and the CTA reads `Join Academy` → `/join-academy`.
4. Signed in as a non-member of an invite-only academy, or with `disableSignup`, or with a pending invite: no CTA renders in the nav or the popover; the popover still offers Account Settings, Theme and Log Out.
5. Self-hosted admin/tutor behaviour from `getOrgLandingAuthAction()` is unchanged; the helper's only change is the member branch's label key.
6. `Log Out` navigates to `/logout` and the subsequent landing render shows the logged-out nav.
7. Changing the theme in the popover persists and is in effect on arrival in `/lms`; the landing page's own appearance does not change.
8. The popover's colours, radii and typography match the surrounding theme in all 11 themes, with no app-token or hex colour in the component.
9. Between page load and `appInitApi` initialisation, the nav does not reflow — the skeleton occupies the avatar's final size.
10. In the settings landing-page preview the avatar renders and the popover does not open.
11. Keyboard, per the FR-2 focus model: the trigger is reachable by `Tab` and opens on `Enter` or `Space`; inside the card `Tab` moves between the three zones (link rows → theme control → CTA) and never steps row by row; arrow keys move within the focused zone and wrap; `Home`/`End` jump to the ends of the link group; focus stays trapped in the card; `Escape` closes from anywhere and restores focus to the trigger.
12. A screen reader announces the trigger as "Account menu, signed in as <email>", the link rows as links, and the theme control as a radio group. The identity block is not announced twice.
13. The menu renders on all six producer paths in the Builder table — including the public catalog and the public course landing page, which bypass `buildOrgLandingPageProps()`.
14. In both settings previews the trigger is not a button, no row is a link, and no interaction — pointer, `Enter`, `Space`, or programmatic `.click()` — can navigate or reach `/logout`.
15. A signed-in learner's nav renders at most two states between first paint and ready (skeleton, then avatar), never a logged-out nav first.
16. The nav CTA and the popover CTA always show identical label and href, in every locale and every state.
17. All copy resolves through translation keys; no literal strings in components; every locale file updated.
18. A Storybook story exists covering all states listed in the Component section.
19. Zero regression on existing features: public catalog, public course landing page, landing-page editor, `authAction` behaviour, and the LMS sidebar menu are unaffected.

## Decision Log

- **2026-09-10 / PR #1091 — card is a labelled `dialog`, not a `menu`.** The original FR-2 specified `role="menu"` + `role="menuitem"` rows, but the card also contains a theme `radiogroup` and a CTA button, which `menu` semantics cannot legally contain. The pure-menu alternative (converting the theme control to `menuitemradio`) would collapse the zoned keyboard model into one APG menu list and change SR announcements away from AC-12's "radio group". Accepted: `role="dialog"` + `aria-label`, Zone 1 links as plain anchors grouped by `data-slot="lm-link"`, `radiogroup` unchanged, existing zone-trap keyboard handler untouched (still covered by AC-11). `prototypes/` intentionally still shows the old `menu` markup (out-of-scope design mocks).

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Portalled popover loses `--landing-*` variables and renders unstyled or with app colours | `Popover.Content` re-applies `themeStyle(theme)`; each `nav.svelte` passes its theme key. Covered by the Storybook story across all 11 themes |
| The theme toggle changes nothing visible on the page the learner is looking at, reading as broken | Keep the label plainly "Theme" (it is a preference, not a page switch); no dark-mode promise is made on the landing page. If support signal shows confusion, the fallback is dropping the row (Decision 7's rejected option), not adding landing dark mode |
| 11 near-identical `nav.svelte` edits drift over time | One shared component, one prop, two lines per nav. Any styling change lands in `learner-menu.svelte` only |
| Popover overflows on small screens or under a sticky nav | Right-aligned with an `8px` viewport inset and `z-index` above the sticky nav; mobile state is in `menu-states.html` |
| `$profile` is briefly empty on org sites, flashing an empty identity block | `loading: true` renders a skeleton trigger and suppresses the popover until `appInitApi.isInitializedAndReady` |
| Adding a second interactive control to the nav complicates the landing-page editor's section selection | `inert: true` in preview contexts; the `navigation` section cap keeps selecting the nav as a whole |
| Academies that use the landing page purely as marketing may not want an account affordance | Not configurable in v1 by design (Non-Goals). If asked for, it becomes a `landingpage.navigation.showAccountMenu` boolean — additive, no migration |
