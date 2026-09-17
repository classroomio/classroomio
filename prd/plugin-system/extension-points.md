# Extension points and primitives

Reference catalog for the [plugin system proposal](./README.md). Each row names the existing
contract it reuses, because the cost of an extension point is mostly the cost of the contract
behind it.

## The five primitives

Everything a plugin can do is one of these. Keeping the list at five is the point — it is what
makes the model learnable in one sitting.

| Primitive | Means | Example |
| --- | --- | --- |
| `defineConfig` | "Change how the app is shaped." | Swap the layout, rename Course to Module |
| `definePlugin` | "Bundle a set of changes and ship it." | An XP plugin with a page, a widget and hooks |
| `defineEntity` | "I need to store my own records." | Role-play transcripts, attendance marks, points |
| `defineActivityType` | "I add a new kind of learning activity." | Role play, flashcards, upload-and-critique |
| `defineServerHandler` | "I need logic on the server." | An LLM turn loop, a scheduled export |

Supporting definition helpers (`defineQuestionType`, `defineCertificateTemplate`,
`defineAuthProvider`) are thin, typed wrappers over existing registries rather than new concepts.

## Slot catalog

| Slot | Kind | Reuses | Status |
| --- | --- | --- | --- |
| `app.shell` | component | `routes/(app)/org/[slug]/+layout.svelte` | Needs extraction |
| `app.nav` | data + component | `getOrgNavigationGroups()` → `NavGroup[]` | Data model exists |
| `app.header` | component | `features/ui/navigation/app-header.svelte` | Needs extraction |
| `dashboard.widgets` | component list | dashboard page composition | New |
| `course.format` | component | course shell renderer | New |
| `lesson.activity` | definition | `lesson.activityType` dispatch | Needs migration |
| `lesson.after` | component | lesson page composition | New |
| `question.type` | definition | `@cio/question-types` registry | **Contract exists** |
| `certificate.template` | definition (declarative) | `packages/certificates/src/templates/` | Registry-ise 5 modules |
| `landing.sections` | component list | `LandingPageThemeBundle` | Add `sections` to the bundle |
| `auth.provider` | definition | Better Auth plugins | Seam exists |
| `enrollment.method` | definition | invite / enrollment services | New |
| `content.importer` | definition | SCORM / CSV import work | New |
| `ai.tool` | definition | `packages/mcp` | Seam exists |
| `event.handler` | hook | webhook event catalog (`prd/webhooks`) | Catalog exists |

## Notes per group

**`app.shell` is the flagship.** It is the only slot whose payoff is immediately visible in a
screenshot, and the reason the whole proposal leads with layout rather than with question types.
Extracting it means moving `Sidebar.Provider` + `OrgSidebar` + `AppHeader` out of the route layout
and behind a resolved shell component, with the nav data passed in as props.

**`question.type` is nearly free.** `@cio/question-types` already has keys, DB id mapping,
capability flags, render contracts and answer serialization, consumed identically by dashboard, API
and `@cio/ui`. `defineQuestionType` is a typed wrapper over a registry that exists.

**`certificate.template` is the cheapest Moodle parity available.** Five hardcoded template
modules become a registry; templates are declarative, so this is also the one category safe to open
to untrusted authors on cloud from day one.

**`landing.sections` needs a new permission axis.** Landing pages are unauthenticated, and every
other slot in this catalog assumes a logged-in actor. Public-facing plugins need an anonymous read
scope, which is a genuine new concept rather than a config flag. Sections live inside
`org-landing-page/{theme}/` consuming `--landing-*` tokens; no parallel folder.

**`lesson.activity` carries the only migration.** `lesson.activityType` (varchar, default
`'standard'`) plus plugin-owned data via `defineEntity`. Worth agreeing on the column shape early
even if the feature lands late.

**`auth.provider` is for the tail, not for SSO.** SSO is shipped (`prd/enterprise-sso [DONE]`,
`sso_provider` table, settings page, license gate). The slot exists for LDAP / Active Directory, a
customer's bespoke internal IdP, and HRIS-driven provisioning. Self-host only — auth is the last
thing to open to untrusted code on cloud.

## Permission model

Plugins declare scopes; the runtime enforces the intersection of the plugin's declared scopes and
the acting user's own permissions. Scopes follow the existing API shape (`exercise:read`,
`submission:write`, `enrollment:read`, `completion:write`, `grade:write`).

Two scopes are new concepts rather than new strings:

- `data:own` — a plugin always has full access to entities it declared, and no access to another
  plugin's entities.
- `public:read` — the anonymous read scope required for landing-page sections, deliberately narrow
  and separately reviewed.

## What is deliberately absent

- **No manifest file.** The plugin's TypeScript *is* its manifest. A JSON file duplicating the
  types is a second source of truth that drifts.
- **No version negotiation protocol.** Semver on the SDK package, enforced by the compiler.
- **No iframe bridge for first-party or self-host plugins.** In-process rendering is what makes
  plugin UI indistinguishable from core UI. The iframe runtime stays where it belongs — untrusted
  third-party code, deferred to step 8.
