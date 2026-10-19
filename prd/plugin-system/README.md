# Plugin Platform

Status: **approved direction, implementation in progress**

The platform foundation orders 1–8 are now represented in code: tenant-bound installation access,
the canonical capability registry and scope migration, hardened launch/bridge boundaries,
backend-client and signed lifecycle infrastructure, plugin isolation CI, immutable versioned
artifacts, and the first complete backend API slice (`organization.profile:read`). The next phase is
the broader public API expansion; do not activate additional planned scopes until their full
vertical slices satisfy the definition of done.

## Architecture

ClassroomIO plugins are independently versioned, installable applications with declarative
manifests. Plugin code must not depend on ClassroomIO source paths, private stores, internal API
clients, database queries, or session cookies.

The compatibility boundary consists of:

- the versioned plugin manifest;
- explicit permission scopes and installation grants;
- the public Plugin API and SDK;
- sandboxed iframe contributions or host-rendered declarative contributions;
- stable, host-owned contribution targets;
- authenticated remote plugin backends and signed lifecycle events;
- immutable artifacts, installation lifecycle, revocation, audit, and data-retention controls.

First-party plugins use the same public contracts and security boundaries as third-party plugins.
Official status affects catalog presentation and review but does not bypass permissions, tenant
isolation, sandboxing, or authorization.

## Canonical documents

- [Public Plugin API v1](./public-plugin-api-v1.md) defines permission naming, the initial 30
  permission scopes, their SDK/API mappings, authorization rules, and the end-to-end delivery plan.
- [Official plugins](../../../classroomio-plugins/README.md) documents the source layout and isolation
  rules for ClassroomIO-maintained plugins.
- [Certificate Studio porting plan](../../../classroomio-plugins/certificate-studio/PORTING_PLAN.md)
  defines the first complex full-page plugin and remote-backend implementation.
- [Official plugin UI and behavior parity](./official-plugin-ui-parity.md) records the donor-to-external
  audit, acceptance rules, remaining gaps, and delivery order for every official plugin.

## Plugin icons and images

A plugin may render any images, icons, fonts, or UI framework assets inside its sandboxed UI.
For a plugin image rendered by the ClassroomIO host (catalog entries, navigation, and declarative
host actions), the manifest declares a packaged artifact-relative icon:

```json
{
  "icon": { "resource": "assets/icon.svg" }
}
```

The host resolves that path only against the approved, immutable artifact for the installed plugin
version. It does not accept arbitrary remote image URLs. SVG, PNG, JPEG, and WebP are supported;
invalid or unavailable assets fall back to the generic plugin icon. Contributions can use the same
`icon` object when the host renders their navigation item or action.

## Non-negotiable boundaries

1. Every ClassroomIO data read, write, event subscription, and privileged host action requires a
   documented public contract and explicit grant.
2. Manifest declarations and hidden UI are not authorization. The server validates installation,
   organization, actor, scope, resource, contribution surface, and current plugin status.
3. Custom plugin UI runs in the plugin sandbox. The bridge provides only UI-host services, surface
   context, and a one-time backend launch code. Protected data access goes through the plugin's own
   backend and `/plugin-api/v1`.
4. A plugin requiring relational data owns its backend schema and migrations outside the core
   ClassroomIO database.
5. Plugin backend code does not run inside the core API process and does not mount private routes in
   the ClassroomIO API.
6. Core implementation details may change without breaking a conforming plugin.
7. A capability is not available merely because its scope name exists. It becomes active only after
   its complete backend API, authorization, tests, documentation, and operational controls ship.

Official plugins may use local links to `@classroomio/*` boundary packages during development. The
published-dependency check rejects `file:`, `link:`, and `portal:` dependencies; the publishing
workflow must resolve those packages from packed or published artifacts.

## Local validation workflow

Set `PLUGIN_ARTIFACTS_PATH` in `apps/api/.env` to the absolute path of the official plugin
repository's `.plugin-artifacts` directory. Then run these commands from `classroomio-plugins`:

```bash
node ../classroomio/packages/plugin-sdk/bin/cio-plugin.mjs pack --all
node ../classroomio/packages/plugin-sdk/bin/cio-plugin.mjs seed --org <organization-id>
```

The seed command reads `CLASSROOMIO_PLUGIN_TOKEN` and installs only into the requested organization.
The official plugin's normal `npm run dev` remains the Vite UI server; `seed` packages the selected
plugin and explicitly installs or updates it in that organization so the dashboard can be tested
with the packaged artifact.

The published-dependency check is a separate deployment gate:

Run the published-dependency check from the official plugin repository's release workflow.

It intentionally fails until the official plugin repository replaces local boundary-package links
with packed or published versions of the SDK, design package, and certificate kit. The normal
release isolation check continues to validate code boundaries while local links remain enabled for
first-party development.

Historical documents describing `definePlugin`, `defineEntity`, in-process Svelte components,
plugin-owned handlers mounted inside the core API, or a manifest-free architecture have been
removed because they contradict this model.
