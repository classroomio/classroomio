# Hosted Plugin Platform Implementation Plan

Status: core hosted platform implemented; developer tooling and storage operations remain partial

## Objective

ClassroomIO is a deliberately bounded hosted-plugin platform. A plugin is a reviewed, immutable
frontend artifact that runs in a ClassroomIO-controlled sandbox, contributes only to documented
host surfaces, calls typed browser-bridge capabilities, and persists installation-owned state in
ClassroomIO plugin storage.


## Architecture decisions

1. `/plugins` is the single root for plugin-related application routes. Hosted data is served under
   `/plugins/installations/:installationId/data/*`; storage and installation lifecycle operations
   remain under the same root.
2. Plugin code calls `@classroomio/plugin-sdk` inside an iframe. The dashboard host performs
   authenticated API requests on behalf of the current user and returns only the approved result.
3. Plugin data lives in ClassroomIO's installation-scoped storage. Plugins do not receive or
   manage a server runtime.
4. Every capability is installation-, organization-, actor-, grant-, and resource-aware.
5. Public renderers receive target-specific minimized view models. They do not receive authenticated
   hosted-data capabilities, raw organization records, or arbitrary author HTML.
6. Production publication is source-controlled and review-first. Trusted CI builds and registers
   immutable releases after a pull request is merged in `classroomio/plugins`.
7. This was a pre-production breaking cutover. Existing reference plugins were migrated to the
   bounded manifest and SDK instead of retaining legacy adapters.

## Implemented contract

### Manifest and release boundary

- Strict version-1 manifest validation with reverse-domain IDs, SemVer versions, packaged assets,
  declared UI entrypoints, data policy, exact network origins, settings schema, and storage
  documents.
- Supported targets are `lms.banner`, `course.sidebar`, `lesson.after`, `certificate.actions`,
  `certificate.templates`, `landing.templates`, `organization.navigation`, and `plugin.page`.
- Unsupported backend runtime, webhook, event subscription, generic command, target, render-mode,
  and action declarations are rejected rather than accepted as inert configuration.
- Landing templates declare a picker, public renderer, public view-model version, templates, and
  packaged thumbnails.
- Catalog releases are digest-addressed and registered by the internal trusted-CI release route.

The runtime validator in `packages/utils` is authoritative. The SDK package does not currently ship
a standalone `plugin.v1.json` JSON Schema.

### Hosted UI and public rendering

- Custom plugin UI runs in iframes with scripts and forms, without same-origin access.
- The version-1 host bridge provides context, capability discovery, theme synchronization, toast,
  resize, dirty state, host-relative navigation, browser-local preferences, plugin storage, and
  typed hosted data methods.
- Requests and responses have size bounds, payload validation, typed error codes, and timeouts.
- Surface contracts define ordering, visibility, page modes, resource type, height bounds, and
  mobile compatibility.
- Organization navigation resolves declared plugin pages.
- Certificate actions are limited to host-rendered HTTPS URL actions whose origins are allowlisted.
- Certificate and landing template surfaces use typed application, preview, and selection handoffs.
- The public landing renderer uses its own nonce-bound `MessagePort` contract and minimized
  version-1 view model.

The host bridge does not expose native modals, dialogs, generic commands, or arbitrary action
strings to plugin code.

### Active typed data capabilities

- `identity.profile:read`
- `organization.profile:read`
- `course.metadata:read`
- `course.content:read`
- `lesson.metadata:read`
- `lesson.content:read`
- `learner.progress:read`
- `learner.progress:write`
- `exercise.metadata:read`
- `certificate.issued:read`
- `certificate.template:read`
- `certificate.template:write`
- `plugin.storage:read`
- `plugin.storage:write`

The public SDK exports self-contained TypeScript response types. The API validates and authorizes
hosted data, while the browser client currently trusts successful host response shapes rather than
parsing every response through a bundled runtime schema.

### Storage and settings

- Settings values are checked against the manifest's bounded JSON-schema subset on install and
  update.
- Simple settings schemas can be edited through the host settings surface.
- Storage access requires a declared namespace and scope plus the appropriate read/write grant.
- Organization, user, and active-resource scopes are supported.
- Stored values are checked against the declared schema and schema version.
- Storage supports pagination, record metadata, compare-and-set versions, quotas, usage reporting,
  export, deletion, and uninstall retention handling.
- Usage, export, and deletion exist as organization-admin API operations.

There is no automatic schema migration runner and no organization-admin dashboard UI for storage
usage, export, or deletion yet.

### Reference plugins

The release-enabled plugins in `classroomio/plugins` were migrated to the hosted contract:

- announcement banner;
- certificate studio;
- course calendar;
- landing templates;
- lesson acknowledgment;
- LinkedIn sharing;
- reading time.

Their manifests, SDK calls, and landing public renderer no longer rely on removed backend or generic
bridge contracts.

## Remaining implementation work

### Developer boundary artifacts

- Generate and publish a versioned JSON Schema for `plugin.json`, or deliberately document Zod/CLI
  validation as the only supported validation format.
- Decide whether browser responses need bundled runtime parsers in addition to exported TypeScript
  declarations and API-side validation.
- Add an exported mock host for each supported custom target and for the public landing renderer.
- Add reusable admin, tutor, learner, and public fixture contexts.
- Turn the repository's conformance tests into a supported kit that external plugin repositories can
  run without importing ClassroomIO application paths.

### Storage operations

- Define and implement a migration mechanism if plugins need automatic stored-document upgrades.
- Add organization-admin dashboard controls for usage inspection, export, and deletion if those
  operations should be user-facing rather than API-only.
- Add focused retention tests for every uninstall and reinstall state transition.

### Surface quality

- Add host integration coverage for every supported target, including multiple-contributor
  ordering, disabled installations, loading, browser frame errors, and mobile layouts.
- Improve frame failure UI if retry or diagnostic behavior becomes a product requirement.
- Add a concrete host dialog or command contract only when a reviewed reference plugin requires it.

## Deferred capabilities

The capability registry keeps these unavailable until a complete vertical slice and reference
plugin exist:

- organization members and learner profiles;
- course authoring and enrollment management;
- lesson authoring;
- submissions and grading;
- certificate issuance and revocation;
- cohorts and memberships;
- aggregate analytics;
- notifications;
- files and media;
- secrets, OAuth, webhooks, background jobs, or plugin-owned backends;
- generic commands, dialogs, and arbitrary host slots.

Activating a future capability requires its manifest scope, grant policy, typed SDK method, core
route/service/query, surface binding, audit behavior, tests, documentation, and an external
reference plugin in the same delivery slice.

## Completion criteria for the remaining work

The developer-experience phase is complete only when a contributor can validate the manifest,
exercise every supported surface and actor fixture, and run the supported conformance suite from
`classroomio/plugins` without importing a private ClassroomIO source path or changing the core
repository for that plugin.

The storage-operations phase is complete only when the chosen migration policy is explicit and all
intended organization-admin operations have either a tested UI or are intentionally documented as
API-only.

## Verification commands

Run the checks with the repository's required Node version:

```bash
pnpm --filter @cio/utils test
pnpm --filter @classroomio/plugin-sdk test
pnpm --filter @classroomio/plugin-sdk build
pnpm --filter @cio/api^... build
pnpm --filter @cio/api build
pnpm --filter @cio/dashboard^... build
pnpm --filter @cio/dashboard build
pnpm --filter @cio/docs build
pnpm format:check
```

In `classroomio/plugins`, run the repository's checks, tests, builds, canonical packaging, and
release verification for every release-enabled registry entry.
