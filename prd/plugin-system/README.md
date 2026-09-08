# Plugin System — proposal

Status: **proposal** (design direction for review, not a build-ready PRD)

## Purpose

Make ClassroomIO the easiest LMS to customise to any shape a user wants.

The goal is not a plugin marketplace. It is that a developer who opens the repo can change one
typed file, see the app become theirs, and understand the whole extension model in five minutes.
A marketplace is a possible consequence of that; it is not the thing being built.

## The mission test

Every decision here is judged against one question: **how long between a developer opening the
repo and them seeing the app look like their product?** If the answer is measured in weeks of
reading protocol specs, the design has failed regardless of how capable it is.

## Problem Statement

ClassroomIO is customisable only by forking and editing core files:

- Navigation is a module-level constant (`baseNavConfig` in
  `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`), not configuration.
- The app shell is hardcoded — `routes/(app)/org/[slug]/+layout.svelte` composes
  `Sidebar.Provider` + `OrgSidebar` + `AppHeader` directly. There is no way to render the same app
  with a top navigation instead.
- Lesson content is a fixed set of columns on the `lesson` table. A new kind of learning activity
  (role play, flashcards, upload-and-critique) cannot be added without a schema change plus edits
  across the dashboard, API, and DB layers.
- Certificate templates are five hardcoded modules in `packages/certificates/src/templates/`.
- Copy is a single `en.json` per locale; an organisation cannot rename "Course" to "Module".
- Deployment-mode behaviour is decided by `PUBLIC_IS_SELFHOSTED` checks scattered across the
  dashboard and API rather than by resolved capability flags.

Every one of those is a fork today, and a fork is a customer who can never upgrade.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Navigation as data | available | `getOrgNavigationGroups()` returns `NavGroup[]`; breadcrumbs are data too (`breadcrumb-configs.ts`). The sidebar is already just one renderer over this. |
| Typed definition registry | available | `@cio/question-types` is a registry + contract + capability flags + serializer, consumed identically by dashboard, API and `@cio/ui`. This is a plugin type in all but name. |
| Component-registry theming | available | `LandingPageThemeBundle` in `packages/ui/src/custom/org-landing-page/types.ts` maps `{ nav, hero, courseCard, org, course }` per theme — a slot map that has no extensible section list. |
| Sandboxed browser runtime | available | `apps/embeds` ships CDN ES-module bundles with a `mount(el)` contract, a hosted iframe and an injected `window.CIO.apiBaseUrl`. |
| Signed event surface | planned | `prd/webhooks` defines the envelope and `X-Cio-Signature-256` scheme. |
| Auth extension seam | available | Better Auth plugins already exist (`packages/db/src/auth/plugins/`). SSO itself is shipped (`prd/enterprise-sso [DONE]`, `sso_provider` table). |
| UI building blocks | available | 48 `packages/ui/src/base` + 48 `packages/ui/src/custom` component families. |
| Swappable app shell | missing | Layout is hardcoded per route group. |
| Plugin-owned data | missing | No place for a plugin to persist its own records. |
| Pluggable activity types | missing | `lesson` is a fixed wide table; no `activityType` dispatch. |
| Plugin server logic | missing | No mount point for plugin HTTP handlers. |
| Completion / grade write-back | missing | Nothing outside core can mark completion or contribute a grade. |
| Config surface | missing | No `classroomio.config.ts`; no per-org serialized equivalent. |

The pattern: **the contracts mostly exist and are individually good. What is missing is one
surface that names them, and the two primitives (data, server) that make them add up to a
feature rather than a decoration.**

## Data Sources Checked

- `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
- `apps/dashboard/src/lib/features/ui/sidebar/org-sidebar/org-sidebar.svelte`
- `apps/dashboard/src/routes/(app)/org/[slug]/+layout.svelte`
- `packages/question-types/README.md`, `packages/question-types/src/`
- `packages/ui/src/custom/org-landing-page/types.ts`
- `packages/certificates/src/templates/`
- `packages/db/src/schema.ts` (`lesson`, `course.type`, `sso_provider`)
- `packages/db/src/auth/plugins/`
- `apps/embeds/README.md`
- `prd/webhooks/README.md`, `prd/public-api [DONE]/`, `prd/enterprise-sso [DONE]/`

## Proposed Direction

Model ClassroomIO on **Payload, Nuxt, Astro and shadcn** — a framework you configure and compose
in TypeScript — not on **Moodle** — a product with a plugin registry and a review board.

### Layer 0 — `classroomio.config.ts`

One typed file. No JSON manifest, no schema to memorise: the type is the documentation and
autocomplete is the tutorial.

```ts
import { defineConfig } from '@classroomio/sdk';
import { topNav } from '@classroomio/layout-topnav';

export default defineConfig({
  layout: topNav(),
  theme: { primary: '#0F62FE', radius: 'sm', font: 'Geist' },
  nav: {
    remove: ['community', 'tags'],
    rename: { courses: 'Modules' },
    add: [{ title: 'Renewals', path: '/renewals', icon: BellIcon, group: 'content' }]
  },
  terminology: { course: 'Module', student: 'Employee' },
  plugins: [xpLeaderboard(), certificateStudio()]
});
```

This covers most of what people actually want, and it is close to the current code because nav,
breadcrumbs, theme tokens and copy are already data — just resolved from constants instead of
from config.

### Layer 1 — a plugin is a function

```ts
export const xpLeaderboard = definePlugin((options) => ({
  name: 'xp-leaderboard',
  nav: { add: [{ title: 'Leaderboard', path: '/leaderboard' }] },
  routes: { '/leaderboard': LeaderboardPage },
  slots: { 'dashboard.widgets': XpWidget },
  on: { 'lesson.completed': (event, ctx) => ctx.data.points.increment(event.userId, 10) }
}));
```

`(config) => config` plus registrations. No manifest file, no version negotiation, no registry to
publish to — install with `pnpm add`, add to the array. Composable, unit-testable, type-checked.
The same authoring shape for a five-line theme tweak and a two-thousand-line integration.

### Layer 2 — slots and shells, rendered in-process

Named slots that take real Svelte components, rendered inside the app with full theme access — no
iframe, no `postMessage` bridge. Plugin UI feels native because it is native.

The proof that the seam is real: **ship our own two layouts as plugins.**
`@classroomio/layout-sidebar` (default) and `@classroomio/layout-topnav` go through the same door
a contributor uses. If core doesn't use the extension point, the extension point is decoration.

### Layer 3 — the primitives that make plugins features, not decorations

Slots and config only reach presentation. Two additions carry the rest:

**`defineEntity` — plugin-owned data.** A plugin declares a typed schema and gets namespaced
storage plus generated CRUD, scoped to org + plugin + permission. Relationships are real FK
columns (`orgId`, `courseId`, `lessonId`, `userId`), never ids buried in a JSONB blob.

```ts
const turns = defineEntity('roleplay_turn', {
  scope: ['org', 'course', 'lesson', 'user'],
  fields: { role: 'text', content: 'text', score: 'int' }
});
```

This is the highest-leverage item in the whole proposal. Without it, every non-trivial plugin
needs its own hosted backend, which excludes the weekend contributor the mission depends on.

**`defineActivityType` — the pluggable unit of learning.** `defineQuestionType` one level up: an
activity kind with `edit` / `take` / `review` renderers, a completion contract and an optional
grade. Needs one schema change — `lesson.activityType` (varchar, default `'standard'`) — so the
lesson renderer dispatches on it.

```ts
export default defineActivityType({
  key: 'ROLE_PLAY',
  label: 'Role play',
  renderers: { edit: ScenarioEditor, take: ChatRunner, review: TranscriptReview },
  completion: (state) => state.turns >= 6 && state.rubricScore >= 0.7,
  grade: (state) => state.rubricScore
});
```

**`defineServerHandler` + write-back.** Plugin HTTP handlers mounted at
`/api/plugins/:id/*` in-process on self-host, and reached over HMAC-signed HTTP for untrusted
cloud plugins — same authored code, different mount. Plus `ctx.completion.mark()` and
`ctx.grade.set()`, the equivalent of LTI's Assignment & Grade Services, so a plugin activity
participates in progress, certificates and compliance status instead of sitting beside them.

## Capability vs Trust

These are separate axes, and conflating them is what makes plugin systems boring.

| | What a plugin *can* do | *Who* may run one |
| --- | --- | --- |
| Keep maximal | activity types, own data, own server routes, own landing sections, own layout | — |
| Restrict hard | — | self-host: anything. cloud: first-party + verified only, to start. |

Capping capability costs the mission. Capping trust costs nothing early, because the first plugins
are ours and self-hosters already accept that bargain — the same one Moodle makes.

| | Self-host / fork | Cloud |
| --- | --- | --- |
| Config | Full, compile-time, in-process | The serializable subset (theme, nav, layout, terminology, toggles), stored per-org and edited in a settings UI |
| Code plugins | Anything — your box, your build, no sandbox needed | First-party + verified only |
| Third-party integrations | webhooks / REST / embeds | webhooks / REST / embeds (unchanged) |

One config surface in both places; cloud persists the JSON-able part. That collapses the future
"no-code theme editor" and the self-host config file into one system instead of two.

## Packaging Changes This Implies

1. **Publish the building blocks** — `@classroomio/sdk` (`defineConfig`, `definePlugin`,
   `defineActivityType`, `defineEntity`), `@cio/ui` as public `@classroomio/ui`,
   `@classroomio/question-types`.
2. **Make `apps/dashboard` thin.** Route files become short compositions over feature components
   exported from a `@classroomio/lms` package, so the maximal-customisation user builds their own
   SvelteKit app and imports our screens. This is shadcn's "you own the code" endgame and the real
   ceiling on customisability.
3. **Config-drive the four hardcoded things** — `baseNavConfig`, the app shell, `en.json` copy
   (needs a terminology override layer over `$t`), and the scattered `PUBLIC_IS_SELFHOSTED` checks
   (should be capability flags resolved from config).
4. **`npm create classroomio-app`** plus an in-repo `apps/example-custom` that looks nothing like
   the default — proof inside the monorepo, kept honest by CI.

## Sequencing

| # | Step | Why here |
| --- | --- | --- |
| 1 | `@classroomio/sdk` + `defineConfig`; wire theme, nav, terminology | Visible win, no new architecture |
| 2 | `app.shell` slot; extract current layout as `layout-sidebar`; ship `layout-topnav` | The launch demo, and the dogfood proof |
| 3 | `definePlugin` + `on()` hooks over the webhook event catalog | Every webhook becomes a hook for free |
| 4 | `defineEntity` | Unblocks everything below it |
| 5 | `defineActivityType` + completion/grade write-back | Role play ships here; needs the `lesson.activityType` migration |
| 6 | `defineServerHandler` (self-host in-process first) | Logic-bearing plugins |
| 7 | `landing.sections` + anonymous read scope | Public-facing plugins ship here |
| 8 | Cloud third-party tier: sandbox, scopes, registry | Only if demand proves it |

Steps 1–3 are the launch. Steps 4–5 are what make the launch still mean something six months
later. Step 5 carries the only migration, so the `lesson.activityType` column is worth deciding on
early even if it is built late.

## The Artifact That Sells It

Not a manifest specification. A thirty-second clip: one line changes, the sidebar becomes a top
nav, nothing breaks. Then a twenty-line plugin file that adds a nav item, a page and a dashboard
widget. The README opens with the diff, not an architecture diagram.

```diff
- layout: sidebar(),
+ layout: topNav(),
```

## Companion Docs

| Doc | Contents |
| --- | --- |
| [`extension-points.md`](./extension-points.md) | The slot and primitive catalog, with the existing contract each one reuses |
| [`launch-plugins.md`](./launch-plugins.md) | Five plugins to build first, chosen against Moodle's most-installed list |
| [`alternatives-considered.md`](./alternatives-considered.md) | Why not the manifest + sandbox + registry design, and what that research got right |

## Open Questions

- How far does the report read surface go before it becomes user-authored SQL?
- Does terminology override belong in the translation layer or above it?
- Does the anonymous read scope for public-facing plugins need per-section rate limiting?
- Is `@classroomio/lms` (step 2 of packaging) a real package or a documented copy-out pattern?

## Not In Scope

- A public plugin registry or submission review process.
- A WASM plugin runtime.
- LTI 1.3 conformance. Worth doing on its own merits for institutional interop; it is not the
  customisability story and should not gate it.
- Untrusted third-party code on multi-tenant cloud.
