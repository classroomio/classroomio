# Hosted Plugin Platform Implementation Plan

Status: complete

## Implementation progress

Completed in the first Phase 0 slice:

- The public landing resolver no longer accepts a caller-selected template ID;
  it resolves only the saved organization appearance.
- Organization admins now activate landing templates through a dedicated,
  audited route, bound to an installation, contribution, and declared template.
- Organization admins can preview a declared template through a separate
  authenticated resolver using the same three identifiers.
- The dashboard carries a contribution ID through the plugin-frame action
  event, uses the dedicated activation route, and uses the authenticated
  preview resolver for plugin templates.
- Generic organization updates reject a new or changed plugin appearance, so
  they cannot be used as an alternate activation path.
- The public plugin descriptor now records the installation and contribution
  that produced it, in addition to its immutable artifact identity.
- `landing.templates` now has a target-specific manifest contract: a custom
  picker entrypoint, public-renderer entrypoint, public view-model version,
  declared templates, and packaged thumbnail for every template.
- Release validation rejects a landing-template artifact when a declared
  thumbnail is missing.
- The public renderer bridge is now part of `@classroomio/plugin-sdk` and uses
  a nonce-bound `MessagePort`; the public frame no longer grants
  `allow-same-origin` or accepts unrestricted window messages.
- The landing-template plugin consumes the SDK public view model, renders
  structured embed URLs directly, and no longer uses remote fallback imagery
  or raw HTML rendering.
- Hosted manifests reject remote runtime, webhook, event-subscription, generic
  command, unsupported action, and unsupported slot declarations. The v1
  production contract permits only mounted custom slots, host-rendered
  certificate URL actions, organization navigation, and plugin pages.
- The generic bridge action channel has been removed. The SDK exposes typed
  course, lesson, exercise, landing-template, and certificate-template
  operations, and the reference plugins have been migrated to them.
- The permission registry now exposes only browser-backed capabilities that
  have a host effect. Unsupported data and mutation scopes are planned rather
  than release-enabled; certificate-template application is grant-checked at
  the host boundary.
- Manifest-declared installation settings now use a bounded JSON-schema
  contract and are validated on both install and update.
- Every current first-party release manifest declares `dataPolicy`; navigation
  entries use the supported organization-navigation location.

The remaining phases are also implemented:

- The hosted browser SDK now exposes typed identity, organization, course,
  lesson, exercise, progress, certificate, certificate-template, storage, and
  capability-discovery APIs through the existing `/plugins` route family.
- Bridge requests use runtime payload validation, typed error codes, bounded
  request and response sizes, and server-side authorization for every data
  operation.
- Supported contribution targets have versioned host contracts for ordering,
  visibility, page mode, sizing, loading, errors, accessibility, and mobile
  behavior. Organization navigation resolves each declared contribution.
- Plugin storage enforces declared documents, scopes, schema versions, JSON
  schemas, quotas, pagination, optimistic concurrency, usage reporting,
  export, deletion, and uninstall retention. Simple settings schemas render in
  the host and are validated on install and update.
- The SDK publishes its manifest schema, generated declarations, mock hosts,
  role fixtures, public-renderer helpers, and a conformance kit. Documentation
  covers the supported manifest, browser APIs, and contribution surfaces.
- All seven release-enabled plugins were migrated to the bounded contract and
  pass checks, tests, builds, canonical packaging, and release verification.

## Objective

Make ClassroomIO a deliberately bounded hosted-plugin platform. A plugin is a
reviewed, immutable frontend artifact that runs in a ClassroomIO-controlled
sandbox, contributes to documented host surfaces, calls only typed bridge
capabilities, and persists installation-owned state in ClassroomIO plugin
storage.

This plan intentionally does not support plugin-owned backends, plugin-owned
databases, direct access to ClassroomIO sessions, or arbitrary modification of
the host UI.

## Product boundary

### Supported

- Sandboxed custom UI in documented contribution surfaces.
- Host-rendered actions where the host owns the button and execution behavior.
- Full plugin pages and organization navigation entries.
- Plugin installation, enablement, approval, upgrade, and uninstall through
  the reviewed `classroomio-plugins` release workflow.
- Namespaced organization, user, and resource plugin state in ClassroomIO
  storage.
- A curated set of ClassroomIO data and commands, made available through the
  browser bridge and enforced by the ClassroomIO API.
- Direct browser access to explicitly allowlisted external origins when a
  plugin does not need a secret or a plugin-managed backend.

### Out of scope

- Plugin-owned backend services, backend credentials, launch-code exchanges,
  and remote plugin webhooks.
- Direct database access, direct internal API access, session cookies, or
  ClassroomIO bearer tokens.
- Arbitrary host DOM injection, route replacement, or unrestricted iframe
  permissions.
- Generic course, grade, enrollment, or certificate mutation scopes.
- Arbitrary files, media storage, unbounded exports, or analytics warehouses.

## Audit of the current implementation

The recent landing-template work proves an important new pattern: an approved
plugin can provide an admin picker and public renderer while ClassroomIO owns
installation lifecycle, the selected appearance, the sanitized public view
model, and native fallback behavior. This should become the reference design
for future hosted-plugin surfaces.

### Existing strengths

- Immutable, digest-addressed artifacts and review-gated release registration.
- Manifest validation, scope grants, installation state, audit records, and
  isolated plugin storage.
- Sandboxed authenticated plugin frames with the existing bridge for context,
  resize, toast, navigation, preferences, storage, and host actions.
- Mounted `lms.banner`, `course.sidebar`, `lesson.after`,
  `certificate.actions`, `certificate.templates`, `landing.templates`, and
  `plugin.page` integrations.
- A public landing descriptor that resolves an approved installed plugin and
  falls back safely to a native landing theme when the installation or declared
  template is no longer valid.
- A minimized public landing-page view model rather than passing organization
  records to a public plugin.

### Immediate landing-template findings

1. `landing-templates/plugin.json` is release-enabled but omits required
   `dataPolicy`. The core manifest schema requires it, so the production
   release registration path can reject the artifact.
2. The public landing bridge is separate from the plugin SDK and communicates
   through unrestricted `window.postMessage(..., '*')`. It needs a stable,
   target-specific public-surface bridge contract.
3. The dashboard handles `landing.templates` selection by writing the
   organization landing-page object directly. That bypasses
   `activateLandingTemplate`, which performs server-side template validation
   and writes the activation audit event.
4. The unauthenticated public descriptor endpoint accepts a `templateId` and
   searches every active landing-template plugin. This makes previews
   ambiguous when template IDs collide and makes inactive selections public.
   Authenticated editor preview and public applied-template resolution must be
   separate operations.
5. The public render entrypoint is an undocumented convention named `render`.
   `landing.templates` needs explicit picker and public-renderer entrypoints in
   its target-specific manifest contract.
6. The landing-template plugin independently redefines and normalizes the
   public view-model type. It should consume the published public contract so
   host and plugin cannot drift.
7. The renderer creates HTML from embed URLs and template components render
   `embed.code` with `{@html}`. A URL validator that only checks the leading
   scheme is insufficient when that value is interpolated into HTML. The
   public contract must expose structured, allowlisted embed data; plugins must
   render iframe attributes directly and never render author-controlled HTML.
8. The template renderer uses Unsplash fallback images, but the manifest does
   not declare the Unsplash origin in `networkAccess.allowedDomains`. The
   plugin asset CSP can therefore block those images. Prefer packaged assets;
   otherwise require the exact image origin in the manifest and review it.
9. The public landing frame grants `allow-same-origin` and uses an ad hoc
   handshake. The final public-frame policy should use the minimum sandbox
   permissions and authenticated/validated messaging appropriate to an opaque
   plugin frame.
10. The landing-template picker includes hardcoded user-facing English copy.
    Public plugin copy needs a plugin-owned localization strategy and locale
    context from the host.

### General platform findings

- The manifest still declares a remote `runtime.backend`, a webhook path, and
  event subscriptions even though the target architecture is hosted-only.
- The capability registry contains more active scopes than the bridge exposes
  as usable typed methods. Plugin authors currently use string actions such as
  `courses:list` instead of a public browser API.
- Several manifest targets and action modes are accepted but have no host
  renderer or handler. A release-enabled manifest must not be able to declare
  inert functionality.
- `settings.schema` and storage document schemas are declaration-only; the
  host does not validate settings or storage values against them.
- Storage lacks compare-and-swap versions, schema migrations, and automatic
  retention enforcement.

## Architecture decisions

1. `/plugins` remains the single root for all plugin-related ClassroomIO
   routes. No separate plugin API root or plugin-owned backend transport is
   introduced.
2. Plugin code calls ClassroomIO through `@classroomio/plugin-sdk` only. The
   dashboard host invokes the authenticated `/plugins/installations/...`
   routes on the plugin's behalf.
3. Every exposed capability is browser-safe, surface-bound, and authorized by
   the current installation, organization, actor role, grant, and resource.
4. A manifest field, scope, target, or action mode is release-enabled only
   after an external plugin in `classroomio-plugins` proves it end to end.
5. Public plugin renderers receive a target-specific minimized view model;
   they never receive raw organization records, session data, or arbitrary
   author HTML.
6. This is a pre-production cutover. There are no customer installations to
   preserve, so the hosted-plugin contract may make intentional breaking
   changes without a runtime compatibility layer. Every existing
   release-enabled plugin must be migrated in `classroomio-plugins` before the
   new contract is considered complete.

## Breaking-change and plugin migration policy

The hosted-plugin implementation replaces an incomplete platform contract; it
does not preserve legacy behavior for released artifacts. The following are
intentional breaking changes:

- removal of plugin-owned backend, webhook, launch-code, and backend-audience
  declarations;
- replacement of generic bridge action strings with typed browser SDK methods;
- replacement of the public landing postMessage protocol with the SDK public
  renderer bridge;
- target-specific manifest requirements, including explicit landing picker and
  renderer entrypoints;
- removal of manifest targets, render modes, and action modes that have no
  implemented host behavior;
- validation of declared settings and storage data; and
- stricter public embed and iframe policies.

The migration is a coordinated source update across the two repositories:

1. Implement the new manifest, host bridge, route, and SDK contracts in
   ClassroomIO.
2. Update every release-enabled plugin source package to the new SDK and
   manifest in `classroomio-plugins`.
3. Rebuild and reseed every plugin against the updated ClassroomIO checkout.
4. Run artifact validation, release verification, and end-to-end host tests for
   every registry entry before enabling release.
5. Remove legacy implementation paths rather than retaining adapters.

Existing local development installations may need to be re-seeded after the
cutover. No production data migration, customer communication, or compatibility
window is required.

## Delivery plan

### Phase 0: fix and formalize the landing-template reference implementation

#### Core API and dashboard

- Add an authenticated organization-admin route for activating a landing
  template. It must call `activateLandingTemplate`; clients must no longer
  construct and persist a plugin appearance directly through the generic
  organization update route.
- Add an authenticated preview resolver addressed by installation ID,
  contribution ID, and template ID. Validate all three against the current
  organization and declared template metadata.
- Limit the unauthenticated public resolver to the selected, persisted
  appearance only. It must not accept a preview template ID.
- Make the public descriptor identify the specific contribution as well as the
  installation, plugin, immutable version, digest, template, and renderer
  entrypoint.
- Extend the manifest schema with a `landing.templates`-specific contribution
  form that explicitly declares:
  - picker entrypoint;
  - public renderer entrypoint;
  - template IDs, names, descriptions, and packaged thumbnails;
  - supported public view-model version.
- Replace the bespoke public landing postMessage protocol with a small SDK
  public-renderer client and host. Include typed `viewModel`, `resize`,
  `navigate`, and `auth` messages plus validation, a nonce, and a MessagePort.
- Remove `allow-same-origin` unless a documented requirement demonstrates it
  is necessary. Preserve the minimum capabilities required for rendering and
  safe navigation.
- Add server tests for activation, deactivation, invalid template IDs,
  wrong-organization installation IDs, stale versions, disabled installations,
  duplicate template IDs, authenticated preview, and public fallback.

#### Plugin repository

- Add the required `dataPolicy` to the landing-template manifest.
- Consume the published public landing view-model contract instead of keeping
  a permissive duplicate interface and normalization layer.
- Replace `{@html}` embed rendering with structured embed variants and direct
  iframe attributes. Enforce an allowlist of embeddable providers in the core
  projection layer.
- Replace remote fallback imagery with packaged assets, or add and review exact
  external image origins in `networkAccess.allowedDomains`.
- Use the host locale to select plugin-owned localized copy; avoid hardcoded
  English as the only runtime option.
- Add unit tests for the public bridge, renderer selection, safe embed inputs,
  navigation requests, and picker selection events.
- Migrate every existing release-enabled plugin to the new manifest and SDK
  contract in the same workstream. This includes the announcement banner,
  certificate studio, course calendar, landing templates, lesson
  acknowledgment, LinkedIn sharing, and reading-time plugins.

Acceptance criteria:

- The landing-template plugin passes manifest and artifact validation.
- Template activation always passes through server-side validation and audit.
- Public visitors can only receive the installed, selected template.
- A malformed embed or a forged frame message cannot execute script, alter host
  state, or bypass navigation sanitization.
- Every release-enabled registry plugin packs, validates, and passes its host
  integration tests against the new contract.

### Phase 1: align the hosted-plugin manifest with runtime support

- Remove `runtime.backend`, `webhookPath`, backend-audience data, launch-code
  types, and event subscription declarations.
- Publish the supported v1 targets:
  - `lms.banner`;
  - `course.sidebar`;
  - `lesson.after`;
  - `certificate.actions`;
  - `certificate.templates`;
  - `landing.templates`;
  - `organization.navigation`;
  - `plugin.page`.
- Mark `course.actions` and all experimental targets as unavailable until their
  host renderer, context, and tests exist.
- Remove unsupported render/action modes, or implement them before allowing
  them in production manifests.
- Add release validation that rejects unavailable targets, modes, capabilities,
  and missing target-specific metadata.

Acceptance criteria:

- Every valid production manifest field has a documented, tested host effect.
- No production plugin can publish an unavailable target or remote-backend
  configuration.

### Phase 2: ship a typed hosted browser SDK

- Replace generic plugin calls such as `client.action('courses:list')` with
  typed SDK namespaces. Do not retain generic action-string compatibility for
  supported capabilities.
- Begin with:
  - `context.get()`;
  - `theme.get()` and theme updates;
  - `ui.toast()`, `ui.resize()`, and dirty-state handling;
  - `navigation.open()` for host-relative navigation;
  - `storage.get/set/delete/list()`;
  - `organization.getProfile()`;
  - `identity.getCurrent()`;
  - `courses.list/get/getStructure()`;
  - `lessons.list/get/getContent()`;
  - `exercises.list/get()`;
  - `progress.getCurrent/setCompletion()`;
  - `certificates.list/get()`;
  - `certificateTemplates.list/getApplied/apply()`.
- Add typed bridge error codes, capability discovery, runtime schemas, and
  request/response size limits.
- Keep all core authorization in ClassroomIO. The iframe receives only the
  values necessary for the declared surface.

Acceptance criteria:

- A plugin does not use raw bridge action strings for supported capabilities.
- Every SDK method has a route, service, authorization check, runtime schema,
  error contract, and conformance test.

### Phase 3: complete supported contribution-surface contracts

For each supported target, publish a versioned context and rendering contract:

- placement and ordering rules;
- role and page-mode visibility;
- resource IDs and allowed host capabilities;
- desktop and mobile behavior;
- iframe size limits and resize semantics;
- loading, error, and disabled-state behavior;
- accessibility and focus behavior;
- allowed action handoffs.

Implement the currently incomplete host concepts only where they serve a
supported category:

- typed certificate actions and safe URL interpolation;
- a real dialog/sheet action if needed;
- individual organization-navigation entry placement and visibility;
- a command registry only if a concrete plugin needs host commands.

Acceptance criteria:

- Each target has a reference plugin and host integration test.
- Multiple plugins can contribute to a target predictably.

### Phase 4: make storage and settings production-ready

- Validate installation settings against manifest-declared schemas on install
  and update.
- Provide host-rendered settings for simple schemas and plugin pages for
  advanced configuration.
- Enforce declared storage namespaces, scopes, schema versions, and value
  schemas.
- Add record versions and conditional writes to prevent lost updates.
- Add storage migrations, quota/usage reporting, pagination, and automatic
  retention/deletion enforcement.
- Expose organization-admin controls for plugin data export and deletion.

Acceptance criteria:

- Plugins can safely persist settings and small structured state without a
  custom backend.
- Uninstall behavior matches the declared data policy.

### Phase 5: harden the developer and release experience

- Publish the manifest schema and generated SDK types as stable boundary
  packages.
- Add a local mock host for every supported target and public renderer.
- Add fixture contexts for admin, tutor, learner, and public surfaces.
- Add a conformance kit that validates manifest compatibility, bridge behavior,
  capability authorization, storage isolation, and disabled/uninstalled state.
- Require a reference-plugin test for every newly activated capability or
  target.
- Keep the GitHub PR review and trusted post-merge release workflow as the
  only production publication path.

Acceptance criteria:

- A contributor can build and test a supported plugin entirely in
  `classroomio-plugins` without importing a ClassroomIO application path or
  changing ClassroomIO for that plugin.

## Deferred work

Do not add these until a concrete reviewed plugin requires them:

- learning activities, submissions, grades, and authoring mutations;
- enrollment, cohort, and member-directory access;
- notifications and messaging;
- generic commands, dialogs, or arbitrary host slots;
- file/media storage;
- OAuth, secrets, or a plugin backend model;
- asynchronous external webhook delivery.

Each future capability must be delivered as a complete vertical slice:
manifest declaration, scope/grant, typed SDK method, core route/service/query,
surface binding, audit, tests, documentation, and an external reference plugin.

## Verification completed

All final checks were run with Node 20.19.3:

- `@cio/utils`: 34 test files, 398 tests passed.
- `@classroomio/plugin-sdk`: 7 test files, 29 tests passed; production build
  passed.
- Plugin API authorization, release, storage, installation, and landing
  lifecycle suites: 5 test files, 60 tests passed.
- API dependency graph and API production builds passed.
- Dashboard production build passed with the required increased Node heap.
- Developer documentation static build passed.
- Migration `0039_plugin_platform_complete` is the branch's only migration,
  and its journal timestamp is later than the latest migration on
  `origin/main`.
- `classroomio-plugins`: every release-enabled plugin passed checks, tests,
  and builds; canonical packaging produced seven artifacts and
  `release:verify` verified all seven.
